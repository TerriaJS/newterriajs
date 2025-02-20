import i18next from "i18next";
import {
  action,
  computed,
  isObservableArray,
  makeObservable,
  observable,
  override,
  runInAction,
  toJS
} from "mobx";
import Mustache from "mustache";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import URI from "urijs";
import { JsonObject } from "../../../Core/Json";
import TerriaError from "../../../Core/TerriaError";
import isDefined from "../../../Core/isDefined";
import CatalogFunctionJobMixin from "../../../ModelMixins/CatalogFunctionJobMixin";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import XmlRequestMixin from "../../../ModelMixins/XmlRequestMixin";
import xml2json from "../../../ThirdParty/xml2json";
import { ShortReportTraits } from "../../../Traits/TraitsClasses/CatalogMemberTraits";
import { FeatureInfoTemplateTraits } from "../../../Traits/TraitsClasses/FeatureInfoTraits";
import WebProcessingServiceCatalogFunctionJobTraits from "../../../Traits/TraitsClasses/WebProcessingServiceCatalogFunctionJobTraits";
import CommonStrata from "../../Definition/CommonStrata";
import CreateModel from "../../Definition/CreateModel";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel, ModelConstructorParameters } from "../../Definition/Model";
import StratumFromTraits from "../../Definition/StratumFromTraits";
import StratumOrder from "../../Definition/StratumOrder";
import createStratumInstance from "../../Definition/createStratumInstance";
import updateModelFromJson from "../../Definition/updateModelFromJson";
import upsertModelFromJson from "../../Definition/upsertModelFromJson";
import GeoJsonCatalogItem from "../CatalogItems/GeoJsonCatalogItem";
import CatalogMemberFactory from "../CatalogMemberFactory";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import executeWpsTemplate from "./ExecuteWpsTemplate.xml";

class WpsLoadableStratum extends LoadableStratum(
  WebProcessingServiceCatalogFunctionJobTraits
) {
  static stratumName = "wpsLoadable";

  constructor(readonly item: WebProcessingServiceCatalogFunctionJob) {
    super();
    makeObservable(this);
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new WpsLoadableStratum(
      newModel as WebProcessingServiceCatalogFunctionJob
    ) as this;
  }

  @action
  static load(item: WebProcessingServiceCatalogFunctionJob) {
    return new WpsLoadableStratum(item);
  }

  @computed get shortReportSections() {
    const reports = this.item.outputs
      .map((output) => {
        let report;
        if (isDefined(output.Data.LiteralData)) {
          report = createStratumInstance(ShortReportTraits, {
            name: output.Title,
            content: formatOutputValue(output.Title, output.Data.LiteralData)
          });
        }

        return report;
      })
      .filter(isDefined);
    return reports;
  }

  @computed get featureInfoTemplate() {
    const template = [
      "#### Inputs\n\n" +
        this.item.info.find((info) => info.name === "Inputs")?.content,
      "#### Outputs\n\n" + this.outputsSectionHtml
    ].join("\n\n");
    return createStratumInstance(FeatureInfoTemplateTraits, {
      template
    });
  }

  @computed get outputsSectionHtml() {
    const outputsSection =
      '<table class="cesium-infoBox-defaultTable">' +
      this.item.outputs.reduce((previousValue, output) => {
        if (
          !isDefined(output.Data) ||
          (!isDefined(output.Data.LiteralData) &&
            !isDefined(output.Data.ComplexData))
        ) {
          return previousValue;
        }
        let content = "";
        if (isDefined(output.Data.LiteralData)) {
          content = formatOutputValue(output.Title, output.Data.LiteralData);
        } else if (isDefined(output.Data.ComplexData)) {
          if (output.Data.ComplexData.mimeType === "text/csv") {
            content =
              '<chart can-download="true" hide-buttons="false" title="' +
              output.Title +
              "\" data='" +
              output.Data.ComplexData +
              '\' styling: "feature-info">';
          } else if (
            output.Data.ComplexData.mimeType ===
            "application/vnd.terriajs.catalog-member+json"
          ) {
            content = "Chart " + output.Title + " generated.";
          }
          // Support other types of ComplexData here as it becomes necessary.
        }

        return (
          previousValue +
          "<tr>" +
          '<td style="vertical-align: middle">' +
          output.Title +
          "</td>" +
          "<td>" +
          content +
          "</td>" +
          "</tr>"
        );
      }, "") +
      "</table>";
    return outputsSection;
  }

  @computed get rectangle() {
    return this.item.geoJsonItem?.rectangle;
  }
}

StratumOrder.addLoadStratum(WpsLoadableStratum.stratumName);

