import i18next from "i18next";
import { action, computed, makeObservable, override, runInAction } from "mobx";
import Mustache from "mustache";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import isDefined from "../../../Core/isDefined";
import loadWithXhr from "../../../Core/loadWithXhr";
import TerriaError from "../../../Core/TerriaError";
import TableMixin from "../../../ModelMixins/TableMixin";
import TableAutomaticStylesStratum from "../../../Table/TableAutomaticStylesStratum";
import TableColumnType from "../../../Table/TableColumnType";
import xml2json from "../../../ThirdParty/xml2json";
import SensorObservationServiceCatalogItemTraits from "../../../Traits/TraitsClasses/SensorObservationCatalogItemTraits";
import TableChartStyleTraits, {
  TableChartLineStyleTraits
} from "../../../Traits/TraitsClasses/Table/ChartStyleTraits";
import TablePointSizeStyleTraits from "../../../Traits/TraitsClasses/Table/PointSizeStyleTraits";
import TableStyleTraits from "../../../Traits/TraitsClasses/Table/StyleTraits";
import CommonStrata from "../../Definition/CommonStrata";
import CreateModel from "../../Definition/CreateModel";
import createStratumInstance from "../../Definition/createStratumInstance";
import { BaseModel } from "../../Definition/Model";
import StratumFromTraits from "../../Definition/StratumFromTraits";
import StratumOrder from "../../Definition/StratumOrder";
import { SelectableDimension } from "../../SelectableDimensions/SelectableDimensions";
import Terria from "../../Terria";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

interface GetFeatureOfInterestResponse {
  featureMember?: FeatureMember[] | FeatureMember;
}

interface GetObservationResponse {
  observationData?: ObservationData | ObservationData[];
}

interface FeatureMember {
  MonitoringPoint?: {
    shape?: { Point?: { pos?: string } };
    identifier?: string;
    name?: string;
    type?: { ["xlink:href"]: string | undefined };
    ["gml:id"]: string | undefined;
  };
}

interface TemplateContext {
  action: string;
  actionClass: string;
  parameters: NameValue[];
}

interface NameValue {
  name: string;
  value: string;
}

interface ObservationData {
  OM_Observation?: Observation;
}

interface Observation {
  result?: {
    MeasurementTimeseries?: { point?: ObservationPoint | ObservationPoint[] };
  };
  featureOfInterest: { [attr: string]: string | undefined };
}

interface ObservationPoint {
  MeasurementTVP: MeasurementTimeValuePair;
}

interface MeasurementTimeValuePair {
  time: object | string;
  value: object | string;
}

StratumOrder.addLoadStratum(TableAutomaticStylesStratum.stratumName);

class SosAutomaticStylesStratum extends TableAutomaticStylesStratum {
  constructor(readonly catalogItem: SensorObservationServiceCatalogItem) {
    super(catalogItem);
    makeObservable(this);
  }

  duplicateLoadableStratum(
    newModel: SensorObservationServiceCatalogItem
  ): this {
    return new SosAutomaticStylesStratum(newModel) as this;
  }

  @override
  get activeStyle() {
    return this.catalogItem.procedures[0]?.identifier;
  }

  @override
  get styles(): StratumFromTraits<TableStyleTraits>[] {
    return this.catalogItem.procedures.map((p) => {
      return createStratumInstance(TableStyleTraits, {
        id: p.identifier,
        title: p.title,
        pointSize: createStratumInstance(TablePointSizeStyleTraits, {
          pointSizeColumn: p.identifier
        }),
        // table style is hidden by default when the table uses only 1 color (https://github.com/TerriaJS/terriajs/blob/bbe8a11ae9bf6c0eb78c52d7b5c9b260d5ddc8cf/lib/Table/TableStyle.ts#L82)
        // force hidden to false so that the frequency and procedure selector will always be shown
        // Ideally we should rewrite frequency & procedure selector using selectable dimensions and stop using styles to display them.
        hidden: false
      });
    });
  }

  @override
  get defaultChartStyle() {
    const timeColumn = this.catalogItem.tableColumns.find(
      (column) => column.type === TableColumnType.time
    );

    const valueColumn = this.catalogItem.tableColumns.find(
      (column) => column.type === TableColumnType.scalar
    );

    if (timeColumn && valueColumn) {
      return createStratumInstance(TableStyleTraits, {
        chart: createStratumInstance(TableChartStyleTraits, {
          xAxisColumn: timeColumn.name,
          lines: [
            createStratumInstance(TableChartLineStyleTraits, {
              yAxisColumn: valueColumn.name
            })
          ]
        })
      });
    }
  }
}

