import { makeObservable } from "mobx";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Credit from "terriajs-cesium/Source/Core/Credit";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import GeographicProjection from "terriajs-cesium/Source/Core/GeographicProjection";
import GeographicTilingScheme from "terriajs-cesium/Source/Core/GeographicTilingScheme";
import Math from "terriajs-cesium/Source/Core/Math";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import Request from "terriajs-cesium/Source/Core/Request";
import Resource from "terriajs-cesium/Source/Core/Resource";
import TilingScheme from "terriajs-cesium/Source/Core/TilingScheme";
import DiscardMissingTileImagePolicy from "terriajs-cesium/Source/Scene/DiscardMissingTileImagePolicy";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import TileDiscardPolicy from "terriajs-cesium/Source/Scene/TileDiscardPolicy";
import { JsonObject } from "../../Core/Json";
import { ImageServerIdentifyResult } from "../../Models/Catalog/Esri/ArcGisInterfaces";

interface Options {
  url: string;
  token?: string;
  minimumLevel?: number;
  maximumLevel?: number;
  rectangle?: Rectangle;
  credit: Credit | string;
  enablePickFeatures?: boolean;
  usePreCachedTiles?: boolean;
  tileWidth?: number;
  tileHeight?: number;
  tilingScheme?: TilingScheme;
  parameters?: JsonObject;
}

/** This is adapted from Cesium's ArcGisMapServerImageryProvider
 * https://github.com/CesiumGS/cesium/blob/51aae2d21014cfc28e948b1719d07f1912df9434/packages/engine/Source/Scene/ArcGisMapServerImageryProvider.js
 * Code licensed under the Apache License v2.0.
 * For details, see https://github.com/CesiumGS/cesium/blob/main/LICENSE.md
 */

export default class ArcGisImageServerImageryProvider {
  readonly tilingScheme: TilingScheme;
  readonly ellipsoid: Ellipsoid;
  readonly tileWidth: number;
  readonly tileHeight: number;
  readonly minimumLevel: number;
  readonly maximumLevel: number;
  readonly rectangle: Rectangle;
  readonly errorEvent = new CesiumEvent();
  readonly ready = true;
  readonly credit: Credit;

  /** Note: this can be set dynamically */
  enablePickFeatures: boolean;
  readonly usePreCachedTiles: boolean;
  readonly tileDiscardPolicy: TileDiscardPolicy;
  readonly baseResource: Resource;

  readonly defaultNightAlpha = undefined;
  readonly defaultDayAlpha = undefined;
  readonly hasAlphaChannel = true;
  readonly defaultAlpha = undefined;
  readonly defaultBrightness = undefined;
  readonly defaultContrast = undefined;
  readonly defaultGamma = undefined;
  readonly defaultHue = undefined;
  readonly defaultSaturation = undefined;
  readonly defaultMagnificationFilter = undefined;
  readonly defaultMinificationFilter = undefined;
  readonly readyPromise = Promise.resolve(true);

  constructor(options: Options) {
    makeObservable(this);

    this.tilingScheme = options.tilingScheme ?? new GeographicTilingScheme();

    this.rectangle = options.rectangle ?? this.tilingScheme.rectangle;
    this.ellipsoid = Ellipsoid.WGS84;

    this.tileWidth = options.tileWidth ?? 256;
    this.tileHeight = options.tileHeight ?? 256;

    this.minimumLevel = options.minimumLevel ?? 0;
    this.maximumLevel = options.maximumLevel ?? 25;

    this.ready = true;

    this.credit =
      typeof options.credit === "string"
        ? new Credit(options.credit)
        : options.credit;

    this.enablePickFeatures = options.enablePickFeatures ?? true;
    this.usePreCachedTiles = options.usePreCachedTiles ?? false;

    this.baseResource = new Resource(options.url);
    this.baseResource.appendForwardSlash();

    if (options.parameters) {
      this.baseResource.appendQueryParameters(options.parameters);
    }

    if (options.token) {
      this.baseResource.appendQueryParameters({
        token: options.token
      });
    }

    this.tileDiscardPolicy = new DiscardMissingTileImagePolicy({
      missingImageUrl: this.buildImageResource(0, 0, this.maximumLevel).url,
      pixelsToCheck: [
        new Cartesian2(0, 0),
        new Cartesian2(200, 20),
        new Cartesian2(20, 200),
        new Cartesian2(80, 110),
        new Cartesian2(160, 130)
      ],
      disableCheckIfAllPixelsAreTransparent: true
    });
  }

  get proxy() {
    return this.baseResource.proxy;
  }

  buildImageResource(x: number, y: number, level: number, request?: Request) {
    if (this.usePreCachedTiles) {
      return this.baseResource.getDerivedResource({
        url: `tile/${level}/${y}/${x}`,
        request: request
      });
    } else {
      const nativeRectangle = this.tilingScheme.tileXYToNativeRectangle(
        x,
        y,
        level
      );
      const bbox = `${nativeRectangle.west},${nativeRectangle.south},${nativeRectangle.east},${nativeRectangle.north}`;

      const query: JsonObject = {
        bbox: bbox,
        size: `${this.tileWidth},${this.tileHeight}`,
        format: "png32",
        transparent: true,
        f: "image"
      };

      if (this.tilingScheme.projection instanceof GeographicProjection) {
        query.bboxSR = 4326;
        query.imageSR = 4326;
      } else {
        query.bboxSR = 3857;
        query.imageSR = 3857;
      }

      return this.baseResource.getDerivedResource({
        url: "exportImage",
        queryParameters: query,
        request: request
      });
    }
  }

  getTileCredits(): Credit[] {
    return [];
  }

  requestImage(x: number, y: number, level: number, request: Request): any {
    return ImageryProvider.loadImage(
      this,
      this.buildImageResource(x, y, level, request)
    );
  }

  async pickFeatures(
    _x: number,
    _y: number,
    _level: number,
    longitude: number,
    latitude: number
  ): Promise<ImageryLayerFeatureInfo[]> {
    if (!this.enablePickFeatures) {
      return [];
    }

    let horizontal;
    let vertical;
    let sr;
    if (this.tilingScheme.projection instanceof GeographicProjection) {
      horizontal = Math.toDegrees(longitude);
      vertical = Math.toDegrees(latitude);
      sr = "4326";
    } else {
      const projected = this.tilingScheme.projection.project(
        new Cartographic(longitude, latitude, 0.0)
      );
      horizontal = projected.x;
      vertical = projected.y;
      sr = "3857";
    }

    const query = {
      f: "json",
      geometryType: "esriGeometryPoint",
      geometry: `{x: ${horizontal}, y: ${vertical}, spatialReference: {wkid: ${sr}}}`,
      // Disable catalog items - as we don't use them
      returnCatalogItems: false
    };

    const resource = this.baseResource.getDerivedResource({
      url: "identify",
      queryParameters: query
    });

    const json = (await resource.fetchJson()) as ImageServerIdentifyResult;
    const result: ImageryLayerFeatureInfo[] = [];

    if (json.value) {
      const featureInfo = new ImageryLayerFeatureInfo();
      featureInfo.data = json;
      featureInfo.name = json.name;
      featureInfo.properties = json.properties;
      featureInfo.description = json.value;

      result.push(featureInfo);
    }

    // Todo: handle json.catalogItems

    return result;
  }
}
