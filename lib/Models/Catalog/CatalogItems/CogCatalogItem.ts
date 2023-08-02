import { computed } from "mobx";
import isDefined from "../../../Core/isDefined";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin, { MapItem } from "../../../ModelMixins/MappableMixin";
import CogCatalogItemTraits from "../../../Traits/TraitsClasses/CogCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import TIFFImageryProvider, {
  TIFFImageryProviderOptionsWithUrl
} from "../../../ThirdParty/tiff-imagery-provider";
import Credit from "terriajs-cesium/Source/Core/Credit";
import Proj4Definitions from "../../../Map/Vector/Proj4Definitions";
import Reproject from "../../../Map/Vector/Reproject";
import { ImageryProvider } from "terriajs-cesium";
import { LatLngBounds } from "leaflet";
const proj4 = require("proj4").default;
const parseGeoRaster = require("georaster");
import { GeoRaster } from "georaster-layer-for-leaflet";
import { IPromiseBasedObservable, fromPromise } from "mobx-utils";
import GeorasterTerriaLayer from "../../../Map/Leaflet/GeorasterTerriaLayer";
import { mapElevationToRgbaSmoothed } from "../../../Core/colourMappings";

export default class CogCatalogItem extends MappableMixin(
  CatalogMemberMixin(CreateModel(CogCatalogItemTraits))
) {
  static readonly type = "cog";

  get type() {
    return CogCatalogItem.type;
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
    return fromPromise(
      // parseGeoRaster will request for external .ovr file, most likely will receive a 404 error. This is not a problem.
      isDefined(this.imageryProvider) &&
        parseGeoRaster(this.url)
          .then((georaster: GeoRaster) => {
            return new GeorasterTerriaLayer(
              this.terria.leaflet,
              {
                georaster: georaster,
                opacity: 1,
                // Example pixel reclassification function:
                // pixelValuesToColorFn: (values) => {
                //   return mapElevationToRgbaSmoothed(values, 0);
                // },
                resolution: 256
                // debugLevel: 0
              },
              this.imageryProvider
            );
          })
          .catch((error: Error) => {
            this.terria.raiseErrorToUser(error);
          })
    );
  }

  createGeoRasterLayer = (
    ip: ImageryProvider,
    clippingRectangle: LatLngBounds | undefined
  ): GeorasterTerriaLayer | undefined => {
    return this.url && this.georasterLayer.state === "fulfilled"
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

        return proj4("EPSG:4326", sourceDef).forward;
      })
      .catch((error: Error) => {
        this.terria.raiseErrorToUser(error);
      });

    return { project, unproject };
  };

  @computed get imageryProvider() {
    if (!isDefined(this.url)) {
      return;
    }

    // TODO: Where should we declare these?
    // TODO: Should we make these applicable to both new CogImageryProvider() and new GeorasterLayer()?
    const cogOptions: TIFFImageryProviderOptionsWithUrl = {
      url: proxyCatalogItemUrl(this, this.url),
      projFunc: this.projFunc,
      renderOptions: {
        /** nodata value, default read from tiff meta */
        nodata: 0
      },
      enablePickFeatures: this.allowFeaturePicking
    };

    let cogImageryProvider: CogImageryProvider = new CogImageryProvider(
      cogOptions
    );

    return cogImageryProvider;
  }
}

export class CogImageryProvider extends TIFFImageryProvider {
  // Set values to please poor cesium types
  defaultNightAlpha = undefined;
  defaultDayAlpha = undefined;
  hasAlphaChannel = true;
  defaultAlpha = <any>undefined;
  defaultBrightness = <any>undefined;
  defaultContrast = <any>undefined;
  defaultGamma = <any>undefined;
  defaultHue = <any>undefined;
  defaultSaturation = <any>undefined;
  defaultMagnificationFilter = undefined as any;
  defaultMinificationFilter = undefined as any;
  proxy = <any>undefined;
  tileDiscardPolicy = <any>undefined;

  getTileCredits(x: number, y: number, level: number): Credit[] {
    return [];
  }

  constructor(options: TIFFImageryProviderOptionsWithUrl) {
    super(options);

    // We can extend the constructor here if needed
  }
}
