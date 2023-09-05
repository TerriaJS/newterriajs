import i18next from "i18next";
import uniqWith from "lodash-es/uniqWith";
import { computed, makeObservable, override, runInAction } from "mobx";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import ArcGisMapServerImageryProvider from "terriajs-cesium/Source/Scene/ArcGisMapServerImageryProvider";
import URI from "urijs";
import createDiscreteTimesFromIsoSegments from "../../../Core/createDiscreteTimes";
import createTransformerAllowUndefined from "../../../Core/createTransformerAllowUndefined";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import isDefined from "../../../Core/isDefined";
import loadJson from "../../../Core/loadJson";
import replaceUnderscores from "../../../Core/replaceUnderscores";
import { scaleDenominatorToLevel } from "../../../Core/scaleToDenominator";
import TerriaError, { networkRequestError } from "../../../Core/TerriaError";
import Proj4Definitions from "../../../Map/Vector/Proj4Definitions";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import DiscretelyTimeVaryingMixin from "../../../ModelMixins/DiscretelyTimeVaryingMixin";
import MappableMixin, {
  ImageryParts
} from "../../../ModelMixins/MappableMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import ArcGisMapServerCatalogItemTraits from "../../../Traits/TraitsClasses/ArcGisMapServerCatalogItemTraits";
import { InfoSectionTraits } from "../../../Traits/TraitsClasses/CatalogMemberTraits";
import DiscreteTimeTraits from "../../../Traits/TraitsClasses/DiscreteTimeTraits";
import LegendTraits, {
  LegendItemTraits
} from "../../../Traits/TraitsClasses/LegendTraits";
import { RectangleTraits } from "../../../Traits/TraitsClasses/MappableTraits";
import CreateModel from "../../Definition/CreateModel";
import createStratumInstance from "../../Definition/createStratumInstance";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel, ModelConstructorParameters } from "../../Definition/Model";
import StratumFromTraits from "../../Definition/StratumFromTraits";
import StratumOrder from "../../Definition/StratumOrder";
import getToken from "../../getToken";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import MinMaxLevelMixin from "./../../../ModelMixins/MinMaxLevelMixin";
import { Extent, Layer, MapServer } from "./ArcGisInterfaces";

const proj4 = require("proj4").default;

interface RectangleExtent {
  east: number;
  south: number;
  west: number;
  north: number;
}

interface Legend {
  label?: string;
  contentType: string;
  imageData: string;
  width: number;
  height: number;
}

interface Legends {
  layers?: { layerId: number; layerName: string; legend?: Legend[] }[];
}

