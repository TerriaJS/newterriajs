import { computed } from "mobx";
import isDefined from "../../../Core/isDefined";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin, { MapItem } from "../../../ModelMixins/MappableMixin";
import CreateModel from "../../Definition/CreateModel";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import { TIFFImageryProviderOptionsWithUrl } from "../../../ThirdParty/tiff-imagery-provider";
import Proj4Definitions from "../../../Map/Vector/Proj4Definitions";
import Reproject from "../../../Map/Vector/Reproject";
import { ImageryProvider } from "terriajs-cesium";
import { LatLngBounds } from "leaflet";
const proj4 = require("proj4").default;
const parseGeoRaster = require("georaster");
import { GeoRaster } from "georaster-layer-for-leaflet";
import { IPromiseBasedObservable, fromPromise } from "mobx-utils";
import GeorasterTerriaLayer from "../../../Map/Leaflet/GeorasterTerriaLayer";
import * as colourMappings from "../../../Core/colourMappings";
import CogCompositeCatalogItemTraits from "../../../Traits/TraitsClasses/CogCompositeCatalogItemTraits";
import { CogImageryProvider } from "./CogCatalogItem";

/** TODO: This Catalog Item only works correctly in 2D mode.
 * We have not yet developed the funcitonality to combine different source COGs for different band in TIFFImageryProvider for display in Cesium */
export default class CogCompositeCatalogItem extends MappableMixin(
  CatalogMemberMixin(CreateModel(CogCompositeCatalogItemTraits))
) {
  static readonly type = "cog-composite";

  selectedStyleIndex: number = 0; // Set the default style index from the style array which is provided as traits

  get type() {
    return CogCompositeCatalogItem.type;
  }

  protected async forceLoadMapItems(): Promise<void> {
    // return this.forceLoadMetadata();
    await this.imageryProvider?.readyPromise;

    return Promise.resolve();
  }

  @computed get mapItems(): MapItem[] {
    const imageryProvider = this.imageryProvider;

    if (!isDefined(imageryProvider) || this.isLoadingMapItems) {
      return [];
    }
    return [
      {
        show: this.show,
        alpha: this.opacity,
        imageryProvider,
        clippingRectangle: imageryProvider.rectangle,
        // Define our method for generating a leaflet layer in a different way, here
        overrideCreateLeafletLayer: this.createGeoRasterLayer
      }
    ];
  }

  @computed get georasterLayer(): IPromiseBasedObservable<
    GeorasterTerriaLayer | undefined
  > {
    const pixelMappingFnName = this.style[this.selectedStyleIndex].functionName;
    console.log(`Displaying COG with style: ${pixelMappingFnName}`);
    const fnBandInputs = this.style[this.selectedStyleIndex].functionInputs;
    const fnBandInputsAsIndexes = Array.from(Array(fnBandInputs.length).keys());
    colourMappings; // To make sure these are imported, as we are constructing the function call with `eval()`

    /** TODO: do we want to recalculate these everytime we change style / combinations of bands?
     * The alternative is to request all bands of the provided CogCompositeCatalogItem, even though we may not need them for the selected style.
     * Instead, better make the `selectedStyle` an observable and re-run get georasterLayer when that changes...
     * **/

    const bandPromises = fnBandInputs.map((bandName) =>
      parseGeoRaster(this.findBandURL(bandName, this.bands))
    );

    return fromPromise(
      // Make sure imageryProvider is ready
      Promise.resolve(this.imageryProvider?.readyPromise).then(() =>
        Promise.all(bandPromises)
          .then(
            // parseGeoRaster will request for external .ovr file, most likely will receive a 404 error. This is not a problem.
            (georasters: GeoRaster[]) => {
              return new GeorasterTerriaLayer(
                this.terria.leaflet,
                {
                  georasters: georasters,
                  opacity: 1,
                  // Example pixel reclassification function:
                  pixelValuesToColorFn: (georasters) => {
                    const codeToExecute = `colourMappings.${pixelMappingFnName}(${fnBandInputsAsIndexes
                      .map((bandIndex) => `georasters[${bandIndex}]`)
                      .join(",")})`;

                    // TODO: are there security concerns with using eval() statements?
                    return eval(codeToExecute);
                  },
                  resolution: 256
                },
                this.imageryProvider
              );
            }
          )
          .catch((error: Error) => {
            this.terria.raiseErrorToUser(error);
            return undefined;
          })
      )
    );
  }

  private findBandURL = (bandName: string, bands: any): string | undefined => {
    const band = bands.find((b: any) => b.bandName === bandName);
    if (band) {
      return band.url;
    }
    return undefined;
  };

  createGeoRasterLayer = (
    ip: ImageryProvider,
    clippingRectangle: LatLngBounds | undefined
  ): GeorasterTerriaLayer | undefined => {
    return this.bands && this.georasterLayer.state === "fulfilled" //TODO: why check if this.bands is truthy? Do we need a more complete check?
      ? this.georasterLayer.value
      : undefined;
  };

  /**
   * Handle all different possible projections of COGs
   * @param code Should be a number representing an EPSG code
   * @returns a Promise that resolves to a proj reprojection function
   */

  // TODO: This needs to return an object with a project and an unproject function
  projFunc = (code: number) => {
    const sourceEpsgCode = `EPSG:${code}`;
    // Add the projection to our proj4 defs if we dont already have it:
    const project = Reproject.checkProjection(
      this.terria.configParameters.proj4ServiceBaseUrl,
      sourceEpsgCode
    )
      .then(() => {
        const sourceDef =
          sourceEpsgCode in Proj4Definitions
            ? new proj4.Proj(Proj4Definitions[sourceEpsgCode])
            : undefined;

        return proj4(sourceDef, "EPSG:4326").forward;
      })
      .catch((error: Error) => {
        this.terria.raiseErrorToUser(error);
      });

    const unproject = Reproject.checkProjection(
      this.terria.configParameters.proj4ServiceBaseUrl,
      sourceEpsgCode
    )
      .then(() => {
        const sourceDef =
          sourceEpsgCode in Proj4Definitions
            ? new proj4.Proj(Proj4Definitions[sourceEpsgCode])
            : undefined;

        return proj4(sourceDef, "EPSG:4326").reverse;
      })
      .catch((error: Error) => {
        this.terria.raiseErrorToUser(error);
      });

    return { project, unproject };
  };

  @computed get imageryProvider() {
    //TODO: We need to create the imageryProvider for all three seaprate bands too!
    const exampleBandUrl = this.findBandURL("red", this.bands);

    if (!isDefined(exampleBandUrl)) {
      return;
    }

    // TODO: Where should we declare these?
    // TODO: Should we make these applicable to both new CogImageryProvider() and new GeorasterLayer()?
    const cogOptions: TIFFImageryProviderOptionsWithUrl = {
      url: proxyCatalogItemUrl(this, exampleBandUrl),
      projFunc: this.projFunc,
      renderOptions: {
        /** nodata value, default read from tiff meta */
        nodata: -999
      },
      enablePickFeatures: this.allowFeaturePicking
    };

    let cogImageryProvider: CogImageryProvider = new CogImageryProvider(
      cogOptions
    );

    return cogImageryProvider;
  }
}
