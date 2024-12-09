import i18next from "i18next";
import { action, runInAction } from "mobx";
import retry from "retry";
import formatError from "terriajs-cesium/Source/Core/formatError";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import Resource from "terriajs-cesium/Source/Core/Resource";
import TileProviderError from "terriajs-cesium/Source/Core/TileProviderError";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import AbstractConstructor from "../Core/AbstractConstructor";
import TerriaError from "../Core/TerriaError";
import getUrlForImageryTile from "../Map/ImageryProvider/getUrlForImageryTile";
import { ProviderCoords } from "../Map/PickedFeatures/PickedFeatures";
import CompositeCatalogItem from "../Models/Catalog/CatalogItems/CompositeCatalogItem";
import CommonStrata from "../Models/Definition/CommonStrata";
import Model from "../Models/Definition/Model";
import CatalogMemberTraits from "../Traits/TraitsClasses/CatalogMemberTraits";
import ImageryProviderTraits from "../Traits/TraitsClasses/ImageryProviderTraits";
import MappableTraits from "../Traits/TraitsClasses/MappableTraits";
import DiscretelyTimeVaryingMixin from "./DiscretelyTimeVaryingMixin";
import MappableMixin from "./MappableMixin";

type ModelType = Model<
  MappableTraits & ImageryProviderTraits & CatalogMemberTraits
> &
  MappableMixin.Instance;

/**
 * A mixin for handling tile errors in raster layers
 *
 */