class MapServerStratum extends LoadableStratum(
  ArcGisMapServerCatalogItemTraits
) {
  static stratumName = "mapServer";

  constructor(
    private readonly _item: ArcGisMapServerCatalogItem,
    readonly mapServer: MapServer,
    readonly allLayers: Layer[],
    private readonly _legends: Legends | undefined,
    readonly token: string | undefined
  ) {
    super();
    makeObservable(this);
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new MapServerStratum(
      newModel as ArcGisMapServerCatalogItem,
      this.mapServer,
      this.allLayers,
      this._legends,
      this.token
    ) as this;
  }

  static async load(item: ArcGisMapServerCatalogItem) {
    if (!isDefined(item.uri)) {
      throw new TerriaError({
        title: i18next.t("models.arcGisMapServerCatalogItem.invalidUrlTitle"),
        message: i18next.t(
          "models.arcGisMapServerCatalogItem.invalidUrlMessage"
        )
      });
    }

    let token: string | undefined;
    if (isDefined(item.tokenUrl)) {
      token = await getToken(item.terria, item.tokenUrl, item.url);
    }

    let layerId;
    const lastSegment = item.uri.segment(-1);
    if (lastSegment && lastSegment.match(/\d+/)) {
      // URL is a single REST layer, like .../arcgis/rest/services/Society/Society_SCRC/MapServer/16
      layerId = lastSegment;
    }

    let serviceUri = getBaseURI(item);
    let layersUri = getBaseURI(item).segment(layerId || "layers"); // either 'layers' or a number
    let legendUri = getBaseURI(item).segment("legend");

    if (isDefined(token)) {
      serviceUri = serviceUri.addQuery("token", token);
      layersUri = layersUri.addQuery("token", token);
      legendUri = legendUri.addQuery("token", token);
    }

    // TODO: if tokenUrl, fetch and pass token as parameter
    const serviceMetadata: MapServer | undefined = await getJson(
      item,
      serviceUri
    );

    if (!isDefined(serviceMetadata)) {
      throw networkRequestError({
        title: i18next.t("models.arcGisService.invalidServerTitle"),
        message: i18next.t("models.arcGisService.invalidServerMessage")
      });
    }

    const legendMetadata: Legends | undefined = await getJson(item, legendUri);
    let layers: Layer[] = [];

    // If this MapServer is a single fused map cache - we can't request individual layers
    // If it is not - we request layer metadata

    if (
      !(
        serviceMetadata.singleFusedMapCache &&
        serviceMetadata.capabilities?.includes("TilesOnly")
      )
    ) {
      const layersMetadataResponse = await getJson(item, layersUri);

      // Use the slightly more basic layer metadata
      if (isDefined(serviceMetadata.layers)) {
        layers = serviceMetadata.layers;
      }

      if (isDefined(layersMetadataResponse?.layers)) {
        layers = layersMetadataResponse.layers;
        // If layersMetadata is only a single layer -> shove into an array
      } else if (isDefined(layersMetadataResponse?.id)) {
        layers = [layersMetadataResponse];
      }

      if (!isDefined(layers) || layers.length === 0) {
        throw networkRequestError({
          title: i18next.t(
            "models.arcGisMapServerCatalogItem.noLayersFoundTitle"
          ),
          message: i18next.t(
            "models.arcGisMapServerCatalogItem.noLayersFoundMessage",
            item
          )
        });
      }
    }

    const stratum = new MapServerStratum(
      item,
      serviceMetadata,
      layers,
      legendMetadata,
      token
    );
    return stratum;
  }

  @computed get maximumScale() {
    if (this._item.layersArray.length === 0) {
      return this.mapServer.maxScale;
    }

    return Math.min(
      ...filterOutUndefined(
        this._item.layersArray.map(({ maxScale }) => maxScale)
      )
    );
  }

  @computed get layers() {
    /** Try to pull out MapServer layer from URL
     * eg https://exmaple.com/arcgis/rest/services/MapServer/{layer}
     */
    if (isDefined(this._item.uri)) {
      const lastSegment = this._item.uri.segment(-1);
      if (isDefined(lastSegment) && lastSegment.match(/\d+/)) {
        return lastSegment;
      }
    }
  }

  @computed get name() {
    // single layer
    if (
      this._item.layersArray.length === 1 &&
      this._item.layersArray[0].name &&
      this._item.layersArray[0].name.length > 0
    ) {
      return replaceUnderscores(this._item.layersArray[0].name);
    }

    // group of layers (or single fused map cache)
    else if (
      this.mapServer.documentInfo &&
      this.mapServer.documentInfo.Title &&
      this.mapServer.documentInfo.Title.length > 0
    ) {
      return replaceUnderscores(this.mapServer.documentInfo.Title);
    } else if (this.mapServer.mapName && this.mapServer.mapName.length > 0) {
      return replaceUnderscores(this.mapServer.mapName);
    }
  }

  @computed get dataCustodian() {
    if (
      this.mapServer.documentInfo &&
      this.mapServer.documentInfo.Author &&
      this.mapServer.documentInfo.Author.length > 0
    ) {
      return this.mapServer.documentInfo.Author;
    }
  }

  @computed get rectangle() {
    const rectangle: RectangleExtent = {
      west: Infinity,
      south: Infinity,
      east: -Infinity,
      north: -Infinity
    };

    // If we only have the summary layer info
    if (
      this._item.layersArray.length === 0 ||
      !("extent" in this._item.layersArray[0])
    ) {
      getRectangleFromLayer(this.mapServer.fullExtent, rectangle);
    } else {
      getRectangleFromLayers(rectangle, this._item.layersArray);
    }

    if (rectangle.west === Infinity) return;
    return createStratumInstance(RectangleTraits, rectangle);
  }

  @computed get info() {
    // If we are requesting a single layer, use it to populate InfoSections
    // If we are requesting multiple layers - we only show MapServer metadata (not metadata per layer)
    const singleLayer =
      this._item.layersArray.length === 1
        ? this._item.layersArray[0]
        : undefined;

    return filterOutUndefined([
      singleLayer
        ? createStratumInstance(InfoSectionTraits, {
            name: i18next.t(
              "models.arcGisMapServerCatalogItem.dataDescription"
            ),
            content: singleLayer.description
          })
        : undefined,
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t("models.arcGisMapServerCatalogItem.serviceDescription"),
        content: this.mapServer.description
      }),
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t("models.arcGisMapServerCatalogItem.copyrightText"),
        content: singleLayer?.copyrightText ?? this.mapServer.copyrightText
      })
    ]);
  }

  @computed get legends() {
    const layers = this._item.layersArray;
    const noDataRegex = /^No[\s_-]?Data$/i;
    const labelsRegex = /_Labels$/;

    let items: StratumFromTraits<LegendItemTraits>[] = [];

    (this._legends?.layers || []).forEach((l) => {
      if (noDataRegex.test(l.layerName) || labelsRegex.test(l.layerName)) {
        return;
      }
      if (
        layers.length > 0 &&
        !layers.find((layer) => layer.id === l.layerId) &&
        !layers.find((layer) => layer.name === l.layerName)
      ) {
        // layer not selected
        return;
      }

      l.legend?.forEach((leg) => {
        const title = replaceUnderscores(
          leg.label !== "" ? leg.label : l.layerName
        );
        const dataUrl = "data:" + leg.contentType + ";base64," + leg.imageData;
        items.push(
          createStratumInstance(LegendItemTraits, {
            title,
            imageUrl: dataUrl,
            imageWidth: leg.width,
            imageHeight: leg.height
          })
        );
      });
    });

    items = uniqWith(items, (a, b) => a.imageUrl === b.imageUrl);

    return [createStratumInstance(LegendTraits, { items })];
  }
}

