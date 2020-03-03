import i18next from "i18next";
import uniqWith from "lodash-es/uniqWith";
import { computed, runInAction } from "mobx";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import ArcGisMapServerImageryProvider from "terriajs-cesium/Source/Scene/ArcGisMapServerImageryProvider";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import URI from "urijs";
import filterOutUndefined from "../Core/filterOutUndefined";
import isDefined from "../Core/isDefined";
import loadJson from "../Core/loadJson";
import replaceUnderscores from "../Core/replaceUnderscores";
import TerriaError from "../Core/TerriaError";
import proj4definitions from "../Map/Proj4Definitions";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import ArcGisMapServerCatalogItemTraits from "../Traits/ArcGisMapServerCatalogItemTraits";
import { InfoSectionTraits } from "../Traits/CatalogMemberTraits";
import LegendTraits, { LegendItemTraits } from "../Traits/LegendTraits";
import { RectangleTraits } from "../Traits/MappableTraits";
import CreateModel from "./CreateModel";
import createStratumInstance from "./createStratumInstance";
import getToken from "./getToken";
import LoadableStratum from "./LoadableStratum";
import Mappable from "./Mappable";
import { BaseModel } from "./Model";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import StratumOrder from "./StratumOrder";
import StratumFromTraits from "./StratumFromTraits";

const proj4 = require("proj4").default;
const unionRectangleArray = require("../Map/unionRectangleArray");

interface RectangleExtent {
  east: number;
  south: number;
  west: number;
  north: number;
}

interface DocumentInfo {
  Author?: string;
  Title?: string;
}

interface MapServer {
  documentInfo?: DocumentInfo;
  description?: string;
  copyrightText?: string;
}

interface SpatialReference {
  wkid?: number;
}

interface Extent {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  spatialReference?: SpatialReference;
}

interface Layer {
  id: number;
  name?: string;
  description?: string;
  copyrightText?: string;
  extent?: Extent;
  maxScale?: number;
}

interface Legend {
  label?: string;
  contentType: string;
  imageData: string;
  width: number;
  height: number;
}

class MapServerStratum extends LoadableStratum(
  ArcGisMapServerCatalogItemTraits
) {
  static stratumName = "mapServer";

  constructor(
    private readonly _item: ArcGisMapServerCatalogItem,
    private readonly _mapServer: MapServer,
    private readonly _allLayers: Layer[],
    private readonly _legends: {
      layers?: { layerId: number; layerName: string; legend: Legend[] }[];
    },
    readonly token: string | undefined
  ) {
    super();
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new MapServerStratum(
      newModel as ArcGisMapServerCatalogItem,
      this._mapServer,
      this._allLayers,
      this._legends,
      this.token
    ) as this;
  }

  get mapServerData() {
    return this._mapServer;
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
    const serviceMetadata = getJson(item, serviceUri);
    const layersMetadata = getJson(item, layersUri);
    const legendMetadata = getJson(item, legendUri);

    const results = await Promise.all([
      serviceMetadata,
      layersMetadata,
      legendMetadata
    ]);

    const mapServer = results[0];
    const legend = results[2];

    let allLayers;
    if (isDefined(results[1].layers)) {
      allLayers = results[1].layers;
    } else if (isDefined(results[1].id)) {
      // single layer
      allLayers = [results[1]];
    } else {
      throw new TerriaError({
        title: i18next.t(
          "models.arcGisMapServerCatalogItem.unusableMetadataTitle"
        ),
        message: isDefined(results[0].error)
          ? results[0].error.message
          : i18next.t(
              "models.arcGisMapServerCatalogItem.unusableMetadataDefaultMessage"
            )
      });
    }

    const stratum = new MapServerStratum(
      item,
      mapServer,
      allLayers,
      legend,
      token
    );
    return stratum;
  }

  @computed get allLayers() {
    return filterOutUndefined(findLayers(this._allLayers, this._item.layers));
  }

  @computed get maximumScale() {
    return Math.min(
      ...filterOutUndefined(this.allLayers.map(({ maxScale }) => maxScale))
    );
  }

  @computed get name() {
    // single layer
    if (
      this.allLayers.length === 1 &&
      this.allLayers[0].name &&
      this.allLayers[0].name.length > 0
    ) {
      return replaceUnderscores(this.allLayers[0].name);
    }

    // group of layers
    else if (
      this._mapServer.documentInfo &&
      this._mapServer.documentInfo.Title &&
      this._mapServer.documentInfo.Title.length > 0
    ) {
      return replaceUnderscores(this._mapServer.documentInfo.Title);
    }
  }

  @computed get dataCustodian() {
    if (
      this._mapServer.documentInfo &&
      this._mapServer.documentInfo.Author &&
      this._mapServer.documentInfo.Author.length > 0
    ) {
      return this._mapServer.documentInfo.Author;
    }
  }

  @computed get rectangle() {
    const rectangle = getRectangleFromLayers(this._allLayers);
    return createStratumInstance(RectangleTraits, rectangle);
  }

  @computed get info() {
    function newInfo(name: string, content?: string) {
      const traits = createStratumInstance(InfoSectionTraits);
      runInAction(() => {
        traits.name = name;
        traits.content = content;
      });
      return traits;
    }

    const layer = this.allLayers[0];
    if (!isDefined(layer)) {
      return [];
    }

    return [
      newInfo(
        i18next.t("models.arcGisMapServerCatalogItem.dataDescription"),
        layer.description
      ),
      newInfo(
        i18next.t("models.arcGisMapServerCatalogItem.serviceDescription"),
        this._mapServer.description
      ),
      newInfo(
        i18next.t("models.arcGisMapServerCatalogItem.copyrightText"),
        isDefined(layer.copyrightText) && layer.copyrightText.length > 0
          ? layer.copyrightText
          : this._mapServer.copyrightText
      )
    ];
  }

  @computed get legends() {
    function newLegendItem(
      title: string,
      imageUrl: string,
      width: number,
      height: number
    ) {
      const item = createStratumInstance(LegendItemTraits);
      runInAction(() => {
        item.title = title;
        item.imageUrl = imageUrl;
        item.imageHeight = width;
        item.imageWidth = height;
      });
      return item;
    }

    const layers = isDefined(this._item.layers)
      ? this._item.layers.split(",")
      : [];
    const noDataRegex = /^No[\s_-]?Data$/i;
    const labelsRegex = /_Labels$/;
    const legend = createStratumInstance(LegendTraits);
    runInAction(() => {
      legend.items = legend.items || [];
    });

    (this._legends.layers || []).forEach(l => {
      if (noDataRegex.test(l.layerName) || labelsRegex.test(l.layerName)) {
        return;
      }
      if (
        layers.length > 0 &&
        layers.indexOf(l.layerId.toString()) < 0 &&
        layers.indexOf(l.layerName.toLowerCase()) < 0
      ) {
        // layer not selected
        return;
      }

      l.legend.forEach(leg => {
        const title = replaceUnderscores(
          leg.label !== "" ? leg.label : l.layerName
        );
        const dataUrl = "data:" + leg.contentType + ";base64," + leg.imageData;
        if (isDefined(legend.items)) {
          legend.items.push(
            newLegendItem(title, dataUrl, leg.width, leg.height)
          );
        }
      });
    });

    legend.items = uniqWith(legend.items, (a, b) => a.imageUrl === b.imageUrl);

    return [legend];
  }
}

