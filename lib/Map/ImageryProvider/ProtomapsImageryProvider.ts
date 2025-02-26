import Point from "@mapbox/point-geometry";
import { isEmpty } from "lodash-es";
import { action, makeObservable } from "mobx";
import {
  LabelRule,
  Labelers,
  LineSymbolizer,
  PaintRule,
  PmtilesSource,
  PreparedTile,
  TileCache,
  View,
  ZxySource,
  paint
} from "protomaps-leaflet";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Credit from "terriajs-cesium/Source/Core/Credit";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import Request from "terriajs-cesium/Source/Core/Request";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import { FeatureCollectionWithCrs } from "../../Core/GeoJson";
import TerriaError from "../../Core/TerriaError";
import isDefined from "../../Core/isDefined";
import { FEATURE_ID_PROP as GEOJSON_FEATURE_ID_PROP } from "../../ModelMixins/GeojsonMixin";
import { default as TerriaFeature } from "../../Models/Feature/Feature";
import Terria from "../../Models/Terria";
import { ImageryProviderWithGridLayerSupport } from "../Leaflet/ImageryProviderLeafletGridLayer";
import { ProtomapsArcGisPbfSource } from "../Vector/Protomaps/ProtomapsArcGisPbfSource";
import {
  GEOJSON_SOURCE_LAYER_NAME,
  ProtomapsGeojsonSource
} from "../Vector/Protomaps/ProtomapsGeojsonSource";

export const LAYER_NAME_PROP = "__LAYERNAME";

interface Coords {
  z: number;
  x: number;
  y: number;
}

/** Data object can be:
 * - URL of geojson, pmtiles or pbf template (eg `something.com/{z}/{x}/{y}.pbf`)
 * - GeoJsonObject object
 * -Source object (PmtilesSource | ZxySource | ProtomapsGeojsonSource)
 */
export type ProtomapsData = string | FeatureCollectionWithCrs | Source;

interface Options {
  terria: Terria;

  /** This must be defined to support pickedFeatures in share links */
  id?: string;
  data: ProtomapsData;
  minimumZoom?: number;
  maximumZoom?: number;
  maximumNativeZoom?: number;
  rectangle?: Rectangle;
  credit?: Credit | string;
  paintRules: PaintRule[];
  labelRules: LabelRule[];

  /** The name of the property that is a unique ID for features */
  idProperty?: string;

  processPickedFeatures?: (
    features: ImageryLayerFeatureInfo[]
  ) => Promise<ImageryLayerFeatureInfo[]>;
}

type Source =
  | PmtilesSource
  | ZxySource
  | ProtomapsGeojsonSource
  | ProtomapsArcGisPbfSource;

/** Tile size in pixels (for canvas and geojson-vt) */
export const PROTOMAPS_DEFAULT_TILE_SIZE = 256;

/** Buffer (in pixels) used when rendering (and generating - through geojson-vt) vector tiles */
export const PROTOMAPS_TILE_BUFFER = 32;