StratumOrder.addLoadStratum(MapServerStratum.stratumName);

interface TimeParams {
  time: string | undefined;
  interval: number | undefined;
  timeUnit: string | undefined;
  isForward: boolean | undefined;
}

export default class ArcGisMapServerCatalogItem extends UrlMixin(
  DiscretelyTimeVaryingMixin(
    MinMaxLevelMixin(
      CatalogMemberMixin(
        MappableMixin(CreateModel(ArcGisMapServerCatalogItemTraits))
      )
    )
  )
) {
  static readonly type = "esri-mapServer";

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get typeName() {
    return i18next.t("models.arcGisMapServerCatalogItem.name");
  }

  get type() {
    return ArcGisMapServerCatalogItem.type;
  }

  protected async forceLoadMetadata(): Promise<void> {
    const stratum = await MapServerStratum.load(this);
    runInAction(() => {
      this.strata.set(MapServerStratum.stratumName, stratum);
    });
  }

  protected forceLoadMapItems(): Promise<void> {
    return this.forceLoadMetadata();
  }

  @override
  get cacheDuration(): string {
    if (isDefined(super.cacheDuration)) {
      return super.cacheDuration;
    }
    return "1d";
  }

  @computed
  get discreteTimes() {
    const mapServerStratum: MapServerStratum | undefined = this.strata.get(
      MapServerStratum.stratumName
    ) as MapServerStratum | undefined;

    if (mapServerStratum?.mapServer.timeInfo === undefined) return undefined;
    // Add union type - as `time` is always defined
    const result: (StratumFromTraits<DiscreteTimeTraits> & {
      time: string;
    })[] = [];

    createDiscreteTimesFromIsoSegments(
      result,
      new Date(mapServerStratum.mapServer.timeInfo.timeExtent[0]).toISOString(),
      new Date(mapServerStratum.mapServer.timeInfo.timeExtent[1]).toISOString(),
      undefined,
      this.maxRefreshIntervals
    );
    return result;
  }

  private getTimeIntervalFromDimensions(): TimeParams | undefined {
    if (
      this.modelDimensions.length < 1 ||
      this.modelDimensions[0].selectedId === undefined
    ) {
      return undefined;
    }
    const selectedId = this.modelDimensions[0].selectedId;
    if (this.modelDimensions.length < 1 && selectedId === undefined) {
      return undefined;
    } else {
      const dimOptions = this.modelDimensions[0].options.filter(
        (opt) => opt.id === selectedId
      );
      if (dimOptions.length < 1) {
        return undefined;
      }
      const selected = dimOptions[0] as any;
      const time: string | undefined = selected.value.time
        ? new Date(selected.value.time).getTime().toString()
        : undefined;
      const interval: number | undefined = selected.value.interval;
      const timeUnit: string | undefined = selected.value.timeUnit;
      const isForward: boolean = selected.value.isForward;
      if (
        selected === undefined ||
        interval === undefined ||
        timeUnit === undefined
      ) {
        return undefined;
      } else {
        return {
          time,
          interval,
          timeUnit,
          isForward
        };
      }
    }
  }

  private getCurrentTime(timeParams: TimeParams | undefined) {
    if (timeParams?.time === undefined) {
      const dateAsUnix: string | undefined =
        this.currentDiscreteTimeTag === undefined
          ? undefined
          : new Date(this.currentDiscreteTimeTag).getTime().toString();

      return dateAsUnix;
    } else {
      return timeParams.time.toString();
    }
  }

  @computed
  private get _currentImageryParts(): ImageryParts | undefined {
    const ti = this.getTimeIntervalFromDimensions();
    // const dateAsUnix: string | undefined =
    //   this.currentDiscreteTimeTag === undefined
    //     ? undefined
    //     : new Date(this.currentDiscreteTimeTag).getTime().toString();

    const imageryProvider = this._createImageryProvider({
      time: this.getCurrentTime(ti),
      interval: ti?.interval,
      timeUnit: ti?.timeUnit,
      isForward: ti?.isForward
    });
    if (imageryProvider === undefined) {
      return undefined;
    }
    return {
      imageryProvider,
      alpha: this.opacity,
      show: this.show,
      clippingRectangle: this.clipToRectangle ? this.cesiumRectangle : undefined
    };
  }

  @computed
  private get _nextImageryParts(): ImageryParts | undefined {
    if (
      this.terria.timelineStack.contains(this) &&
      !this.isPaused &&
      this.nextDiscreteTimeTag
    ) {
      const ti = this.getTimeIntervalFromDimensions();
      const imageryProvider = this._createImageryProvider({
        time: this.getCurrentTime(ti),
        interval: ti?.interval,
        timeUnit: ti?.timeUnit,
        isForward: ti?.isForward
      });
      if (imageryProvider === undefined) {
        return undefined;
      }

      imageryProvider.enablePickFeatures = false;

      return {
        imageryProvider,
        alpha: 0.0,
        show: true,
        clippingRectangle: this.clipToRectangle
          ? this.cesiumRectangle
          : undefined
      };
    } else {
      return undefined;
    }
  }

  private _createImageryProvider = createTransformerAllowUndefined(
    (
      timeParams: TimeParams | undefined
    ): ArcGisMapServerImageryProvider | undefined => {
      const stratum = <MapServerStratum>(
        this.strata.get(MapServerStratum.stratumName)
      );

      if (!isDefined(this.url) || !isDefined(stratum)) {
        return;
      }

      function intervalInMs(
        interval: number | undefined,
        timeUnit: string | undefined
      ): number | undefined {
        if (interval === undefined || timeUnit === undefined) {
          return undefined;
        }
        const msInOneHour = 3600 * 1000;
        const theUnit = timeUnit.toLowerCase();
        if (theUnit === "year") return interval * 365 * 24 * msInOneHour;
        else if (theUnit === "month") return interval * 30 * 24 * msInOneHour;
        else if (theUnit === "week") return interval * 7 * 24 * msInOneHour;
        else if (theUnit === "day") return interval * 24 * msInOneHour;
        else if (theUnit === "hour") return interval * msInOneHour;
        else if (theUnit === "minute") return interval * 60 * 1000;
        else if (theUnit === "second") return interval * 1000;
        else return undefined;
      }

      function getTimeQueryString(
        currentTime: string,
        interval: number,
        isForward: boolean = true
      ) {
        if (isForward) {
          const endTime = Number(currentTime) + interval;
          return currentTime + "," + endTime;
        } else {
          const startTime = Number(currentTime) - interval;
          return "" + startTime + "," + currentTime;
        }
      }

      const params: any = Object.assign({}, this.parameters);
      const currentTime = timeParams?.time;
      if (currentTime !== undefined) {
        const interval = intervalInMs(
          timeParams?.interval,
          timeParams?.timeUnit
        );
        if (interval !== undefined) {
          params.time = getTimeQueryString(
            currentTime,
            interval,
            timeParams?.isForward
          );
        } else {
          params.time = currentTime;
        }
      }

      const maximumLevel = scaleDenominatorToLevel(
        this.maximumScale,
        true,
        false
      );

      const imageryProvider = new ArcGisMapServerImageryProvider({
        url: cleanAndProxyUrl(this, getBaseURI(this).toString()),
        layers: this.layersArray.map((l) => l.id).join(","),
        tilingScheme: new WebMercatorTilingScheme(),
        maximumLevel: maximumLevel,
        tileHeight: this.tileHeight,
        tileWidth: this.tileWidth,
        parameters: params,
        enablePickFeatures: this.allowFeaturePicking,
        /** Only used "pre-cached" tiles if we aren't requesting any specific layers
         * If the `layersArray` property is specified, we request individual dynamic layers and ignore the fused map cache.
         */
        usePreCachedTilesIfAvailable: this.layersArray.length == 0,
        mapServerData: stratum.mapServer,
        token: stratum.token,
        credit: this.attribution
      });

      return this.updateRequestImage(imageryProvider, false);
    }
  );

  @computed
  get mapItems() {
    const result = [];

    const current = this._currentImageryParts;
    if (current) {
      result.push(current);
    }

    const next = this._nextImageryParts;
    if (next) {
      result.push(next);
    }

    return result;
  }

  /** Return array of MapServer layers from `layers` trait (which is CSV of layer IDs) - this will only return **valid** MapServer layers.*/
  @computed get layersArray() {
    const stratum = <MapServerStratum | undefined>(
      this.strata.get(MapServerStratum.stratumName)
    );
    if (!stratum) return [];

    return filterOutUndefined(findLayers(stratum.allLayers, this.layers));
  }
}

