import { featureCollection, FeatureCollection } from "@turf/helpers";
import i18next from "i18next";
import { get as _get, set as _set } from "lodash";
import { computed, makeObservable, toJS } from "mobx";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import {
  FeatureCollectionWithCrs,
  toFeatureCollection
} from "../../../Core/GeoJson";
import isDefined from "../../../Core/isDefined";
import JsonValue, { isJsonObject } from "../../../Core/Json";
import loadBlob, { isZip, parseZipJsonBlob } from "../../../Core/loadBlob";
import loadJson from "../../../Core/loadJson";
import readJson from "../../../Core/readJson";
import TerriaError from "../../../Core/TerriaError";
import CesiumIonMixin from "../../../ModelMixins/CesiumIonMixin";
import GeoJsonMixin, {
  reprojectToGeographic
} from "../../../ModelMixins/GeojsonMixin";
import ApiRequestTraits from "../../../Traits/TraitsClasses/ApiRequestTraits";
import GeoJsonCatalogItemTraits from "../../../Traits/TraitsClasses/GeoJsonCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import Model, { ModelConstructorParameters } from "../../Definition/Model";
import HasLocalData from "../../HasLocalData";
import Terria from "../../Terria";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

class GeoJsonCatalogItem
  extends CesiumIonMixin(GeoJsonMixin(CreateModel(GeoJsonCatalogItemTraits)))
  implements HasLocalData
{
  static readonly type = "geojson";

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get type() {
    return GeoJsonCatalogItem.type;
  }

  get typeName() {
    return i18next.t("models.geoJson.name");
  }

  protected _file?: File;

  setFileInput(file: File) {
    this._file = file;
  }

  @computed get hasLocalData(): boolean {
    return isDefined(this._file);
  }

  /**
   * Tries to build a FeatureCollection from partial geojson data
   */
  private featureCollectionFromPartialData(
    jsonData: JsonValue
  ): FeatureCollectionWithCrs | undefined {
    if (Array.isArray(jsonData)) {
      // Array that isn't a feature collection
      const fc = toFeatureCollection(
        jsonData.map((item) => {
          let geojson: any = item;

          if (this.responseGeoJsonPath !== undefined) {
            geojson = _get(item, this.responseGeoJsonPath);
            // Clear geojson so that it doesn't appear again in its own properties
            _set(item as object, this.responseGeoJsonPath, undefined);
          }

          if (typeof geojson === "string") {
            geojson = JSON.parse(geojson);
          }

          // add extra properties back to geojson so they appear in feature info
          geojson.properties = item;
          return geojson;
        })
      );
      if (fc) return fc;
    } else if (
      isJsonObject(jsonData, false) &&
      typeof jsonData.type === "string"
    ) {
      // Actual geojson
      const fc = toFeatureCollection(jsonData);
      if (fc) return fc;
    }
    return undefined;
  }

  protected override async forceLoadMetadata() {
    const ionResourcePromise = this.loadIonResource();
    await super.forceLoadMetadata();
    await ionResourcePromise;
  }

  protected async forceLoadGeojsonData() {
    let jsonData: JsonValue | undefined = undefined;

    // GeoJsonCatalogItemTraits.geoJsonData
    if (isDefined(this.geoJsonData)) {
      jsonData = toJS(this.geoJsonData);
    }
    // GeoJsonCatalogItemTraits.geoJsonData
    else if (isDefined(this.geoJsonString)) {
      jsonData = JSON.parse(this.geoJsonString);
      // GeojsonCatalogItem._file
    }
    // Zipped file
    else if (this._file) {
      if (isDefined(this._file.name) && isZip(this._file.name)) {
        const asAb = await this._file.arrayBuffer();
        jsonData = await parseZipJsonBlob(new Blob([asAb]));
      } else {
        jsonData = await readJson(this._file);
      }
    } else if (isDefined(this.ionResource)) {
      jsonData = await loadJson(this.ionResource);
    }
    // We have multiple sources.
    else if (this.urls.length > 0) {
      // Map each source to a FeatureCollection and then merge them to build a
      // single FeatureCollection
      const promises = this.urls.map(async (source) => {
        const json = await this.fetchSource(source);
        const fc = this.featureCollectionFromPartialData(json);
        // We need to reproject the FeatureCollection here as we will loose
        // specific CRS information when merging the multiple FCs.
        const geojson = await (fc
          ? reprojectToGeographic(
              fc,
              this.terria.configParameters.proj4ServiceBaseUrl
            )
          : undefined);
        return geojson;
      });
      const featureCollections = filterOutUndefined(
        await Promise.all(promises)
      );

      // Forced type casting required as TS not happy with assigning
      // FeatureCollection to JsonValue
      jsonData = mergeFeatureCollections(
        featureCollections
      ) as any as JsonValue;
    }
    // GeojsonTraits.url
    else if (this.url) {
      jsonData = await this.fetchSource(this);
    }

    if (jsonData === undefined) {
      throw TerriaError.from("Failed to load geojson");
    }

    const fc = this.featureCollectionFromPartialData(jsonData);
    if (fc) {
      return fc;
    }

    throw TerriaError.from(
      "Invalid geojson data - only FeatureCollection and Feature are supported"
    );
  }

  private async fetchSource(
    source: Model<ApiRequestTraits>
  ): Promise<JsonValue | undefined> {
    const url = source.url;
    if (!url) {
      return;
    }

    let jsonData;
    // URL to zipped fle
    if (isZip(url)) {
      if (typeof FileReader === "undefined") {
        throw fileApiNotSupportedError(this.terria);
      }
      const body = source.requestData ? toJS(source.requestData) : undefined;
      const blob = await loadBlob(
        proxyCatalogItemUrl(this, url),
        undefined,
        body
      );
      jsonData = await parseZipJsonBlob(blob);
    } else {
      jsonData = await loadJson(
        proxyCatalogItemUrl(this, url),
        undefined,
        source.requestData ? toJS(source.requestData) : undefined,
        source.postRequestDataAsFormData
      );
      if (source.responseDataPath) {
        jsonData = _get(jsonData, source.responseDataPath);
      }
    }
    return jsonData;
  }
}

/**
 * Reduce an array of FeatureCollection into a single FeatureCollection.
 *
 * Note that this only accumulates the features and ignores any properties set
 * on the individual FeatureCollection.
 */
function mergeFeatureCollections(
  featureCollections: Array<FeatureCollection>
): FeatureCollection {
  return featureCollection(featureCollections.map((fc) => fc.features).flat());
}

export function fileApiNotSupportedError(terria: Terria) {
  return new TerriaError({
    title: i18next.t("models.userData.fileApiNotSupportedTitle"),
    message: i18next.t("models.userData.fileApiNotSupportedTitle", {
      appName: terria.appName,
      chrome:
        '<a href="http://www.google.com/chrome" target="_blank">' +
        i18next.t("browsers.chrome") +
        "</a>",
      firefox:
        '<a href="http://www.mozilla.org/firefox" target="_blank">' +
        i18next.t("browsers.firefox") +
        "</a>",
      edge:
        '<a href="http://www.microsoft.com/edge" target="_blank">' +
        i18next.t("browsers.edge") +
        "</a>"
    })
  });
}

export default GeoJsonCatalogItem;