function TileErrorHandlerMixin<T extends AbstractConstructor<ModelType>>(
  Base: T
) {
  abstract class TileErrorHandlerMixin extends Base {
    tileFailures = 0;
    private readonly tileRetriesByMap: Map<string, number> = new Map();

    tileRetryOptions: retry.OperationOptions = {
      retries: 8,
      minTimeout: 200,
      randomize: true
    };

    /**
     * A hook that may be implemented by catalog items for custom handling of tile errors.
     *
     * @param maybeError A tile request promise that that fails with the tile error
     * @param tile       The tile to be fetched
     * @returns          A modified promise
     *
     * The item can then decide to retry the tile request after adding custom parameters
     * like an authentication token.
     */
    handleTileError?: (
      request: Promise<void>,
      tile: ProviderCoords
    ) => Promise<void>;

    get hasTileErrorHandlerMixin() {
      return true;
    }

    /*
     * Handling tile errors is really complicated because:
     *
     * 1) things go wrong for a variety of weird reasons including server
     * misconfiguration, servers that are flakey but not totally broken,
     * etc.
     *
     * 2) we want to fail as gracefully as possible, and give flakey servers
     * every chance chance to shine
     *
     * 3) we don't generally have enough information the first time something fails.
     *
     * There are several mechanisms in play here:
     *   - Cesium's Resource automatically keeps trying to load any resource
     *     that fails until told to stop, but tells us each time.
     *   - The "retry" library knows how to pace the retries, and when to actually stop.
     */
    onTileLoadError(tileProviderError: TileProviderError): void {
      const operation = retry.operation(this.tileRetryOptions);

      // Cesium's TileProviderError has a native Promise now, but the code
      // below is adapted from when it had a when.js promise. That's why it's
      // a bit unusual looking.
      //
      // result.reject = stop trying to load this tile
      // result.resolve = retry loading this tile

      let result: { resolve: () => void; reject: (reason?: any) => void };
      const promise = new Promise<void>((resolve, reject) => {
        result = {
          resolve,
          reject
        };
      });

      const imageryProvider = tileProviderError.provider as ImageryProvider;
      const tile = {
        x: tileProviderError.x,
        y: tileProviderError.y,
        level: tileProviderError.level
      };

      // We're only concerned about failures for tiles that actually overlap this item's extent.
      if (
        isTileOutsideExtent(
          tile,
          runInAction(() => this.cesiumRectangle),
          imageryProvider
        )
      ) {
        tileProviderError.retry = false;
        return;
      }

      /** Helper methods **/

      // Give up loading this (definitively, unexpectedly bad) tile and
      // possibly give up on this layer entirely.
      const failTile = action((e: Error) => {
        this.tileFailures += 1;
        const opts = this.tileErrorHandlingOptions;
        const thresholdBeforeDisablingItem =
          opts.thresholdBeforeDisablingItem === undefined
            ? 5
            : opts.thresholdBeforeDisablingItem;

        if (this.tileFailures > thresholdBeforeDisablingItem && this.show) {
          if (isThisItemABaseMap()) {
            this.terria.raiseErrorToUser(
              new TerriaError({
                sender: this,
                title: i18next.t(
                  "models.imageryLayer.accessingBaseMapErrorTitle"
                ),
                message:
                  i18next.t(
                    "models.imageryLayer.accessingBaseMapErrorMessage",
                    { name: this.name }
                  ) +
                  "<pre>" +
                  formatError(e) +
                  "</pre>"
              })
            );
          } else {
            this.terria.raiseErrorToUser(
              new TerriaError({
                sender: this,
                title: i18next.t(
                  "models.imageryLayer.accessingCatalogItemErrorTitle"
                ),
                message:
                  i18next.t(
                    "models.imageryLayer.accessingCatalogItemErrorMessage",
                    { name: this.name }
                  ) +
                  "<pre>" +
                  formatError(e) +
                  "</pre>"
              })
            );
          }
          this.setTrait(CommonStrata.user, "show", false);
        }
        operation.stop();
        result.reject();
      });

      const tellMapToSilentlyGiveUp = () => {
        operation.stop();
        result.reject();
      };

      const retryWithBackoff = (e: Error) => {
        operation.retry(e) || failTile(e);
      };

      const tellMapToRetry = () => {
        operation.stop();
        result.resolve();
      };

      const getTileKey = (tile: ProviderCoords) => {
        const time = DiscretelyTimeVaryingMixin.isMixedInto(this)
          ? this.currentTime
          : "";
        const key = `L${tile.level}X${tile.x}Y${tile.y}${time}`;
        return key;
      };

      const isThisItemABaseMap = () => {
        const baseMap = this.terria.mainViewer.baseMap;
        return this === (baseMap as any)
          ? true
          : baseMap instanceof CompositeCatalogItem
            ? baseMap.memberModels.includes(this)
            : false;
      };
      /** End helper methods **/

      // By setting retry to a promise, we tell cesium/leaflet to
      // reload the tile if the promise resolves successfully
      // https://github.com/TerriaJS/cesium/blob/terriajs/Source/Core/TileProviderError.js#L161
      tileProviderError.retry = promise;

      if (tileProviderError.timesRetried === 0) {
        // There was an intervening success, so restart our count of the tile failures.
        this.tileFailures = 0;
        this.tileRetriesByMap.clear();
      }

      operation.attempt(
        action(async (attemptNumber) => {
          if (this.show === false) {
            // If the layer is no longer shown, ignore errors and don't retry.
            tellMapToSilentlyGiveUp();
            return;
          }

          const { ignoreUnknownTileErrors, treat403AsError, treat404AsError } =
            this.tileErrorHandlingOptions;

          // Browsers don't tell us much about a failed image load, so we do an
          // XHR to get more error information if needed.
          const maybeXhr =
            attemptNumber === 1
              ? Promise.reject(tileProviderError.error)
              : fetchTileImage(tile, imageryProvider);

          if (this.handleTileError && maybeXhr) {
            // Give the catalog item a chance to handle this error.
            this.handleTileError(maybeXhr as any, tile);
          }

          try {
            await maybeXhr;
            const key = getTileKey(tile);
            const retriesByMap =
              this.tileRetriesByMap
                .set(key, (this.tileRetriesByMap.get(key) || 0) + 1)
                .get(key) || 0;

            if (retriesByMap > 5) {
              // Be careful: it's conceivable that a request here will always
              // succeed while a request made by the map will always fail,
              // e.g. as a result of different request headers. We must not get
              // stuck repeating the request forever in that scenario. Instead,
              // we should give up after a few attempts.
              failTile({
                name: i18next.t("models.imageryLayer.tileErrorTitle"),
                message: i18next.t("models.imageryLayer.tileErrorMessage", {
                  url: getUrlForImageryTile(
                    imageryProvider,
                    tileProviderError.x,
                    tileProviderError.y,
                    tileProviderError.level
                  )
                })
              });
            } else {
              // Either:
              // - the XHR request for more information surprisingly worked
              //   this time, let's hope the good luck continues when Cesium/Leaflet retries.
              // - the ImageryCatalogItem looked at the error and said we should try again.
              tellMapToRetry();
            }
          } catch (error: any) {
            // This attempt failed. We'll either retry (for 500s) or give up
            // depending on the status code.
            const e: Error & { statusCode?: number } = error || {};
            if (e.statusCode === undefined) {
              if (runInAction(() => ignoreUnknownTileErrors)) {
                tellMapToSilentlyGiveUp();
              } else if ((e as any).target !== undefined) {
                // This is a failed image element, which means we got a 200 response but
                // could not load it as an image.
                failTile({
                  name: i18next.t("models.imageryLayer.tileErrorTitle"),
                  message: i18next.t("models.imageryLayer.tileErrorMessageII", {
                    url: getUrlForImageryTile(
                      imageryProvider,
                      tile.x,
                      tile.y,
                      tile.level
                    )
                  })
                });
              } else {
                // Unknown error
                failTile({
                  name: i18next.t("models.imageryLayer.unknownTileErrorTitle"),
                  message: i18next.t(
                    "models.imageryLayer.unknownTileErrorMessage",
                    {
                      url: getUrlForImageryTile(
                        imageryProvider,
                        tile.x,
                        tile.y,
                        tile.level
                      )
                    }
                  )
                });
              }
            } else if (e.statusCode >= 400 && e.statusCode < 500) {
              if (e.statusCode === 403 && treat403AsError === false) {
                tellMapToSilentlyGiveUp();
              } else if (e.statusCode === 404 && treat404AsError === false) {
                tellMapToSilentlyGiveUp();
              } else {
                failTile(e);
              }
            } else if (e.statusCode >= 500 && e.statusCode < 600) {
              retryWithBackoff(e);
            } else {
              failTile(e);
            }
          }
        })
      );
    }
  }

  /**
   * Trying fetching image using an XHR request
   */
  function fetchTileImage(
    tile: ProviderCoords,
    imageryProvider: ImageryProvider
  ) {
    const tileUrl = getUrlForImageryTile(
      imageryProvider,
      tile.x,
      tile.y,
      tile.level
    );
    if (tileUrl) {
      return Resource.fetchImage({
        url: tileUrl,
        preferBlob: true
      });
    }
    return Promise.reject();
  }

  function isTileOutsideExtent(
    tile: ProviderCoords,
    rectangle: Rectangle | undefined,
    imageryProvider: ImageryProvider
  ): boolean {
    if (rectangle === undefined) {
      // If the rectangle is not defined, assume the tile is inside.
      return false;
    }
    const tilingScheme = imageryProvider.tilingScheme;
    const tileExtent = tilingScheme.tileXYToRectangle(
      tile.x,
      tile.y,
      tile.level
    );
    const intersection = Rectangle.intersection(tileExtent, rectangle);
    return intersection === undefined;
  }

  return TileErrorHandlerMixin;
}

namespace TileErrorHandlerMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof TileErrorHandlerMixin>> {}

  export function isMixedInto(model: any): model is Instance {
    return model?.hasTileErrorHandlerMixin;
  }
}

export default TileErrorHandlerMixin;