function getBaseURI(item: ArcGisMapServerCatalogItem) {
  const uri = new URI(item.url);
  const lastSegment = uri.segment(-1);
  if (lastSegment && lastSegment.match(/\d+/)) {
    uri.segment(-1, "");
  }
  return uri;
}

async function getJson(item: ArcGisMapServerCatalogItem, uri: any) {
  try {
    const response = await loadJson(
      proxyCatalogItemUrl(item, uri.addQuery("f", "json").toString())
    );
    return response;
  } catch (err) {
    console.log(err);
    return undefined;
  }
}

/* Given a comma-separated string of layer names, returns the layer objects corresponding to them. */
function findLayers(layers: Layer[], names: string | undefined) {
  function findLayer(layers: Layer[], id: string) {
    var idLowerCase = id.toLowerCase();
    var foundByName;
    for (var i = 0; i < layers.length; ++i) {
      var layer = layers[i];
      if (layer.id.toString() === id) {
        return layer;
      } else if (
        isDefined(layer.name) &&
        layer.name.toLowerCase() === idLowerCase
      ) {
        foundByName = layer;
      }
    }
    return foundByName;
  }

  if (!isDefined(names)) {
    // If a list of layers is not specified, we're using all layers.
    return layers;
  }
  return names.split(",").map(function (id) {
    return findLayer(layers, id);
  });
}