export default class WebProcessingServiceCatalogFunctionJob extends XmlRequestMixin(
  CatalogFunctionJobMixin(
    CreateModel(WebProcessingServiceCatalogFunctionJobTraits)
  )
) {
  static readonly type = "wps-result";

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get type() {
    return WebProcessingServiceCatalogFunctionJob.type;
  }

  get typeName() {
    return i18next.t("models.webProcessingService.wpsResult");
  }

  readonly proxyCacheDuration = "1d";

  @observable
  public geoJsonItem?: GeoJsonCatalogItem;

  private get executeUrlParameters() {
    return {
      service: "WPS",
      request: "Execute",
      version: "1.0.0"
    };
  }

  /**
   * Returns the proxied URL for the Execute endpoint.
   */
  @computed get executeUrl() {
    if (!isDefined(this.url)) {
      return;
    }

    const uri = new URI(this.url).query(this.executeUrlParameters);

    return proxyCatalogItemUrl(this, uri.toString(), this.proxyCacheDuration);
  }

  async _invoke() {
    if (
      !isDefined(this.identifier) ||
      !isDefined(this.executeUrl) ||
      !isDefined(this.wpsParameters)
    ) {
      throw `Identifier, executeUrl and wpsParameters must be set`;
    }

    const identifier = this.identifier;
    const executeUrl = this.executeUrl;

    const parameters = {
      ...this.executeUrlParameters,
      Identifier: htmlEscapeText(identifier),
      DataInputs: toJS(this.wpsParameters),
      storeExecuteResponse: toJS(this.storeSupported),
      status: toJS(this.statusSupported)
    };

    let promise: Promise<any>;
    if (this.executeWithHttpGet) {
      promise = this.getXml(executeUrl, {
        ...parameters,
        DataInputs: parameters.DataInputs.map(
          ({ inputIdentifier: id, inputValue: val }) => `${id}=${val}`
        ).join(";")
      });
    } else {
      const executeXml = Mustache.render(executeWpsTemplate, parameters);
      promise = this.postXml(executeUrl, executeXml);
    }

    const executeResponseXml = await promise;
    if (
      !executeResponseXml ||
      !executeResponseXml.documentElement ||
      executeResponseXml.documentElement.localName !== "ExecuteResponse"
    ) {
      throw `Invalid XML response for WPS ExecuteResponse`;
    }

    const json = xml2json(executeResponseXml);

    // Check if finished
    if (this.checkStatus(json)) {
      // set result
      runInAction(() => this.setTrait(CommonStrata.user, "wpsResponse", json));
      return true;
    }

    // If not finished, set response URL for polling
    runInAction(() =>
      this.setTrait(CommonStrata.user, "wpsResponseUrl", json.statusLocation)
    );

    return false;
  }

  /**
   * Return true for finished, false for running, throw error otherwise
   */
  @action
  checkStatus(json: any) {
    const status = json.Status;
    if (!isDefined(status)) {
      throw new TerriaError({
        sender: this,
        title: i18next.t(
          "models.webProcessingService.invalidResponseErrorTitle"
        ),
        message: i18next.t(
          "models.webProcessingService.invalidResponseErrorMessage",
          {
            name: this.name
          }
        )
      });
    }

    if (isDefined(status.ProcessFailed)) {
      throw (
        status.ProcessFailed.ExceptionReport?.Exception?.ExceptionText ||
        JSON.stringify(status.ProcessFailed)
      );
    } else if (isDefined(status.ProcessSucceeded)) {
      return true;
    }

    return false;
  }

  async pollForResults() {
    if (!isDefined(this.wpsResponseUrl)) {
      return true;
    }
    const promise = this.getXml(
      proxyCatalogItemUrl(this, this.wpsResponseUrl, "0d")
    );
    const xml = await promise;

    const json = xml2json(xml);

    return this.checkStatus(json);
  }

  async downloadResults() {
    if (isDefined(this.wpsResponseUrl) && !isDefined(this.wpsResponse)) {
      const url = proxyCatalogItemUrl(this, this.wpsResponseUrl, "0d");
      const wpsResponse = xml2json(await this.getXml(url));
      runInAction(() => {
        this.setTrait(CommonStrata.user, "wpsResponse", wpsResponse);
      });
    }

    if (!isDefined(this.wpsResponse)) return;

    const reports: StratumFromTraits<ShortReportTraits>[] = [];

    const outputs = runInAction(() => this.outputs);

    const results: CatalogMemberMixin.Instance[] = [];

    await Promise.all(
      outputs.map(async (output, i) => {
        if (!output.Data.ComplexData) {
          return;
        }

        let reportContent = output.Data.ComplexData;
        if (output.Data.ComplexData.mimeType === "text/csv") {
          reportContent =
            '<collapsible title="' +
            output.Title +
            '" open="' +
            (i === 0 ? "true" : "false") +
            '">';
          reportContent +=
            '<chart can-download="true" hide-buttons="false" title="' +
            output.Title +
            "\" data='" +
            output.Data.ComplexData.text +
            '\' styling="histogram"></chart>';
          reportContent += "</collapsible>";
        } else if (
          output.Data.ComplexData.mimeType ===
          "application/vnd.terriajs.catalog-member+json"
        ) {
          // Create a catalog member from the embedded json
          const json = JSON.parse(output.Data.ComplexData.text);
          const catalogItem = await this.createCatalogItemFromJson(json);
          if (isDefined(catalogItem)) {
            if (CatalogMemberMixin.isMixedInto(catalogItem))
              results.push(catalogItem);
            reportContent = "Chart " + output.Title + " generated.";
          }
        }

        reports.push(
          createStratumInstance(ShortReportTraits, {
            name: output.Title,
            content: reportContent
          })
        );
      })
    );

    // Create geojson catalog item for input features
    const geojsonFeatures = runInAction(() => this.geojsonFeatures);
    if (Array.isArray(geojsonFeatures) || isObservableArray(geojsonFeatures)) {
      runInAction(() => {
        this.geoJsonItem = new GeoJsonCatalogItem(createGuid(), this.terria);
        updateModelFromJson(this.geoJsonItem, CommonStrata.user, {
          name: `${this.name} Input Features`,
          // Use cesium primitives, so we don't have to deal with feature picking/selection
          forceCesiumPrimitives: true,
          geoJsonData: {
            type: "FeatureCollection",
            features: geojsonFeatures,
            totalFeatures: this.geojsonFeatures!.length
          }
        }).logError(
          "Error occurred while updating Input Features GeoJSON model JSON"
        );
      });
      (await this.geoJsonItem!.loadMapItems()).throwIfError();
    }

    runInAction(() => {
      this.setTrait(CommonStrata.user, "shortReportSections", reports);
    });

    return results;
  }

  @override
  get mapItems() {
    if (isDefined(this.geoJsonItem)) {
      return this.geoJsonItem.mapItems.map((mapItem) => {
        mapItem.show = this.show;
        return mapItem;
      });
    }
    return [];
  }

  protected async forceLoadMetadata() {
    await super.forceLoadMetadata();
    const stratum = await WpsLoadableStratum.load(this);
    runInAction(() => {
      this.strata.set(WpsLoadableStratum.stratumName, stratum);
    });
  }

  protected async forceLoadMapItems(): Promise<void> {
    if (isDefined(this.geoJsonItem)) {
      const geoJsonItem = this.geoJsonItem;
      (await geoJsonItem.loadMapItems()).throwIfError();
    }
  }

  /**
   * Returns all the process outputs skipping process contexts and empty outputs
   */
  @computed get outputs() {
    const wpsResponse = this.wpsResponse as any;
    if (
      !wpsResponse ||
      !wpsResponse.ProcessOutputs ||
      !wpsResponse.ProcessOutputs.Output
    ) {
      return [];
    }
    const obj = wpsResponse.ProcessOutputs.Output;
    const outputs = Array.isArray(obj) || isObservableArray(obj) ? obj : [obj];
    return outputs.filter(
      (o) => o.Identifier !== ".context" && isDefined(o.Data)
    );
  }

  private async createCatalogItemFromJson(json: any) {
    let itemJson = json;

    if (
      this.forceConvertResultsToV8 ||
      // If startData.version has version 0.x.x - user catalog-converter to convert result
      ("version" in itemJson &&
        typeof itemJson.version === "string" &&
        itemJson.version.startsWith("0"))
    ) {
      itemJson = await convertResultV7toV8(json).catch((e) => {
        throw e;
      });
    }

    const catalogItem = upsertModelFromJson(
      CatalogMemberFactory,
      this.terria,
      this.uniqueId || "",
      CommonStrata.user,
      {
        ...itemJson,
        id: createGuid()
      },
      {
        addModelToTerria: false
      }
    ).throwIfError({
      title: "WPS output error",
      message: `Failed to create Terria model from WPS output${
        itemJson.name ? `: ${itemJson.name}` : ""
      }`
    });
    return catalogItem;
  }
}

