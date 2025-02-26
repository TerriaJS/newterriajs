import {
  featureCollection,
  Geometry,
  GeometryCollection,
  Properties
} from "@turf/helpers";
import i18next from "i18next";
import { computed, makeObservable, override, runInAction } from "mobx";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import URI from "urijs";
import { FeatureCollectionWithCrs } from "../../../Core/GeoJson";
import isDefined from "../../../Core/isDefined";
import loadJson from "../../../Core/loadJson";
import Result from "../../../Core/Result";
import { networkRequestError } from "../../../Core/TerriaError";
import ProtomapsImageryProvider from "../../../Map/ImageryProvider/ProtomapsImageryProvider";
import featureDataToGeoJson from "../../../Map/PickedFeatures/featureDataToGeoJson";
import { ProtomapsArcGisPbfSource } from "../../../Map/Vector/Protomaps/ProtomapsArcGisPbfSource";
import { tableStyleToProtomaps } from "../../../Map/Vector/Protomaps/tableStyleToProtomaps";
import GeoJsonMixin from "../../../ModelMixins/GeojsonMixin";
import MinMaxLevelMixin from "../../../ModelMixins/MinMaxLevelMixin";
import ArcGisFeatureServerCatalogItemTraits from "../../../Traits/TraitsClasses/ArcGisFeatureServerCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import { ModelConstructorParameters } from "../../Definition/Model";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import { ArcGisFeatureServerStratum } from "./ArcGisFeatureServerStratum";

