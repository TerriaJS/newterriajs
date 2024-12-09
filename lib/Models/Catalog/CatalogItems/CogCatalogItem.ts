import i18next from "i18next";
import {
  computed,
  makeObservable,
  observable,
  onBecomeObserved,
  onBecomeUnobserved,
  runInAction
} from "mobx";
import GeographicTilingScheme from "terriajs-cesium/Source/Core/GeographicTilingScheme";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import type TIFFImageryProvider from "terriajs-tiff-imagery-provider";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin, { MapItem } from "../../../ModelMixins/MappableMixin";
import CogCatalogItemTraits from "../../../Traits/TraitsClasses/CogCatalogItemTraits";
import { RectangleTraits } from "../../../Traits/TraitsClasses/MappableTraits";
import CreateModel from "../../Definition/CreateModel";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel } from "../../Definition/Model";
import StratumFromTraits from "../../Definition/StratumFromTraits";
import StratumOrder from "../../Definition/StratumOrder";
import Terria from "../../Terria";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

/**
 * Loadable stratum for overriding CogCatalogItem traits
 */
class CogLoadableStratum extends LoadableStratum(CogCatalogItemTraits) {
  static stratumName = "cog-loadable-stratum";

  constructor(readonly model: CogCatalogItem) {
    super();
    makeObservable(this);
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new CogLoadableStratum(model as CogCatalogItem) as this;
  }

  @computed
  get shortReport(): string | undefined {
    return this.model.terria.currentViewer.type === "Leaflet"
      ? // Warn for 2D mode
        i18next.t("models.commonModelErrors.3dTypeIn2dMode", this)
      : this.model._imageryProvider?.tilingScheme &&
          // Show warning for experimental reprojection freature if not using EPSG 3857 or 4326
          isCustomTilingScheme(this.model._imageryProvider?.tilingScheme)
        ? i18next.t(
            "models.cogCatalogItem.experimentalReprojectionWarning",
            this
          )
        : undefined;
  }

  @computed
  get rectangle(): StratumFromTraits<RectangleTraits> | undefined {
    const rectangle = this.model._imageryProvider?.rectangle;
    if (!rectangle) {
      return;
    }

    const { west, south, east, north } = rectangle;
    return {
      west: CesiumMath.toDegrees(west),
      south: CesiumMath.toDegrees(south),
      east: CesiumMath.toDegrees(east),
      north: CesiumMath.toDegrees(north)
    };
  }
}

StratumOrder.addLoadStratum(CogLoadableStratum.stratumName);

/**
 * Creates a Cloud Optimised Geotiff catalog item.
 *
 * Currently it can render EPSG 4326/3857 COG files. There is experimental
 * support for other projections, however it is less performant and could have
 * unknown issues.
 */
