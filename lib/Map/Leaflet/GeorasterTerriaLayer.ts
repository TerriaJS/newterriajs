import L from "leaflet";
import {
  autorun,
  computed,
  IReactionDisposer,
  makeObservable,
  observable
} from "mobx";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import SplitDirection from "terriajs-cesium/Source/Scene/SplitDirection";
import GeoRasterLayer, {
  GeoRasterLayerOptions
} from "georaster-layer-for-leaflet";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import { identify } from "geoblaze";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import Proj4Definitions from "../Vector/Proj4Definitions";
import Leaflet from "../../Models/Leaflet";
const proj4 = require("proj4").default;

// TODO: Cannot extend GeoRasterLayerOptions why?
// interface GeoRasterTerriaLayerOptions extends GeoRasterLayerOptions {
//   imageryProvider: ImageryProvider;
// }

// We have to ts-ignore here as the type of GeoRasterLayer is expressed in an incompatible way
//@ts-ignore

export default class GeorasterTerriaLayer extends GeoRasterLayer {
  readonly errorEvent: CesiumEvent = new CesiumEvent();
  readonly initialized: boolean = false;
  readonly _usable: boolean = false;
  readonly _delayedUpdate: unknown = undefined;
  readonly _zSubtract: number = 0;
  readonly _previousCredits: unknown[] = [];

  @observable splitDirection = SplitDirection.NONE;
  @observable splitPosition: number = 0.5;

  constructor(
    private leaflet: Leaflet | undefined,
    options: GeoRasterLayerOptions,
    imageryProvider: ImageryProvider | undefined
  ) {
    super(Object.assign(options, { async: true, tileSize: 256 }));
    this.imageryProvider = imageryProvider; // TODO: add to Options instead?

    makeObservable(this);

    // Handle splitter rection (and disposing reaction)
    let disposeSplitterReaction: IReactionDisposer | undefined;
    this.on("add", () => {
      if (!disposeSplitterReaction) {
        disposeSplitterReaction = this._reactToSplitterChange();
      }
    });
    this.on("remove", () => {
      if (disposeSplitterReaction) {
        disposeSplitterReaction();
        disposeSplitterReaction = undefined;
      }
    });
  }

  _reactToSplitterChange() {
    return autorun(() => {
      const container = this.getContainer();
      if (container === null) {
        return;
      }

      if (this.splitDirection === SplitDirection.LEFT) {
        const { left: clipLeft } = this._clipsForSplitter;
        container.style.clip = clipLeft;
      } else if (this.splitDirection === SplitDirection.RIGHT) {
        const { right: clipRight } = this._clipsForSplitter;
        container.style.clip = clipRight;
      } else {
        container.style.clip = "auto";
      }
    });
  }

  @computed
  get _clipsForSplitter() {
    let clipLeft = "";
    let clipRight = "";
    let clipPositionWithinMap;
    let clipX;

    // TODO: Error in here - some undefined stuff
    if (this.leaflet?.size && this.leaflet.nw && this.leaflet.se) {
      clipPositionWithinMap = this.leaflet.size.x * this.splitPosition;
      clipX = Math.round(this.leaflet.nw.x + clipPositionWithinMap);
      clipLeft =
        "rect(" +
        [this.leaflet.nw.y, clipX, this.leaflet.se.y, this.leaflet.nw.x].join(
          "px,"
        ) +
        "px)";
      clipRight =
        "rect(" +
        [this.leaflet.nw.y, this.leaflet.se.x, this.leaflet.se.y, clipX].join(
          "px,"
        ) +
        "px)";
    }

    return {
      left: clipLeft,
      right: clipRight,
      clipPositionWithinMap: clipPositionWithinMap,
      clipX: clipX
    };
  }

