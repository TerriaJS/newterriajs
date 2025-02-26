import { featureCollection, Geometry, GeometryCollection } from "@turf/helpers";
import i18next from "i18next";
import { computed, makeObservable, observable, runInAction } from "mobx";
import RequestErrorEvent from "terriajs-cesium/Source/Core/RequestErrorEvent";
import URI from "urijs";
import { toFeatureCollection } from "../../../Core/GeoJson";
import JsonValue, {
  isJsonNumber,
  isJsonObject,
  isJsonString,
  isJsonStringArray,
  JsonObject
} from "../../../Core/Json";
import loadJson from "../../../Core/loadJson";
import Result from "../../../Core/Result";
import TerriaError, { networkRequestError } from "../../../Core/TerriaError";
import GeoJsonMixin from "../../../ModelMixins/GeojsonMixin";
import CartoMapV3CatalogItemTraits from "../../../Traits/TraitsClasses/CartoMapV3CatalogItemTraits";
import { GeoJsonTraits } from "../../../Traits/TraitsClasses/GeoJsonTraits";
import TableStyleTraits from "../../../Traits/TraitsClasses/Table/StyleTraits";
import CreateModel from "../../Definition/CreateModel";
import createStratumInstance from "../../Definition/createStratumInstance";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel } from "../../Definition/Model";
import StratumOrder from "../../Definition/StratumOrder";
import Terria from "../../Terria";

class CartoMapV3Stratum extends LoadableStratum(GeoJsonTraits) {
  static stratumName = "cartoMapV3Stratum";
  constructor(readonly catalogItem: CartoMapV3CatalogItem) {
    super();
    makeObservable(this);
  }

  static load(item: CartoMapV3CatalogItem) {
    return new CartoMapV3Stratum(item);
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new CartoMapV3Stratum(newModel as CartoMapV3CatalogItem) as this;
  }

  // Hide "cartodb_id" style
  @computed get styles() {
    return [
      createStratumInstance(TableStyleTraits, {
        id: "cartodb_id",
        hidden: true
      })
    ];
  }
}

StratumOrder.addLoadStratum(CartoMapV3Stratum.stratumName);