StratumOrder.addLoadStratum(MapServerStratum.stratumName);

export default class ArcGisMapServerCatalogItem
  extends UrlMixin(
    CatalogMemberMixin(CreateModel(ArcGisMapServerCatalogItemTraits))
  )
  implements Mappable {
  static readonly type = "esri-mapServer";
  get typeName() {
    return i18next.t("models.arcGisMapServerCatalogItem.name");
  }

  readonly supportsSplitting = true;
  readonly canZoomTo = true;
  readonly isMappable = true;

  get type() {
    return ArcGisMapServerCatalogItem.type;
  }

  protected forceLoadMetadata(): Promise<void> {
    return MapServerStratum.load(this).then(stratum => {
      runInAction(() => {
        this.strata.set(MapServerStratum.stratumName, stratum);
      });
    });
  }

  loadMapItems() {
    return this.loadMetadata();
  }

  @computed get imageryProvider() {
    const stratum = <MapServerStratum>(
      this.strata.get(MapServerStratum.stratumName)
    );

    if (!isDefined(this.url) || !isDefined(stratum)) {
      return;
    }

    const maximumLevel = maximumScaleToLevel(this.maximumScale);
    const dynamicRequired = this.layers && this.layers.length > 0;
    const imageryProvider = new ArcGisMapServerImageryProvider({
      url: cleanAndProxyUrl(this, getBaseURI(this).toString()),
      layers: this.layers,
      tilingScheme: new WebMercatorTilingScheme(),
      maximumLevel: maximumLevel,
      parameters: this.parameters,
      enablePickFeatures: this.allowFeaturePicking,
      usePreCachedTilesIfAvailable: !dynamicRequired,
      mapServerData: stratum.mapServerData,
      token: stratum.token
    });

    const maximumLevelBeforeMessage = maximumScaleToLevel(
      this.maximumScaleBeforeMessage
    );

    if (isDefined(maximumLevelBeforeMessage)) {
      const realRequestImage = imageryProvider.requestImage;
      let messageDisplayed = false;

      imageryProvider.requestImage = (x, y, level) => {
        if (level > maximumLevelBeforeMessage) {
          if (!messageDisplayed) {
            this.terria.error.raiseEvent(
              new TerriaError({
                title: "Dataset will not be shown at this scale",
                message:
                  'The "' +
                  this.name +
                  '" dataset will not be shown when zoomed in this close to the map because the data custodian has ' +
                  "indicated that the data is not intended or suitable for display at this scale.  Click the dataset's Info button on the " +
                  "Now Viewing tab for more information about the dataset and the data custodian."
              })
            );
            messageDisplayed = true;
          }

          if (!this.showTilesAfterMessage) {
            return (<any>ImageryProvider.loadImage)(
              imageryProvider,
              this.terria.baseUrl + "images/blank.png"
            );
          }
        }
        return realRequestImage.call(imageryProvider, x, y, level);
      };
    }

    return imageryProvider;
  }

  @computed get mapItems() {
    if (isDefined(this.imageryProvider)) {
      return [
        {
          alpha: this.opacity,
          show: this.show,
          imageryProvider: this.imageryProvider
        }
      ];
    }
    return [];
  }

  @computed get layers() {
    if (super.layers) {
      return super.layers;
    }

    if (isDefined(this.uri)) {
      const lastSegment = this.uri.segment(-1);
      if (isDefined(lastSegment) && lastSegment.match(/\d+/)) {
        return lastSegment;
      }
    }
  }

  @computed get allSelectedLayers() {
    const stratum = <MapServerStratum>(
      this.strata.get(MapServerStratum.stratumName)
    );
    if (!isDefined(stratum)) {
      return [];
    }

    if (!isDefined(this.layers)) {
      // if no layer is specified, return all layers
      return stratum.allLayers;
    }

    const layerIds = this.layers.split(",");
    return stratum.allLayers.filter(({ id }) =>
      layerIds.find(x => x == id.toString())
    );
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

function getJson(item: ArcGisMapServerCatalogItem, uri: any) {
  return loadJson(
    proxyCatalogItemUrl(item, uri.addQuery("f", "json").toString(), "1d")
  );
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
  return names.split(",").map(function(id) {
    return findLayer(layers, id);
  });
}

function maximumScaleToLevel(maximumScale: number | undefined) {
  if (!isDefined(maximumScale) || maximumScale <= 0.0) {
    return undefined;
  }

  const dpi = 96; // Esri default DPI, unless we specify otherwise.
  const centimetersPerInch = 2.54;
  const centimetersPerMeter = 100;
  const dotsPerMeter = (dpi * centimetersPerMeter) / centimetersPerInch;
  const tileWidth = 256;

  const circumferenceAtEquator = 2 * Math.PI * Ellipsoid.WGS84.maximumRadius;
  const distancePerPixelAtLevel0 = circumferenceAtEquator / tileWidth;
  const level0ScaleDenominator = distancePerPixelAtLevel0 * dotsPerMeter;

  // 1e-6 epsilon from WMS 1.3.0 spec, section 7.2.4.6.9.
  const ratio = level0ScaleDenominator / (maximumScale - 1e-6);
  const levelAtMinScaleDenominator = Math.log(ratio) / Math.log(2);
  return levelAtMinScaleDenominator | 0;
}

function updateBbox(extent: Extent, rectangle: RectangleExtent) {
  if (extent.xmin < rectangle.west) rectangle.west = extent.xmin;
  if (extent.ymin < rectangle.south) rectangle.south = extent.ymin;
  if (extent.xmax > rectangle.east) rectangle.east = extent.xmax;
  if (extent.ymax > rectangle.north) rectangle.north = extent.ymax;
}

function getRectangleFromLayer(
  thisLayerJson: Layer,
  rectangle: RectangleExtent
) {
  const extent = thisLayerJson.extent;
  if (
    isDefined(extent) &&
    extent.spatialReference &&
    extent.spatialReference.wkid
  ) {
    const wkid = "EPSG:" + extent.spatialReference.wkid;
    if (extent.spatialReference.wkid === 4326) {
      return updateBbox(extent, rectangle);
    }

    if (!isDefined((proj4definitions as any)[wkid])) {
      return undefined;
    }

    const source = new proj4.Proj((proj4definitions as any)[wkid]);
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

  return undefined;
}

function getRectangleFromLayers(
  layers: Layer[]
): StratumFromTraits<RectangleTraits> | undefined {
  const rectangle: RectangleExtent = {
    west: Infinity,
    south: Infinity,
    east: -Infinity,
    north: -Infinity
  };
  if (!Array.isArray(layers)) {
    getRectangleFromLayer(layers, rectangle);
  } else {
    layers.forEach(function(item) {
      getRectangleFromLayer(item, rectangle);
    });
  }
  if (
    rectangle.east === Infinity ||
    rectangle.south === Infinity ||
    rectangle.west === -Infinity ||
    rectangle.north === -Infinity
  )
    return undefined;
  return rectangle;
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