  // Transform the feature picking coordinates to the native projection of the Georaster layer.
  getFeaturePickingCoords(
    map: L.Map,
    longitudeRadians: number,
    latitudeRadians: number
  ) {
    // get Georaster projection
    const projection = this.extent.srs;
    const reprojectFn = this.reprojectToSourceFn(projection);

    // convert long and lat radians to x and y in native projection
    const lat = (latitudeRadians / Math.PI) * 180;
    const lon = (longitudeRadians / Math.PI) * 180;
    const nativeCoords = reprojectFn([lon, lat]);

    // Also include zoom level to fit previous implmentations
    const level = Math.round(map.getZoom());

    return {
      x: nativeCoords[0],
      y: nativeCoords[1],
      level: level
    };
  }

  reprojectToSourceFn = (sourceEpsgCode: string) => {
    const sourceDef =
      sourceEpsgCode in Proj4Definitions
        ? new proj4.Proj(Proj4Definitions[sourceEpsgCode])
        : undefined;

    return proj4("EPSG:4326", sourceDef).forward;
  };

  /** Use the Geoblaze library to get pixel values by operating on the GeoRaster object.
   * TODO: Is this giving the display values at that point, or the raw values of the full resolution raster at those coordinates?
   * This is discussed in https://github.com/GeoTIFF/georaster-layer-for-leaflet/issues/104
   * Currently his function is costly - `geoblaze.identify` takes time and appears to download the highest resolution tile for the area clicked.
   * This is probably the only way if we want to get the actual raw pixel values at that point.
   **/

  async pickFeatures(
    x: number,
    y: number,
    level: number,
    longitudeRadians: number,
    latitudeRadians: number
  ) {
    const featureInfo = new ImageryLayerFeatureInfo();
    featureInfo.name = `lon:${((longitudeRadians / Math.PI) * 180).toFixed(
      6
    )}, lat:${((latitudeRadians / Math.PI) * 180).toFixed(6)}`;
    const data: { [index: number]: any } = {};

    for (let i = 0; i < this.georasters.length; i++) {
      const res = await identify(this.georasters[i], [x, y]);

      if (res) {
        res.forEach((item: any): void => {
          data[i] = item;
        });
        featureInfo.configureDescriptionFromProperties(data);
      }
    }

    featureInfo.data = data;
    return [featureInfo];
  }

  /** SUPERSEDED: These functions are alternative that do the feature picking using the TIFFImageryProvider.
   * This is what the 3D Cesium map uses, but in the case of COG layers we are using a different layer for Leaflet 2D mode.
   * It is more efficient to directly query the raster data fetched by Georaster Layer for Leaflet, that we are using on the 2D side.
   * It can also work to query the pixel values using TIFFImageryProvider, but this requires downloading the tiles using that provider, and is inefficient.
   * These functions have been retained during the testing phase of this new functionality, in case they offer other alternative.
   */

  //   // will get the coords in the tiling scheme provided by the TIFFImageryProvider
  //   getFeaturePickingCoords(
  //     map: L.Map,
  //     longitudeRadians: number,
  //     latitudeRadians: number
  //   ) {
  //     const ll = new Cartographic(
  //       CesiumMath.negativePiToPi(longitudeRadians),
  //       latitudeRadians,
  //       0.0
  //     );
  //     const level = Math.round(map.getZoom());

  //     return this.imageryProvider.readyPromise.then(() => {
  //       const tilingScheme = this.imageryProvider.tilingScheme;
  //       const coords = tilingScheme.positionToTileXY(ll, level);
  //       return {
  //         x: coords.x,
  //         y: coords.y,
  //         level: level
  //       };
  //     });
  //   }

  //   // THIS VERSION USES THE IMAGERY PROVIDER to get the values
  //   pickFeatures(
  //     x: number,
  //     y: number,
  //     level: number,
  //     longitudeRadians: number,
  //     latitudeRadians: number
  //   ) {
  //     return this.imageryProvider.readyPromise.then(() => {
  //       return this.imageryProvider.pickFeatures(
  //         x,
  //         y,
  //         level,
  //         longitudeRadians,
  //         latitudeRadians
  //       );
  //     });
  //   }
}