export default class ProtomapsImageryProvider
  implements ImageryProviderWithGridLayerSupport
{
  private readonly terria: Terria;

  // Imagery provider properties
  readonly tilingScheme: WebMercatorTilingScheme;
  readonly tileWidth: number;
  readonly tileHeight: number;
  readonly minimumLevel: number;
  /** This is used to fail requests for levels below softMinimumLevel, as setting minimumLevel to higher than 0 (with no rectangle provided), will result in many tiles being requested.
   */
  readonly softMinimumLevel?: number;
  readonly maximumLevel: number;
  readonly rectangle: Rectangle;
  readonly errorEvent = new CesiumEvent();
  readonly ready = true;
  readonly credit: Credit;
  /** This is only used for Terria feature picking - as we track ImageryProvider feature picking by url (See PickedFeatures/Cesium._attachProviderCoordHooks). This URL is never called.
   * This is set using the `id` property in the constructor options
   */
  readonly url?: string;

  // Set values to please poor cesium types
  readonly defaultNightAlpha = undefined;
  readonly defaultDayAlpha = undefined;
  readonly hasAlphaChannel = true;
  readonly defaultAlpha = undefined as any;
  readonly defaultBrightness = undefined as any;
  readonly defaultContrast = undefined as any;
  readonly defaultGamma = undefined as any;
  readonly defaultHue = undefined as any;
  readonly defaultSaturation = undefined as any;
  readonly defaultMagnificationFilter = undefined as any;
  readonly defaultMinificationFilter = undefined as any;
  readonly proxy = undefined as any;
  readonly readyPromise = Promise.resolve(true);
  readonly tileDiscardPolicy = undefined as any;

  // Protomaps properties
  /** Data object from constructor options (this is transformed into `source`) */
  private readonly data: ProtomapsData;
  private readonly labelers: Labelers;
  private readonly view: View | undefined;
  private readonly processPickedFeatures?: (
    features: ImageryLayerFeatureInfo[]
  ) => Promise<ImageryLayerFeatureInfo[]>;

  readonly maximumNativeZoom: number;
  readonly idProperty: string;
  readonly source: Source;
  readonly paintRules: PaintRule[];
  readonly labelRules: LabelRule[];

  constructor(options: Options) {
    makeObservable(this);
    this.data = options.data;
    this.terria = options.terria;
    this.tilingScheme = new WebMercatorTilingScheme();

    this.tileWidth = PROTOMAPS_DEFAULT_TILE_SIZE;
    this.tileHeight = PROTOMAPS_DEFAULT_TILE_SIZE;
    // Note we leave minimumLevel at 0, and then we fail requests for levels below softMinimumLevel (see softMinimumLevel)
    this.minimumLevel = 0;
    this.softMinimumLevel = options.minimumZoom;
    this.maximumLevel = defaultValue(options.maximumZoom, 24);
    this.maximumNativeZoom = defaultValue(
      options.maximumNativeZoom,
      this.maximumLevel
    );

    this.rectangle = isDefined(options.rectangle)
      ? Rectangle.intersection(
          options.rectangle,
          this.tilingScheme.rectangle
        ) || this.tilingScheme.rectangle
      : this.tilingScheme.rectangle;

    this.errorEvent = new CesiumEvent();
    this.url = options.id;

    this.ready = true;

    this.credit =
      typeof options.credit === "string"
        ? new Credit(options.credit)
        : (options.credit as Credit);

    // Protomaps
    this.paintRules = options.paintRules;
    this.labelRules = options.labelRules;
    this.idProperty = options.idProperty ?? "FID";

    // Generate protomaps source based on this.data
    // - URL of pmtiles, geojson or pbf files
    if (typeof this.data === "string") {
      if (this.data.endsWith(".pmtiles")) {
        this.source = new PmtilesSource(this.data, false);
        const cache = new TileCache(this.source, PROTOMAPS_DEFAULT_TILE_SIZE);
        this.view = new View(cache, this.maximumNativeZoom, 2);
      } else if (
        this.data.endsWith(".json") ||
        this.data.endsWith(".geojson")
      ) {
        this.source = new ProtomapsGeojsonSource(this.data);
      } else {
        this.source = new ZxySource(this.data, false);
        const cache = new TileCache(this.source, PROTOMAPS_DEFAULT_TILE_SIZE);
        this.view = new View(cache, this.maximumNativeZoom, 2);
      }
    }
    // Source object
    else if (
      this.data instanceof ProtomapsGeojsonSource ||
      this.data instanceof PmtilesSource ||
      this.data instanceof ZxySource ||
      this.data instanceof ProtomapsArcGisPbfSource
    ) {
      this.source = this.data;
    }
    // - GeoJsonObject object
    else {
      this.source = new ProtomapsGeojsonSource(this.data);
    }

    const labelersCanvasContext = document
      .createElement("canvas")
      .getContext("2d");

    if (!labelersCanvasContext)
      throw TerriaError.from("Failed to create labelersCanvasContext");

    this.labelers = new Labelers(
      labelersCanvasContext,
      this.labelRules,
      16,
      () => undefined
    );

    this.processPickedFeatures = options.processPickedFeatures;
  }

  getTileCredits(_x: number, _y: number, _level: number): Credit[] {
    return [];
  }

  async requestImage(x: number, y: number, level: number, request?: Request) {
    const canvas = document.createElement("canvas");
    canvas.width = this.tileWidth;
    canvas.height = this.tileHeight;
    return await this.requestImageForCanvas(x, y, level, canvas, request);
  }

  async requestImageForCanvas(
    x: number,
    y: number,
    level: number,
    canvas: HTMLCanvasElement,
    request?: Request
  ) {
    if (isDefined(this.softMinimumLevel) && level < this.softMinimumLevel)
      throw TerriaError.from(
        `Level: ${level} is below softMinimumLevel (=${this.softMinimumLevel})`
      );

    const coords: Coords = { z: level, x, y };

    // Adapted from https://github.com/protomaps/protomaps.js/blob/master/src/frontends/leaflet.ts
    let tile: PreparedTile;

    // Get PreparedTile from source or view
    // Here we need a little bit of extra logic for the ProtomapsGeojsonSource
    if (
      this.source instanceof ProtomapsGeojsonSource ||
      this.source instanceof ProtomapsArcGisPbfSource
    ) {
      const data = await this.source.get(coords, this.tileHeight, request);

      tile = {
        data: data,
        z: coords.z,
        dataTile: coords,
        scale: 1,
        origin: new Point(
          coords.x * PROTOMAPS_DEFAULT_TILE_SIZE,
          coords.y * PROTOMAPS_DEFAULT_TILE_SIZE
        ),
        dim: this.tileWidth
      };
    } else if (this.view) {
      tile = await this.view.getDisplayTile(coords);
    } else {
      throw TerriaError.from(
        `Failed to get tile - no view or appropriate source in ProtomapsImageryProvider`
      );
    }

    const tileMap = new Map<string, PreparedTile[]>().set("", [tile]);

    this.labelers.add(coords.z, tileMap);

    const labelData = this.labelers.getIndex(tile.z);

    const bbox = {
      minX: PROTOMAPS_DEFAULT_TILE_SIZE * coords.x - PROTOMAPS_TILE_BUFFER,
      minY: PROTOMAPS_DEFAULT_TILE_SIZE * coords.y - PROTOMAPS_TILE_BUFFER,
      maxX:
        PROTOMAPS_DEFAULT_TILE_SIZE * (coords.x + 1) + PROTOMAPS_TILE_BUFFER,
      maxY: PROTOMAPS_DEFAULT_TILE_SIZE * (coords.y + 1) + PROTOMAPS_TILE_BUFFER
    };
    const origin = new Point(
      PROTOMAPS_DEFAULT_TILE_SIZE * coords.x,
      PROTOMAPS_DEFAULT_TILE_SIZE * coords.y
    );

    const ctx = canvas.getContext("2d");
    if (!ctx) throw TerriaError.from("Failed to get canvas context");
    ctx.setTransform(
      this.tileWidth / PROTOMAPS_DEFAULT_TILE_SIZE,
      0,
      0,
      this.tileHeight / PROTOMAPS_DEFAULT_TILE_SIZE,
      0,
      0
    );
    ctx.clearRect(
      0,
      0,
      PROTOMAPS_DEFAULT_TILE_SIZE,
      PROTOMAPS_DEFAULT_TILE_SIZE
    );

    if (labelData)
      paint(
        ctx,
        coords.z,
        tileMap,
        labelData,
        this.paintRules,
        bbox,
        origin,
        false,
        ""
      );

    return canvas;
  }

  async pickFeatures(
    x: number,
    y: number,
    level: number,
    longitude: number,
    latitude: number
  ): Promise<ImageryLayerFeatureInfo[]> {
    const featureInfos: ImageryLayerFeatureInfo[] = [];
    // If view is set - this means we are using actual vector tiles (that is not GeoJson object)
    // So we use this.view.queryFeatures
    if (this.view) {
      try {
        // Make sure tile is loaded, this will use cache if tile is already loaded
        await this.view.getDisplayTile({ x, y, z: level });
      } catch (e) {
        TerriaError.from(e, "Error while picking features").log();
        return [];
      }

      // Get list of vector tile layers which are rendered
      const renderedLayers = [...this.paintRules, ...this.labelRules].map(
        (r) => r.dataLayer
      );

      this.view
        .queryFeatures(
          CesiumMath.toDegrees(longitude),
          CesiumMath.toDegrees(latitude),
          level,
          1
        )
        .forEach((f) => {
          // Only create FeatureInfo for visible features with properties
          if (
            !f.feature.props ||
            isEmpty(f.feature.props) ||
            !renderedLayers.includes(f.layerName)
          )
            return;

          const featureInfo = new ImageryLayerFeatureInfo();

          // Add Layer name property
          featureInfo.properties = Object.assign(
            { [LAYER_NAME_PROP]: f.layerName },
            f.feature.props ?? {}
          );
          featureInfo.position = new Cartographic(longitude, latitude);

          featureInfo.configureDescriptionFromProperties(f.feature.props);
          featureInfo.configureNameFromProperties(f.feature.props);

          featureInfos.push(featureInfo);
        });

      // No view is set and we have geoJSON object
      // So we pick features manually
    } else if (
      this.source instanceof ProtomapsGeojsonSource ||
      this.source instanceof ProtomapsArcGisPbfSource
    ) {
      featureInfos.push(
        ...(await this.source.pickFeatures(x, y, level, longitude, latitude))
      );
    }

    if (this.processPickedFeatures) {
      return await this.processPickedFeatures(featureInfos);
    }

    return featureInfos;
  }

  private clone(options?: Partial<Options>) {
    let data = options?.data;

    // To clone data/source, we want to minimize any unnecessary processing
    if (!data) {
      // These can be passed straight in without processing
      if (
        typeof this.data === "string" ||
        this.data instanceof PmtilesSource ||
        this.data instanceof ProtomapsArcGisPbfSource
      ) {
        data = this.data;
        // We can't just clone ZxySource objects, so just pass in URL
      } else if (this.data instanceof ZxySource) {
        data = this.data.url;
        // If ProtomapsGeojsonSource was passed into data, create new one and copy over tileIndex
      } else if (this.data instanceof ProtomapsGeojsonSource) {
        if (this.data.geojsonObject) {
          data = new ProtomapsGeojsonSource(this.data.geojsonObject);
          // Copy over tileIndex so it doesn't have to be re-processed
          data.tileIndex = this.data.tileIndex;
        }
        // If GeoJson FeatureCollection was passed into data (this.data), and the source is ProtomapsGeojsonSource
        // create a ProtomapsGeojsonSource with the GeoJson and copy over tileIndex
      } else if (this.source instanceof ProtomapsGeojsonSource) {
        data = new ProtomapsGeojsonSource(this.data);
        // Copy over tileIndex so it doesn't have to be re-processed
        data.tileIndex = this.source.tileIndex;
      }
    }

    if (!data) return;

    return new ProtomapsImageryProvider({
      terria: options?.terria ?? this.terria,
      id: options?.id ?? this.url,
      data,
      // Note we use softMinimumLevel here, the imagery provider minimum level is always 0
      minimumZoom: options?.minimumZoom ?? this.softMinimumLevel,
      maximumZoom: options?.maximumZoom ?? this.maximumLevel,
      maximumNativeZoom: options?.maximumNativeZoom ?? this.maximumNativeZoom,
      rectangle: options?.rectangle ?? this.rectangle,
      credit: options?.credit ?? this.credit,
      paintRules: options?.paintRules ?? this.paintRules,
      labelRules: options?.labelRules ?? this.labelRules,
      processPickedFeatures:
        options?.processPickedFeatures ?? this.processPickedFeatures
    });
  }

  /** Clones ImageryProvider, and sets paintRules to highlight picked features */
  @action
  createHighlightImageryProvider(
    feature: TerriaFeature
  ): ProtomapsImageryProvider | undefined {
    // Depending on this.source, feature IDs might be FID (for actual vector tile sources) or they will use GEOJSON_FEATURE_ID_PROP
    let featureProp: string | undefined;
    // Similarly, feature layer name will be LAYER_NAME_PROP for mvt, whereas GeoJSON features will use the constant GEOJSON_SOURCE_LAYER_NAME
    let layerName: string | undefined;

    if (this.source instanceof ProtomapsGeojsonSource) {
      featureProp = GEOJSON_FEATURE_ID_PROP;
      layerName = GEOJSON_SOURCE_LAYER_NAME;
    } else if (this.source instanceof ProtomapsArcGisPbfSource) {
      featureProp = this.source.objectIdField;
      layerName = GEOJSON_SOURCE_LAYER_NAME;
    } else {
      featureProp = this.idProperty;
      layerName = feature.properties?.[LAYER_NAME_PROP]?.getValue();
    }

    const featureId = feature.properties?.[featureProp]?.getValue();

    if (isDefined(featureId) && isDefined(layerName)) {
      return this.clone({
        labelRules: [],
        paintRules: [
          {
            dataLayer: layerName,
            symbolizer: new LineSymbolizer({
              color: this.terria.baseMapContrastColor,
              width: 4
            }),
            minzoom: 0,
            maxzoom: Infinity,
            filter: (_zoom, feature) =>
              feature.props?.[featureProp!] === featureId
          }
        ]
      });
    }
    return;
  }
}