export default class CogCatalogItem extends MappableMixin(
  CatalogMemberMixin(CreateModel(CogCatalogItemTraits))
) {
  static readonly type = "cog";

  /**
   * Private imageryProvider instance. This is set once forceLoadMapItems is
   * called.
   */
  @observable
  _imageryProvider: TIFFImageryProvider | undefined;

  /**
   * The reprojector function to use for reprojecting non native projections
   *
   * Exposed here as instance variable for stubbing in specs.
   */
  reprojector = reprojector;

  get type() {
    return CogCatalogItem.type;
  }

  constructor(
    id: string | undefined,
    terria: Terria,
    sourceReference?: BaseModel | undefined
  ) {
    super(id, terria, sourceReference);
    makeObservable(this);
    this.strata.set(
      CogLoadableStratum.stratumName,
      new CogLoadableStratum(this)
    );

    // Destroy the imageryProvider when `mapItems` is no longer consumed. This
    // is so that the webworkers and other resources created by the
    // imageryProvider can be freed. Ideally, there would be a more explicit
    // `destroy()` method in Terria life-cycle so that we don't have to rely on
    // mapItems becoming observed or unobserved.
    onBecomeUnobserved(this, "mapItems", () => {
      if (this._imageryProvider) {
        this._imageryProvider.destroy();
        this._imageryProvider = undefined;
      }
    });

    // Re-create the imageryProvider if `mapItems` is consumed again after we
    // destroyed it
    onBecomeObserved(this, "mapItems", () => {
      if (!this._imageryProvider && !this.isLoadingMapItems) {
        this.loadMapItems(true);
      }
    });
  }

  protected async forceLoadMapItems(): Promise<void> {
    if (!this.url) {
      return;
    }
    const url = proxyCatalogItemUrl(this, this.url);
    const imageryProvider = await this.createImageryProvider(url);
    runInAction(() => {
      this._imageryProvider = imageryProvider;
    });
  }

  @computed get mapItems(): MapItem[] {
    const imageryProvider = this._imageryProvider;
    if (!imageryProvider) {
      return [];
    }

    return [
      {
        show: this.show,
        alpha: this.opacity,
        // The 'requestImage' method in Cesium's ImageryProvider has a return type that is stricter than necessary.
        // In our custom ImageryProvider, we return ImageData, which is also a valid return type.
        // However, since the current Cesium type definitions do not reflect this flexibility, we use a TypeScript ignore comment ('@ts-ignore')
        // to suppress the type checking error. This is a temporary solution until the type definitions in Cesium are updated to accommodate ImageData.
        // @ts-expect-error - The return type of 'requestImage' method in our custom ImageryProvider can be ImageData, which is not currently allowed in Cesium's type definitions, but is fine.
        imageryProvider,
        clippingRectangle: this.cesiumRectangle
      }
    ];
  }

  /**
   * Create TIFFImageryProvider for the given url.
   */
  private async createImageryProvider(
    url: string
  ): Promise<TIFFImageryProvider> {
    // lazy load the imagery provider, only when needed
    const [{ default: TIFFImageryProvider }, { default: proj4 }] =
      await Promise.all([
        import("terriajs-tiff-imagery-provider"),
        import("proj4-fully-loaded")
      ]);

    return runInAction(() =>
      TIFFImageryProvider.fromUrl(url, {
        credit: this.credit,
        tileSize: this.tileSize,
        maximumLevel: this.maximumLevel,
        minimumLevel: this.minimumLevel,
        enablePickFeatures: this.allowFeaturePicking,
        hasAlphaChannel: this.hasAlphaChannel,
        // used for reprojecting from an unknown projection to 4326/3857
        // note that this is experimental and could be slow as it runs on the main thread
        projFunc: this.reprojector(proj4),
        // make sure we omit `undefined` options so as not to override the library defaults
        renderOptions: omitUndefined({
          nodata: this.renderOptions.nodata,
          convertToRGB: this.renderOptions.convertToRGB,
          resampleMethod: this.renderOptions.resampleMethod
        })
      })
    );
  }
}

/**
 * Function returning a custom reprojector
 */
function reprojector(proj4: any) {
  return (code: number) => {
    if (![4326, 3857, 900913].includes(code)) {
      try {
        const prj = proj4("EPSG:4326", `EPSG:${code}`);
        if (prj)
          return {
            project: prj.forward,
            unproject: prj.inverse
          };
      } catch (e) {
        console.error(e);
      }
    }
  };
}

/**
 * Returns true if the tilingScheme is custom
 */
function isCustomTilingScheme(tilingScheme: object) {
  // The upstream library defines a TIFFImageryTillingScheme but it is not
  // exported so we have to check if it is not one of the standard Cesium
  // tiling schemes. Also, because TIFFImageryTillingScheme derives from
  // WebMercatorTilingScheme, we cannot simply do an `instanceof` check, we
  // compare the exact constructor instead.
  return (
    tilingScheme.constructor !== WebMercatorTilingScheme &&
    tilingScheme.constructor !== GeographicTilingScheme
  );
}

function omitUndefined(obj: object) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined)
  );
}