export default class ArcGisFeatureServerCatalogItem extends MinMaxLevelMixin(
  GeoJsonMixin(CreateModel(ArcGisFeatureServerCatalogItemTraits))
) {
  static readonly type = "esri-featureServer";

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get type(): string {
    return ArcGisFeatureServerCatalogItem.type;
  }

  get typeName(): string {
    return i18next.t("models.arcGisFeatureServerCatalogItem.name");
  }

  protected async forceLoadMetadata(): Promise<void> {
    if (this.strata.get(ArcGisFeatureServerStratum.stratumName) === undefined) {
      const stratum = await ArcGisFeatureServerStratum.load(this);
      runInAction(() => {
        this.strata.set(ArcGisFeatureServerStratum.stratumName, stratum);
      });
    }
  }

  protected async forceLoadGeojsonData(): Promise<
    FeatureCollectionWithCrs<Geometry | GeometryCollection, Properties>
  > {
    // If we are tiling requests, then we use the ProtomapsImageryProvider - see mapItems
    if (this.tileRequests) return featureCollection([]);

    const getEsriLayerJson = async (resultOffset?: number) => {
      const url = proxyCatalogItemUrl(
        this,
        this.buildEsriJsonUrl(resultOffset).throwIfUndefined().toString()
      );
      return await loadJson(url);
    };

    if (!this.supportsPagination) {
      // Make a single request without pagination
      return (
        featureDataToGeoJson(await getEsriLayerJson()) ?? {
          type: "FeatureCollection",
          features: []
        }
      );
    }

    // Esri Feature Servers have a maximum limit to how many features they'll return at once, so for a service with many
    // features, we have to make multiple requests. We can't figure out how many features we need to request ahead of
    // time (there's an API for it but it times out for services with thousands of features), so we just keep trying
    // until we run out of features or hit the limit
    const featuresPerRequest = this.featuresPerRequest;
    const maxFeatures = this.maxFeatures;
    const combinedEsriLayerJson = await getEsriLayerJson(0);

    const mapObjectIds = (features: any) =>
      features.map(
        (feature: any) =>
          feature.attributes.OBJECTID ?? feature.attributes.objectid
      );
    const seenIDs: Set<string> = new Set(
      mapObjectIds(combinedEsriLayerJson.features)
    );

    let currentOffset = 0;
    let exceededTransferLimit = combinedEsriLayerJson.exceededTransferLimit;
    while (
      combinedEsriLayerJson.features.length <= maxFeatures &&
      exceededTransferLimit === true
    ) {
      currentOffset += featuresPerRequest;
      const newEsriLayerJson = await getEsriLayerJson(currentOffset);
      if (
        newEsriLayerJson.features === undefined ||
        newEsriLayerJson.features.length === 0
      ) {
        break;
      }

      const newIds: string[] = mapObjectIds(newEsriLayerJson.features);

      if (newIds.every((id: string) => seenIDs.has(id))) {
        // We're getting data that we've received already, assume have everything we need and stop fetching
        break;
      }

      newIds.forEach((id) => seenIDs.add(id));
      combinedEsriLayerJson.features = combinedEsriLayerJson.features.concat(
        newEsriLayerJson.features
      );
      exceededTransferLimit = newEsriLayerJson.exceededTransferLimit;

      if (exceededTransferLimit) {
        console.log("warning: exceeded transfer limit");
      }
    }

    return (
      featureDataToGeoJson(combinedEsriLayerJson) ?? {
        type: "FeatureCollection",
        features: []
      }
    );
  }

  @computed get imageryProvider() {
    const { paintRules, labelRules } = tableStyleToProtomaps(this, false, true);

    const url = this.buildEsriJsonUrl()
      .logError("Failed to create valid FeatureServer URL")
      ?.toString();

    if (!url) return;

    let provider = new ProtomapsImageryProvider({
      maximumZoom: this.getMaximumLevel(false),
      minimumZoom: this.getMinimumLevel(false),
      terria: this.terria,
      data: new ProtomapsArcGisPbfSource({
        url: url,
        outFields: [...this.outFields],
        featuresPerTileRequest: this.featuresPerTileRequest,
        maxRecordCountFactor: this.maxRecordCountFactor,
        maxTiledFeatures: this.maxTiledFeatures,
        tilingScheme: new WebMercatorTilingScheme(),
        enablePickFeatures: this.allowFeaturePicking,
        objectIdField: this.objectIdField,
        supportsQuantization: this.supportsQuantization
      }),
      id: this.uniqueId,
      paintRules,
      labelRules
    });

    provider = this.wrapImageryPickFeatures(provider);
    provider = this.updateRequestImage(provider);

    return provider;
  }

  @override
  get mapItems() {
    // If we aren't tiling requests, then we use GeoJsonMixin forceLoadGeojsonData
    if (!this.tileRequests) return super.mapItems;

    if (!this.imageryProvider) return [];

    return [
      {
        imageryProvider: this.imageryProvider,
        show: this.show,
        alpha: this.opacity,
        clippingRectangle: undefined
      }
    ];
  }

  @override
  get dataColumnMajor() {
    if (super.dataColumnMajor.length > 0) {
      return super.dataColumnMajor;
    }
    // If we are tiling requests, then we don't have geojson/tabular data
    // We have to populate columns with empty strings, otherwise TableMixin.tableColumns will be empty.
    return this.columns.map((column) => [column.name ?? ""]);
  }

  /**
   * Constructs the url for a request to a feature server
   * @param resultOffset Allows for pagination of results.
   *  See https://developers.arcgis.com/rest/services-reference/enterprise/query-feature-service-layer-.htm
   */
  buildEsriJsonUrl(resultOffset?: number) {
    const url = cleanUrl(this.url || "0d");
    const urlComponents = splitLayerIdFromPath(url);
    const layerId = urlComponents.layerId;

    if (!isDefined(layerId)) {
      return Result.error(
        networkRequestError({
          title: {
            key: "models.arcGisFeatureServerCatalogItem.invalidServiceTitle"
          },
          message: {
            key: "models.arcGisFeatureServerCatalogItem.invalidServiceMessage"
          }
        })
      );
    }

    // We used to make a call to a different ArcGIS API endpoint
    // (https://developers.arcgis.com/rest/services-reference/enterprise/query-feature-service-.htm) which took a
    // `layerdef` parameter, which is more or less equivalent to `where`. To avoid breaking old catalog items, we need
    // to use `layerDef` if `where` hasn't been set
    const where = this.where === "1=1" ? this.layerDef : this.where;

    const uri = new URI(url)
      .segment("query")
      .addQuery("f", "json")
      .addQuery("where", where)
      .addQuery("outFields", "*")
      .addQuery("outSR", "4326");

    if (resultOffset !== undefined) {
      // Pagination specific parameters
      uri
        .addQuery("resultRecordCount", this.featuresPerRequest)
        .addQuery("resultOffset", resultOffset);
    }

    return new Result(uri);
  }
}

function splitLayerIdFromPath(url: string) {
  const regex = /^(.*FeatureServer)\/(\d+)/;
  const matches = url.match(regex);
  if (isDefined(matches) && matches !== null && matches.length > 2) {
    return {
      layerId: matches[2],
      urlWithoutLayerId: matches[1]
    };
  }
  return {
    urlWithoutLayerId: url
  };
}

function cleanUrl(url: string): string {
  // Strip off the search portion of the URL
  const uri = new URI(url);
  uri.search("");
  return uri.toString();
}