export default class CartoMapV3CatalogItem extends GeoJsonMixin(
  CreateModel(CartoMapV3CatalogItemTraits)
) {
  static readonly type = "carto-v3";

  @observable
  geoJsonUrls: string[] = [];

  // Commented out as we don't support tileJSON yet
  // @observable
  // mvtTileJsonUrls: string[] = [];

  @observable geoJsonSize: number | undefined;

  constructor(
    id: string | undefined,
    terria: Terria,
    sourceReference?: BaseModel | undefined
  ) {
    super(id, terria, sourceReference);

    makeObservable(this);

    if (this.strata.get(CartoMapV3Stratum.stratumName) === undefined) {
      runInAction(() => {
        this.strata.set(
          CartoMapV3Stratum.stratumName,
          new CartoMapV3Stratum(this)
        );
      });
    }
  }

  get type() {
    return CartoMapV3CatalogItem.type;
  }

  get typeName() {
    return i18next.t("models.carto-v3.name");
  }

  protected async forceLoadMetadata() {
    let response: JsonObject | undefined;

    // If cartoQuery is defined - use Query API (https://api-docs.carto.com/#8f2020d9-edf3-4b50-ae58-9edeaa34613c)
    if (this.cartoQuery) {
      const url = new URI(this.baseUrl)
        .path("")
        .path(`v3/maps/${this.connectionName}/query`);

      response = (
        await callCartoApi(url.toString(), this.accessToken, {
          q: this.cartoQuery,
          geo_column: this.cartoGeoColumn
        })
      )?.throwIfError();
    }
    // If cartoTableName is defined - use Table API (https://api-docs.carto.com/#6a05d4d7-c6a1-4635-a8de-c91fa5e77fda)
    else if (this.cartoTableName) {
      const url = new URI(this.baseUrl)
        .path("")
        .path(`v3/maps/${this.connectionName}/table`)
        .query({
          name: this.cartoTableName,
          columns: this.cartoColumns?.join(","),
          geo_column: this.cartoGeoColumn
        });

      response = (
        await callCartoApi(url.toString(), this.accessToken)
      )?.throwIfError();
    } else {
      throw new TerriaError({
        title: "Invalid Carto V3 config",
        message: "`cartoQuery` or `cartoTableName` must be defined"
      });
    }

    let geoJsonUrls: string[] = [];
    // Commented out as we don't support tileJSON yet
    // let mvtTileJsonUrls: string[] = [];

    if (
      response &&
      isJsonObject(response.geojson) &&
      isJsonStringArray(response.geojson.url)
    ) {
      geoJsonUrls = response.geojson.url;
    }

    // Commented out as we don't support tileJSON yet
    // if (
    //   response &&
    //   isJsonObject(response.tilejson) &&
    //   isJsonStringArray(response.tilejson.url)
    // ) {
    //   mvtTileJsonUrls = response.tilejson.url;
    // }

    if (geoJsonUrls.length === 0 /*&& mvtTileJsonUrls.length === 0*/) {
      throw TerriaError.from("No GeoJSON found.");
    }

    runInAction(() => {
      if (response && isJsonNumber(response?.size)) {
        this.geoJsonSize = response.size;
      }
      this.geoJsonUrls = geoJsonUrls;
      // Commented out as we don't support tileJSON yet
      // this.mvtTileJsonUrls = mvtTileJsonUrls;
    });
  }

  protected async forceLoadGeojsonData() {
    if (this.geoJsonUrls.length === 0)
      throw TerriaError.from("No GeoJSON URL found for Carto table");

    let jsonData: JsonValue | undefined = undefined;

    // Download all geoJson files
    const geojsonResponses = await Promise.all(
      this.geoJsonUrls.map(async (url) => {
        jsonData = (await callCartoApi(url, this.accessToken))?.throwIfError();

        if (jsonData === undefined) {
          throw new TerriaError({
            title: "Failed to load GeoJSON",
            message: `Failed to load GeoJSON URL ${url}`
          });
        }

        if (
          isJsonObject(jsonData, false) &&
          typeof jsonData.type === "string"
        ) {
          // Actual geojson
          const fc = toFeatureCollection(jsonData);
          if (fc) return fc;
        }

        throw new TerriaError({
          title: "Failed to load GeoJSON",
          message: `Invalid response from GeoJSON URL ${url}:\n\n
          \`\`\`
          ${JSON.stringify(jsonData)}
          \`\`\``
        });
      })
    );

    // NOTE: Commented out until we add tileJson/mvt support
    // Download all tileJson files
    // const tilejsonResponses = await Promise.all(
    //   this.mvtTileJsonUrls.map(async (url) => {
    //     jsonData = await loadJson(url, {
    //       Authorization: `Bearer ${this.accessToken}`
    //     });

    //     if (jsonData === undefined) {
    //       throw new TerriaError({
    //         title: "Failed to load GeoJSON",
    //         message: `Failed to load GeoJSON URL ${url}`
    //       });
    //     }

    //     if (isJsonObject(jsonData, false)) {
    //       return jsonData;
    //     }

    //     throw new TerriaError({
    //       title: "Failed to load GeoJSON",
    //       message: `Invalid response from GeoJSON URL ${url}:\n\n
    //       \`\`\`
    //       ${JSON.stringify(jsonData)}
    //       \`\`\``
    //     });
    //   })
    // );

    // Merge all geojson responses into a combined feature collection
    const combinedFeatureCollection = featureCollection<
      Geometry | GeometryCollection
    >([]);

    geojsonResponses.forEach((fc) => {
      for (let i = 0; i < fc.features.length; i++) {
        combinedFeatureCollection.features.push(fc.features[i]);
      }
    });

    return combinedFeatureCollection;
  }
}

interface CartoApiErrorResponse {
  error?: string;
  message?: string;
  status?: number;
  source?: string;
  connection_id?: string;
  connection_name?: string;
}

/** Wrap loadJson calls to handle Carto API error messages */
async function callCartoApi(url: string, auth?: string, body?: JsonObject) {
  try {
    return new Result(
      await loadJson(
        url,
        auth
          ? {
              Authorization: `Bearer ${auth}`
            }
          : {},
        body
      )
    );
  } catch (e) {
    if (e instanceof RequestErrorEvent) {
      try {
        const jsonResponse = isJsonString(e.response)
          ? JSON.parse(e.response)
          : e.response;
        if (isJsonObject(jsonResponse) && isJsonString(jsonResponse.error)) {
          const cartoError = jsonResponse as CartoApiErrorResponse;
          return Result.error(
            networkRequestError(
              TerriaError.from(e, {
                title: "Error from Carto API",
                message: cartoError.message ?? cartoError.error,
                importance: -1
              })
            )
          );
        }
      } catch {}
    }
    return Result.error(e);
  }
}