class GetFeatureOfInterestRequest {
  constructor(
    readonly catalogItem: SensorObservationServiceCatalogItem,
    readonly requestTemplate: string
  ) {
    makeObservable(this);
  }

  @computed
  get url() {
    return this.catalogItem.url;
  }

  @computed
  get observedProperties() {
    return filterOutUndefined(
      this.catalogItem.observableProperties.map((p) => p.identifier)
    );
  }

  @computed
  get procedures() {
    if (this.catalogItem.filterByProcedures) {
      return filterOutUndefined(
        this.catalogItem.procedures.map((p) => p.identifier)
      );
    }
  }

  async perform(): Promise<GetFeatureOfInterestResponse | undefined> {
    if (this.url === undefined) {
      return;
    }

    const templateContext = {
      action: "GetFeatureOfInterest",
      actionClass: "foiRetrieval",
      parameters: convertObjectToNameValueArray({
        observedProperty: this.observedProperties,
        procedure: this.procedures
      })
    };

    const response = await loadSoapBody(
      this.catalogItem,
      this.url,
      this.requestTemplate,
      templateContext
    );

    return response?.GetFeatureOfInterestResponse;
  }
}

class GetObservationRequest {
  constructor(
    readonly catalogItem: SensorObservationServiceCatalogItem,
    readonly foiIdentifier: string
  ) {
    makeObservable(this);
  }

  @computed
  get url() {
    return this.catalogItem.url;
  }

  @computed
  get requestTemplate() {
    return (
      this.catalogItem.requestTemplate ||
      SensorObservationServiceCatalogItem.defaultRequestTemplate
    );
  }

  @computed
  get parameters() {
    const foiIdentifier = this.catalogItem.chartFeatureOfInterestIdentifier;
    const observableProperty = this.catalogItem.selectedObservable;
    const procedure = this.catalogItem.selectedProcedure;
    if (
      foiIdentifier === undefined ||
      procedure === undefined ||
      observableProperty === undefined
    ) {
      return;
    }

    return convertObjectToNameValueArray({
      procedure: procedure.identifier,
      observedProperty: observableProperty.identifier,
      featureOfInterest: foiIdentifier
    });
  }

  /**
   * Return the Mustache template context "temporalFilters" for this item.
   * If a "defaultDuration" parameter (eg. 60d or 12h) exists on either
   * procedure or observableProperty, restrict to that duration from item.endDate.
   * @param item This catalog item.
   * @param procedure An element from the item.procedures array.
   * @param observableProperty An element from the item.observableProperties array.
   * @return An array of {index, startDate, endDate}, or undefined.
   */
  @computed
  get temporalFilters() {
    const observableProperty = this.catalogItem.selectedObservable;
    const procedure = this.catalogItem.selectedProcedure;
    if (procedure === undefined || observableProperty === undefined) {
      return;
    }

    const defaultDuration =
      procedure.defaultDuration || observableProperty.defaultDuration;

    // If the item has no endDate, use the current datetime (to nearest second).
    const endDateIso8601 =
      this.catalogItem.endDate || JulianDate.toIso8601(JulianDate.now(), 0);
    if (defaultDuration) {
      let startDateIso8601 = addDurationToIso8601(
        endDateIso8601,
        "-" + defaultDuration
      );
      // This is just a string-based comparison, so timezones could make it up to 1 day wrong.
      // That much error is fine here.
      if (
        this.catalogItem.startDate &&
        startDateIso8601 < this.catalogItem.startDate
      ) {
        startDateIso8601 = this.catalogItem.startDate;
      }
      return [
        { index: 1, startDate: startDateIso8601, endDate: endDateIso8601 }
      ];
    } else {
      // If there is no procedure- or property-specific duration, use the item's start and end dates, if any.
      if (this.catalogItem.startDate) {
        return [
          {
            index: 1,
            startDate: this.catalogItem.startDate,
            endDate: endDateIso8601
          }
        ];
      }
    }
  }