function updateBbox(extent: Extent, rectangle: RectangleExtent) {
  if (extent.xmin < rectangle.west) rectangle.west = extent.xmin;
  if (extent.ymin < rectangle.south) rectangle.south = extent.ymin;
  if (extent.xmax > rectangle.east) rectangle.east = extent.xmax;
  if (extent.ymax > rectangle.north) rectangle.north = extent.ymax;
}

function getRectangleFromLayer(extent: Extent, rectangle: RectangleExtent) {
  const wkidCode =
    extent?.spatialReference?.latestWkid ?? extent?.spatialReference?.wkid;

  if (isDefined(extent) && isDefined(wkidCode)) {
    if (wkidCode === 4326) {
      return updateBbox(extent, rectangle);
    }

    const wkid = "EPSG:" + wkidCode;

    if (!isDefined(Proj4Definitions[wkid])) {
      return;
    }

    const source = new proj4.Proj(Proj4Definitions[wkid]);
    const dest = new proj4.Proj("EPSG:4326");

    let p = proj4(source, dest, [extent.xmin, extent.ymin]);

    const west = p[0];
    const south = p[1];

    p = proj4(source, dest, [extent.xmax, extent.ymax]);

    const east = p[0];
    const north = p[1];

    return updateBbox(
      { xmin: west, ymin: south, xmax: east, ymax: north },
      rectangle
    );
  }
}

function getRectangleFromLayers(rectangle: RectangleExtent, layers: Layer[]) {
  layers.forEach(function (item) {
    item.extent && getRectangleFromLayer(item.extent, rectangle);
  });
}

function cleanAndProxyUrl(
  catalogItem: ArcGisMapServerCatalogItem,
  url: string
) {
  return proxyCatalogItemUrl(catalogItem, cleanUrl(url));
}

function cleanUrl(url: string) {
  // Strip off the search portion of the URL
  var uri = new URI(url);
  uri.search("");
  return uri.toString();
}