function formatOutputValue(title: string, value: string | undefined) {
  if (!isDefined(value)) {
    return "";
  }

  const values = value.split(",");

  return values.reduce(function (previousValue, currentValue) {
    if (value.match(/[./](png|jpg|jpeg|gif|svg)/i)) {
      return (
        previousValue +
        '<a href="' +
        currentValue +
        '"><img src="' +
        currentValue +
        '" alt="' +
        title +
        '" /></a>'
      );
    } else if (
      currentValue.indexOf("http:") === 0 ||
      currentValue.indexOf("https:") === 0
    ) {
      const uri = new URI(currentValue);
      return (
        previousValue +
        '<a href="' +
        currentValue +
        '">' +
        uri.filename() +
        "</a>"
      );
    } else {
      return previousValue + currentValue;
    }
  }, "");
}

async function convertResultV7toV8(
  input: JsonObject
): Promise<Record<string, unknown> | undefined> {
  const { convertMember, convertCatalog } = await import("catalog-converter");
  if (typeof input.type === "string") {
    const { member, messages } = convertMember(input);
    if (member === null)
      throw TerriaError.combine(
        messages.map((m) => TerriaError.from(m.message)),
        "Error converting v7 item to v8"
      );
    return member;
  } else {
    const { result, messages } = convertCatalog(input);
    if (result === null)
      throw TerriaError.combine(
        messages.map((m) => TerriaError.from(m.message)),
        "Error converting v7 catalog to v8"
      );
    return result;
  }
}

function htmlEscapeText(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