  async perform(): Promise<GetObservationResponse | undefined> {
    if (this.url === undefined || this.parameters === undefined) {
      return;
    }

    const templateContext = {
      action: "GetObservation",
      actionClass: "core",
      parameters: this.parameters,
      temporalFilters: this.temporalFilters
    };

    const response = await loadSoapBody(
      this.catalogItem,
      this.url,
      this.requestTemplate,
      templateContext
    );

    return response?.GetObservationResponse;
  }
}

export default class SensorObservationServiceCatalogItem extends TableMixin(
  CreateModel(SensorObservationServiceCatalogItemTraits)
) {
  static readonly type = "sos";
  static defaultRequestTemplate = require("./SensorObservationServiceRequestTemplate.xml");

  constructor(
    id: string | undefined,
    terria: Terria,
    sourceReference?: BaseModel
  ) {
    super(id, terria, sourceReference);
    makeObservable(this);
    this.strata.set(
      TableAutomaticStylesStratum.stratumName,
      new SosAutomaticStylesStratum(this)
    );
  }

  get type() {
    return "sos";
  }

  protected async forceLoadMetadata() {}

  @action
  protected async forceLoadTableData() {
    if (this.showAsChart === true) {
      return this.loadChartData();
    } else {
      return this.loadFeaturesData();
    }
  }

  @override
  get cacheDuration(): string {
    if (isDefined(super.cacheDuration)) {
      return super.cacheDuration;
    }
    return "0d";
  }

  @action
  private async loadFeaturesData() {
    const request = new GetFeatureOfInterestRequest(
      this,
      this.requestTemplate ||
        SensorObservationServiceCatalogItem.defaultRequestTemplate
    );
    const response = await request.perform();
    if (response === undefined) {
      return [];
    }

    const itemName = runInAction(() => this.name || "");
    if (response.featureMember === undefined) {
      throw new TerriaError({
        sender: this,
        title: itemName,
        message: i18next.t("models.sensorObservationService.unknownFormat")
      });
    }

    let featureMembers = Array.isArray(response.featureMember)
      ? response.featureMember
      : [response.featureMember];

    const whiteList = runInAction(() => this.stationIdWhitelist);
    if (whiteList) {
      featureMembers = featureMembers.filter(
        (m) =>
          m.MonitoringPoint?.identifier &&
          whiteList.indexOf(String(m.MonitoringPoint.identifier)) >= 0
      );
    }

    const blackList = runInAction(() => this.stationIdBlacklist);
    if (blackList) {
      featureMembers = featureMembers.filter(
        (m) =>
          m.MonitoringPoint &&
          blackList.indexOf(String(m.MonitoringPoint.identifier)) < 0
      );
    }

    const identifierCols = ["identifier"];
    const latCols = ["lat"];
    const lonCols = ["lon"];
    const nameCols = ["name"];
    const idCols = ["id"];
    const typeCols = ["type"];
    const chartCols = ["chart"];

    featureMembers.forEach((member) => {
      const pointShape = member.MonitoringPoint?.shape?.Point;
      if (!pointShape) {
        throw new DeveloperError(
          "Non-point feature not shown. You may want to implement `representAsGeoJson`. " +
            JSON.stringify(pointShape)
        );
      }

      if (!member.MonitoringPoint) return;
      if (!pointShape.pos?.split) return;
      if (!member.MonitoringPoint.identifier) return;

      const [lat, lon] = pointShape.pos.split(" ");
      const identifier = member.MonitoringPoint.identifier;
      const name = member.MonitoringPoint.name;
      const id = member.MonitoringPoint["gml:id"];
      const type = member.MonitoringPoint.type?.["xlink:href"];
      const chart = createChartColumn(identifier, name);

      identifierCols.push(identifier);
      latCols.push(lat);
      lonCols.push(lon);
      nameCols.push(name || "");
      idCols.push(id || "");
      typeCols.push(type || "");
      chartCols.push(chart);
    });

    return [
      identifierCols,
      latCols,
      lonCols,
      nameCols,
      idCols,
      typeCols,
      chartCols
    ];
  }

  @action
  private async loadChartData() {
    const foiIdentifier = this.chartFeatureOfInterestIdentifier;
    if (foiIdentifier === undefined) {
      return [];
    }

    const request = new GetObservationRequest(this, foiIdentifier);
    const response = await request.perform();
    if (response === undefined) {
      return [];
    }

    return runInAction(() => {
      const procedure = this.selectedProcedure!;
      const observableProperty = this.selectedObservable!;
      const datesCol = ["date"];
      const valuesCol = ["values"];
      const observationsCol = ["observations"];
      const identifiersCol = ["identifiers"];
      const proceduresCol = [this.proceduresName];
      const observedPropertiesCol = [this.observablePropertiesName];

      const addObservationToColumns = (observation: Observation) => {
        let points = observation?.result?.MeasurementTimeseries?.point;
        if (!points) return;
        if (!Array.isArray(points)) points = [points];

        const measurements = points.map((point) => point.MeasurementTVP); // TVP = Time value pairs, I think.
        const featureIdentifier =
          observation.featureOfInterest["xlink:href"] || "";
        datesCol.push(
          ...measurements.map((measurement) =>
            typeof measurement.time === "object" ? "" : measurement.time
          )
        );
        valuesCol.push(
          ...measurements.map((measurement) =>
            typeof measurement.value === "object" ? "" : measurement.value
          )
        );
        identifiersCol.push(...measurements.map((_) => featureIdentifier));
        proceduresCol.push(
          ...measurements.map((_) => procedure.identifier || "")
        );
        observedPropertiesCol.push(
          ...measurements.map((_) => observableProperty.identifier || "")
        );
      };

      const observationData =
        response.observationData === undefined ||
        Array.isArray(response.observationData)
          ? response.observationData
          : [response.observationData];
      if (!observationData) {
        return [];
      }

      const observations = observationData.map((o) => o.OM_Observation);
      observations.forEach((observation) => {
        if (observation) {
          addObservationToColumns(observation);
        }
      });

      runInAction(() => {
        // Set title for values column
        const valueColumn = this.addObject(
          CommonStrata.defaults,
          "columns",
          "values"
        );
        valueColumn?.setTrait(CommonStrata.defaults, "name", "values");
        valueColumn?.setTrait(CommonStrata.defaults, "title", this.valueTitle);
      });

      return [
        datesCol,
        valuesCol,
        observationsCol,
        identifiersCol,
        proceduresCol,
        observedPropertiesCol
      ];
    });
  }

  @computed
  get valueTitle() {
    if (
      this.selectedObservable === undefined ||
      this.selectedProcedure === undefined
    ) {
      return;
    }

    const units = this.selectedObservable.units || this.selectedProcedure.units;
    const valueTitle =
      this.selectedObservable.title +
      " " +
      this.selectedProcedure.title +
      (units !== undefined ? " (" + units + ")" : "");
    return valueTitle;
  }

  @override
  get selectableDimensions() {
    return filterOutUndefined([
      // Filter out proceduresSelector - as it duplicates TableMixin.styleDimensions
      ...super.selectableDimensions.filter(
        (dim) => dim.id !== this.proceduresSelector?.id
      ),
      this.proceduresSelector,
      this.observablesSelector
    ]);
  }

  @computed
  get proceduresSelector(): SelectableDimension | undefined {
    const proceduresSelector = super.styleDimensions;
    if (proceduresSelector === undefined) return;

    const item = this;
    return {
      ...proceduresSelector,
      get name(): string {
        return item.proceduresName;
      }
    };
  }

  @computed
  get observablesSelector(): SelectableDimension | undefined {
    if (this.mapItems.length === 0) {
      return;
    }
    const item = this;
    return {
      get id(): string {
        return "observables";
      },
      get name(): string {
        return item.observablePropertiesName;
      },
      get options() {
        return filterOutUndefined(
          item.observableProperties.map((p) => {
            if (p.identifier && p.title) {
              return {
                id: p.identifier,
                name: p.title || p.identifier
              };
            }
          })
        );
      },
      get selectedId(): string | undefined {
        return item.selectedObservableId;
      },
      setDimensionValue(stratumId: string, observableId: string | undefined) {
        item.setTrait(stratumId, "selectedObservableId", observableId);
      }
    };
  }

  @override
  get selectedObservableId() {
    return (
      super.selectedObservableId || this.observableProperties[0]?.identifier
    );
  }

  @computed
  get selectedObservable() {
    return this.observableProperties.find(
      (p) => p.identifier === this.selectedObservableId
    );
  }

  @computed
  get selectedProcedure() {
    return this.procedures.find(
      (p) => p.identifier === this.activeTableStyle.id
    );
  }
}

function createChartColumn(
  identifier: string,
  name: string | undefined
): string {
  const nameAttr = name === undefined ? "" : `name="${name}"`;
  // The API that provides the chart data is a SOAP API, and the download button is essentially just a link, so when you click it you get an error page.
  // can-download="false" will disable this broken download button.
  return `<sos-chart identifier="${identifier}" ${nameAttr} can-download="false"></sos-chart>`;
}

async function loadSoapBody(
  item: SensorObservationServiceCatalogItem,
  url: string,
  requestTemplate: string,
  templateContext: TemplateContext
): Promise<any> {
  const requestXml = Mustache.render(requestTemplate, templateContext);

  const responseXml = await loadWithXhr({
    url: proxyCatalogItemUrl(item, url),
    responseType: "document",
    method: "POST",
    overrideMimeType: "text/xml",
    data: requestXml,
    headers: { "Content-Type": "application/soap+xml" }
  });

  if (responseXml === undefined) {
    return;
  }

  const json = xml2json(responseXml);
  if (!json || typeof json === "string" || json.Exception) {
    let errorMessage = i18next.t(
      "models.sensorObservationService.unknownError"
    );
    if (json && typeof json !== "string" && json.Exception?.ExceptionText) {
      errorMessage = i18next.t(
        "models.sensorObservationService.exceptionMessage",
        { exceptionText: json.Exception.ExceptionText }
      );
    }
    throw new TerriaError({
      sender: item,
      title: runInAction(() => item.name || ""),
      message: errorMessage
    });
  }
  if (json.Body === undefined) {
    throw new TerriaError({
      sender: item,
      title: runInAction(() => item.name || ""),
      message: i18next.t("models.sensorObservationService.missingBody")
    });
  }
  return json.Body;
}

/**
 * Adds a period to an iso8601-formatted date.
 * Periods must be (positive or negative) numbers followed by a letter:
 * s (seconds), h (hours), d (days), y (years).
 * To avoid confusion between minutes and months, do not use m.
 * @param  dateIso8601 The date in ISO8601 format.
 * @param  durationString The duration string, in the format described.
 * @return A date string in ISO8601 format.
 */
function addDurationToIso8601(
  dateIso8601: string,
  durationString: string
): string {
  const duration = parseFloat(durationString);
  if (isNaN(duration) || duration === 0) {
    throw new DeveloperError("Bad duration " + durationString);
  }

  const scratchJulianDate = new JulianDate();
  let julianDate = JulianDate.fromIso8601(dateIso8601);
  const units = durationString.slice(durationString.length - 1);

  switch (units) {
    case "s":
      julianDate = JulianDate.addSeconds(
        julianDate,
        duration,
        scratchJulianDate
      );
      break;
    case "h":
      julianDate = JulianDate.addHours(julianDate, duration, scratchJulianDate);
      break;
    case "d":
      // Use addHours on 24 * numdays - on my casual reading of addDays, it needs an integer.
      julianDate = JulianDate.addHours(
        julianDate,
        duration * 24,
        scratchJulianDate
      );
      break;
    case "y": {
      const days = Math.round(duration * 365);
      julianDate = JulianDate.addDays(julianDate, days, scratchJulianDate);
      break;
    }
    default:
      throw new DeveloperError(
        'Unknown duration type "' + durationString + '" (use s, h, d or y)'
      );
  }

  return JulianDate.toIso8601(julianDate);
}

/**
 * Converts parameters {x: 'y'} into an array of {name: 'x', value: 'y'} objects.
 * Converts {x: [1, 2, ...]} into multiple objects:
 *   {name: 'x', value: 1}, {name: 'x', value: 2}, ...
 * @param parameters eg. {a: 3, b: [6, 8]}
 * @return eg. [{name: 'a', value: 3}, {name: 'b', value: 6}, {name: 'b', value: 8}]
 */
function convertObjectToNameValueArray(parameters: any): NameValue[] {
  return Object.keys(parameters).reduce((result, key) => {
    let values = parameters[key];
    if (!Array.isArray(values)) {
      values = [values];
    }
    if (values.length === 0) return result;
    return result.concat(
      filterOutUndefined(
        values.map((value: string | undefined) => {
          return value === undefined
            ? undefined
            : {
                name: key,
                value: value
              };
        })
      )
    );
  }, []);
}
