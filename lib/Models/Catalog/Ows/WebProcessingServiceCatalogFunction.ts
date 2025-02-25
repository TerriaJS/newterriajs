import i18next from "i18next";
import flatten from "lodash-es/flatten";
import {
  action,
  computed,
  isObservableArray,
  runInAction,
  makeObservable,
  override
} from "mobx";
import URI from "urijs";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import isDefined from "../../../Core/isDefined";
import TerriaError, { networkRequestError } from "../../../Core/TerriaError";
import Reproject from "../../../Map/Vector/Reproject";
import CatalogFunctionMixin from "../../../ModelMixins/CatalogFunctionMixin";
import XmlRequestMixin from "../../../ModelMixins/XmlRequestMixin";
import xml2json from "../../../ThirdParty/xml2json";
import WebProcessingServiceCatalogFunctionTraits from "../../../Traits/TraitsClasses/WebProcessingServiceCatalogFunctionTraits";
import CommonStrata from "../../Definition/CommonStrata";
import CreateModel from "../../Definition/CreateModel";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel } from "../../Definition/Model";
import StratumOrder from "../../Definition/StratumOrder";
import updateModelFromJson from "../../Definition/updateModelFromJson";
import BooleanParameter from "../../FunctionParameters/BooleanParameter";
import DateParameter from "../../FunctionParameters/DateParameter";
import DateTimeParameter from "../../FunctionParameters/DateTimeParameter";
import EnumerationParameter from "../../FunctionParameters/EnumerationParameter";
import FunctionParameter, {
  Options as FunctionParameterOptions
} from "../../FunctionParameters/FunctionParameter";
import GeoJsonParameter, {
  isGeoJsonFunctionParameter
} from "../../FunctionParameters/GeoJsonParameter";
import LineParameter from "../../FunctionParameters/LineParameter";
import PointParameter from "../../FunctionParameters/PointParameter";
import PolygonParameter from "../../FunctionParameters/PolygonParameter";
import RectangleParameter from "../../FunctionParameters/RectangleParameter";
import RegionParameter from "../../FunctionParameters/RegionParameter";
import RegionTypeParameter from "../../FunctionParameters/RegionTypeParameter";
import StringParameter from "../../FunctionParameters/StringParameter";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import { ModelConstructorParameters } from "../../Definition/Model";

import WebProcessingServiceCatalogFunctionJob from "./WebProcessingServiceCatalogFunctionJob";
import NumberParameter from "../../FunctionParameters/NumberParameter";

type AllowedValues = {
  Value?: string | string[];
  Range?: Range;
};

type Range = {
  MaximumValue?: number;
  MinimumValue?: number;
};

type LiteralDataType = {
  "ows:reference"?: string;
  text?: string;
};
type LiteralData = {
  AllowedValues?: AllowedValues;
  AllowedValue?: AllowedValues;
  AnyValue?: unknown;
  DefaultValue?: unknown;
  DataType?: LiteralDataType | string;
  dataType?: string;
};

type ComplexData = {
  Default?: { Format?: { Schema?: string } };
};

type BoundingBoxData = {
  Default?: { CRS?: string };
  Supported?: { CRS?: string[] };
};

type Input = {
  Identifier?: string;
  Title?: string;
  Abstract?: string;
  LiteralData?: LiteralData;
  ComplexData?: ComplexData;
  BoundingBoxData?: BoundingBoxData;
  minOccurs?: number;
};

type ProcessDescription = {
  DataInputs?: { Input: Input[] | Input };
  storeSupported?: string;
  statusSupported?: string;
};

export type WpsInputData = {
  inputValue: Promise<string | undefined> | string | undefined;
  inputType: string;
};

type ParameterConverter = {
  inputToParameter: (
    catalogFunction: CatalogFunctionMixin.Instance,
    input: Input,
    options: FunctionParameterOptions
  ) => FunctionParameter | undefined;

  parameterToInput: (parameter: FunctionParameter) => WpsInputData | undefined;
};

class WpsLoadableStratum extends LoadableStratum(
  WebProcessingServiceCatalogFunctionTraits
) {
  static stratumName = "wpsLoadable";

  constructor(
    readonly item: WebProcessingServiceCatalogFunction,
    readonly processDescription: ProcessDescription
  ) {
    super();
    makeObservable(this);
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new WpsLoadableStratum(
      newModel as WebProcessingServiceCatalogFunction,
      this.processDescription
    ) as this;
  }

  @action
  static async load(item: WebProcessingServiceCatalogFunction) {
    if (!isDefined(item.describeProcessUrl)) {
      return;
    }

    const xml = await item.getXml(item.describeProcessUrl);
    if (
      !isDefined(xml) ||
      !isDefined(xml.documentElement) ||
      xml.documentElement.localName !== "ProcessDescriptions"
    ) {
      throwInvalidWpsServerError(item, "DescribeProcess");
    }

    const json = xml2json(xml);
    if (
      !json ||
      typeof json === "string" ||
      !isDefined(json.ProcessDescription)
    ) {
      throw networkRequestError({
        sender: this,
        title: i18next.t(
          "models.webProcessingService.processDescriptionErrorTitle"
        ),
        message: i18next.t(
          "models.webProcessingService.processDescriptionErrorMessage"
        )
      });
    }

    return new WpsLoadableStratum(item, json.ProcessDescription);
  }

  /**
   * Return the inputs in the processDescription
   */
  @computed get inputs(): Input[] {
    if (!isDefined(this.processDescription)) {
      return [];
    }

    const dataInputs = this.processDescription.DataInputs;
    if (!isDefined(dataInputs) || !isDefined(dataInputs.Input)) {
      throw networkRequestError({
        sender: this,
        title: i18next.t("models.webProcessingService.processInputErrorTitle"),
        message: i18next.t(
          "models.webProcessingService.processInputErrorMessage"
        )
      });
    }

    const inputs =
      Array.isArray(dataInputs.Input) || isObservableArray(dataInputs.Input)
        ? dataInputs.Input
        : [dataInputs.Input];
    return inputs;
  }

  get storeSupported() {
    const value = this.processDescription.storeSupported?.toLowerCase();
    return value === "true" ? true : value === "false" ? false : undefined;
  }

  get statusSupported() {
    const value = this.processDescription.statusSupported?.toLowerCase();
    return value === "true" ? true : value === "false" ? false : undefined;
  }
}

StratumOrder.addLoadStratum(WpsLoadableStratum.stratumName);

export default class WebProcessingServiceCatalogFunction extends XmlRequestMixin(
  CatalogFunctionMixin(CreateModel(WebProcessingServiceCatalogFunctionTraits))
) {
  static readonly type = "wps";

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get type() {
    return WebProcessingServiceCatalogFunction.type;
  }

  get typeName() {
    return "Web Processing Service (WPS)";
  }

  @override
  get cacheDuration(): string {
    if (isDefined(super.cacheDuration)) {
      return super.cacheDuration;
    }
    return "0d";
  }

  /**
   * Returns the proxied URL for the DescribeProcess endpoint.
   */
  @computed get describeProcessUrl() {
    if (!isDefined(this.url) || !isDefined(this.identifier)) {
      return;
    }

    const uri = new URI(this.url).query({
      service: "WPS",
      request: "DescribeProcess",
      version: "1.0.0",
      Identifier: this.identifier
    });

    return proxyCatalogItemUrl(this, uri.toString());
  }

  async forceLoadMetadata() {
    if (!this.strata.has(WpsLoadableStratum.stratumName)) {
      const stratum = await WpsLoadableStratum.load(this);
      if (isDefined(stratum)) {
        runInAction(() => {
          this.strata.set(WpsLoadableStratum.stratumName, stratum);
        });
      }
    }
  }

  /**
   *  Must be kept alive due to `subtype` observable property of GeoJsonFunctionParameter
   */
  @computed({
    keepAlive: true
  })
  get functionParameters() {
    const stratum = this.strata.get(
      WpsLoadableStratum.stratumName
    ) as WpsLoadableStratum;
    if (!isDefined(stratum)) return [];

    return stratum.inputs.map((input) => {
      const parameter = this.convertInputToParameter(this, input);
      if (isDefined(parameter)) {
        return parameter;
      }
      throw new TerriaError({
        sender: this,
        title: "Unsupported parameter type",
        message: `The parameter ${input.Identifier} is not a supported type of parameter.`
      });
    });
  }

  protected async createJob(id: string) {
    const job = new WebProcessingServiceCatalogFunctionJob(id, this.terria);

    const dataInputs = filterOutUndefined(
      await Promise.all(
        this.functionParameters
          .filter((p) => isDefined(p.value) && p.value !== null)
          .map((p) => this.convertParameterToInput(p))
      )
    );

    runInAction(() =>
      updateModelFromJson(job, CommonStrata.user, {
        name: `WPS: ${
          this.name || this.identifier || this.uniqueId
        } result ${new Date().toISOString()}`,
        geojsonFeatures: flatten(
          this.functionParameters
            .map((param) =>
              isGeoJsonFunctionParameter(param)
                ? param.geoJsonFeature
                : undefined
            )
            .filter(isDefined)
        ) as any,
        url: this.url,
        identifier: this.identifier,
        executeWithHttpGet: this.executeWithHttpGet,
        statusSupported: this.statusSupported,
        storeSupported: this.storeSupported,
        wpsParameters: dataInputs,
        forceConvertResultsToV8: this.forceConvertResultsToV8
      })
    ).raiseError(this.terria, "Error ocurred while updating job model JSON");

    return job;
  }

  convertInputToParameter(
    catalogFunction: CatalogFunctionMixin.Instance,
    input: Input
  ) {
    if (!isDefined(input.Identifier)) {
      return;
    }

    const isRequired = isDefined(input.minOccurs) && input.minOccurs > 0;

    for (let i = 0; i < parameterConverters.length; i++) {
      const converter = parameterConverters[i];
      const parameter = converter.inputToParameter(catalogFunction, input, {
        id: input.Identifier,
        name: input.Title,
        description: input.Abstract,
        isRequired
      });
      if (isDefined(parameter)) {
        return parameter;
      }
    }
  }

  async convertParameterToInput(parameter: FunctionParameter) {
    const converter = parameterTypeToConverter(parameter);

    const result = converter?.parameterToInput(parameter);
    if (!isDefined(result)) {
      return;
    }

    const inputValue = await Promise.resolve(result.inputValue);
    if (!isDefined(inputValue)) {
      return;
    }

    return {
      inputIdentifier: parameter.id,
      inputValue: inputValue,
      inputType: result.inputType
    };
  }
}

const LiteralDataConverter = {
  inputToParameter: function (
    catalogFunction: CatalogFunctionMixin.Instance,
    input: Input,
    options: FunctionParameterOptions
  ) {
    if (!isDefined(input.LiteralData)) {
      return;
    }

    const allowedValues =
      input.LiteralData.AllowedValues || input.LiteralData.AllowedValue;

    if (isDefined(allowedValues) && isDefined(allowedValues.Value)) {
      return new EnumerationParameter(catalogFunction, {
        ...options,
        options: (Array.isArray(allowedValues.Value) ||
        isObservableArray(allowedValues.Value)
          ? (allowedValues.Value as string[])
          : [allowedValues.Value]
        ).map((id) => {
          return { id };
        })
      });
    } else if (isDefined(allowedValues) && isDefined(allowedValues.Range)) {
      const np = new NumberParameter(catalogFunction, {
        ...options
      });

      np.minimum = isDefined(allowedValues.Range.MinimumValue)
        ? allowedValues.Range.MinimumValue
        : np.minimum;
      np.maximum = allowedValues.Range.MaximumValue;
      np.defaultValue = isDefined(input.LiteralData.DefaultValue)
        ? (input.LiteralData.DefaultValue as number)
        : np.minimum;

      return np;
    } else if (isDefined(input.LiteralData.AnyValue)) {
      let dtype: string | null = null;
      if (isDefined(input.LiteralData["dataType"])) {
        dtype = input.LiteralData["dataType"];
      } else if (isDefined(input.LiteralData.DataType)) {
        if (typeof input.LiteralData.DataType === "string") {
          dtype = input.LiteralData.DataType;
        } else if (isDefined(input.LiteralData.DataType["ows:reference"])) {
          dtype = input.LiteralData.DataType["ows:reference"];
        } else if (isDefined(input.LiteralData.DataType.text)) {
          dtype = input.LiteralData.DataType.text;
        }
      }
      if (dtype !== null) {
        if (dtype.indexOf("http://www.w3.org/TR/xmlschema-2/#") === 0) {
          dtype = dtype.substring(dtype.lastIndexOf("#") + 1).toLowerCase();
        }
      }

      if (dtype === "string") {
        return new StringParameter(catalogFunction, {
          ...options
        });
      } else if (dtype === "boolean") {
        return new BooleanParameter(catalogFunction, {
          ...options
        });
      } else if (dtype === "date") {
        const dt = new DateParameter(catalogFunction, {
          ...options,
          clock: catalogFunction.terria.timelineClock
        });
        dt.variant = "literal";
        return dt;
      } else if (dtype?.toLowerCase() === "datetime") {
        const dt = new DateTimeParameter(catalogFunction, {
          ...options,
          clock: catalogFunction.terria.timelineClock
        });
        dt.variant = "literal";
        return dt;
      }

      // Assume its a string, if no literal datatype given
      return new StringParameter(catalogFunction, {
        ...options
      });
    }
  },
  parameterToInput: function (parameter: FunctionParameter) {
    return {
      inputValue: parameter.value as string | undefined,
      inputType: "LiteralData"
    };
  }
};

const ComplexDateConverter = {
  inputToParameter: function (
    catalogFunction: CatalogFunctionMixin.Instance,
    input: Input,
    options: FunctionParameterOptions
  ) {
    if (
      !isDefined(input.ComplexData) ||
      !isDefined(input.ComplexData.Default) ||
      !isDefined(input.ComplexData.Default.Format) ||
      !isDefined(input.ComplexData.Default.Format.Schema)
    ) {
      return undefined;
    }

    const schema = input.ComplexData.Default.Format.Schema;
    if (schema !== "http://www.w3.org/TR/xmlschema-2/#date") {
      return undefined;
    }
    const dparam = new DateParameter(catalogFunction, {
      ...options,
      clock: catalogFunction.terria.timelineClock
    });
    dparam.variant = "complex";
    return dparam;
  },
  parameterToInput: function (parameter: FunctionParameter) {
    return {
      inputType: "ComplexData",
      inputValue: DateParameter.formatValueForUrl(
        parameter?.value?.toString() || ""
      )
    };
  }
};

const ComplexDateTimeConverter = {
  inputToParameter: function (
    catalogFunction: CatalogFunctionMixin.Instance,
    input: Input,
    options: FunctionParameterOptions
  ) {
    if (
      !isDefined(input.ComplexData) ||
      !isDefined(input.ComplexData.Default) ||
      !isDefined(input.ComplexData.Default.Format) ||
      !isDefined(input.ComplexData.Default.Format.Schema)
    ) {
      return undefined;
    }

    const schema = input.ComplexData.Default.Format.Schema;
    if (schema !== "http://www.w3.org/TR/xmlschema-2/#dateTime") {
      return undefined;
    }
    const dt = new DateTimeParameter(catalogFunction, {
      ...options,
      clock: catalogFunction.terria.timelineClock
    });
    dt.variant = "complex";
    return dt;
  },
  parameterToInput: function (parameter: FunctionParameter) {
    return {
      inputType: "ComplexData",
      inputValue: DateTimeParameter.formatValueForUrl(
        parameter?.value?.toString() || ""
      )
    };
  }
};

export const PointConverter = simpleGeoJsonDataConverter(
  "point",
  PointParameter
);
const LineConverter = simpleGeoJsonDataConverter("linestring", LineParameter);
const PolygonConverter = simpleGeoJsonDataConverter(
  "polygon",
  PolygonParameter
);

const RectangleConverter = {
  inputToParameter: function (
    catalogFunction: CatalogFunctionMixin.Instance,
    input: Input,
    options: FunctionParameterOptions
  ) {
    if (
      !isDefined(input.BoundingBoxData) ||
      !isDefined(input.BoundingBoxData.Default) ||
      !isDefined(input.BoundingBoxData.Default.CRS)
    ) {
      return undefined;
    }
    let code = Reproject.crsStringToCode(input.BoundingBoxData.Default.CRS);
    let usedCrs = input.BoundingBoxData.Default.CRS;
    // Find out if Terria's CRS is supported.
    if (
      code !== Reproject.TERRIA_CRS &&
      isDefined(input.BoundingBoxData.Supported) &&
      isDefined(input.BoundingBoxData.Supported.CRS)
    ) {
      for (let i = 0; i < input.BoundingBoxData.Supported.CRS.length; i++) {
        if (
          Reproject.crsStringToCode(input.BoundingBoxData.Supported.CRS[i]) ===
          Reproject.TERRIA_CRS
        ) {
          code = Reproject.TERRIA_CRS;
          usedCrs = input.BoundingBoxData.Supported.CRS[i];
          break;
        }
      }
    }
    // We are currently only supporting Terria's CRS, because if we reproject we don't know the URI or whether
    // the bounding box order is lat-long or long-lat.
    if (!isDefined(code)) {
      return undefined;
    }

    return new RectangleParameter(catalogFunction, {
      ...options,
      crs: usedCrs
    });
  },
  parameterToInput: function (functionParameter: FunctionParameter) {
    const parameter = functionParameter as RectangleParameter;
    const value = parameter.value;
    if (!isDefined(value)) {
      return;
    }

    let bboxMinCoord1, bboxMinCoord2, bboxMaxCoord1, bboxMaxCoord2, urn;
    // We only support CRS84 and EPSG:4326
    if (parameter.crs.indexOf("crs84") !== -1) {
      // CRS84 uses long, lat rather that lat, long order.
      bboxMinCoord1 = value.west;
      bboxMinCoord2 = value.south;
      bboxMaxCoord1 = value.east;
      bboxMaxCoord2 = value.north;
      // Comfortingly known as WGS 84 longitude-latitude according to Table 3 in OGC 07-092r1.
      urn = "urn:ogc:def:crs:OGC:1.3:CRS84";
    } else {
      // The URN value urn:ogc:def:crs:EPSG:6.6:4326 shall mean the Coordinate Reference System (CRS) with code
      // 4326 specified in version 6.6 of the EPSG database available at http://www.epsg.org/. That CRS specifies
      // the axis order as Latitude followed by Longitude.
      // We don't know about other URN versions, so are going to return 6.6 regardless of what was requested.
      bboxMinCoord1 = value.south;
      bboxMinCoord2 = value.west;
      bboxMaxCoord1 = value.north;
      bboxMaxCoord2 = value.east;
      urn = "urn:ogc:def:crs:EPSG:6.6:4326";
    }

    return {
      inputType: "BoundingBoxData",
      inputValue:
        bboxMinCoord1 +
        "," +
        bboxMinCoord2 +
        "," +
        bboxMaxCoord1 +
        "," +
        bboxMaxCoord2 +
        "," +
        urn
    };
  }
};

const GeoJsonGeometryConverter = {
  inputToParameter: function (
    catalogFunction: CatalogFunctionMixin.Instance,
    input: Input,
    options: FunctionParameterOptions
  ) {
    if (
      !isDefined(input.ComplexData) ||
      !isDefined(input.ComplexData.Default) ||
      !isDefined(input.ComplexData.Default.Format) ||
      !isDefined(input.ComplexData.Default.Format.Schema)
    ) {
      return;
    }

    const schema = input.ComplexData.Default.Format.Schema;
    if (schema.indexOf("http://geojson.org/geojson-spec.html#") !== 0) {
      return undefined;
    }

    const regionTypeParameter = new RegionTypeParameter(catalogFunction, {
      id: "regionType",
      name: "Region Type",
      description: "The type of region to analyze."
    });

    const regionParameter = new RegionParameter(catalogFunction, {
      id: "regionParameter",
      name: "Region Parameter",
      regionProvider: regionTypeParameter
    });

    return new GeoJsonParameter(catalogFunction, {
      ...options,
      regionParameter
    });
  },

  parameterToInput: function (
    parameter: FunctionParameter
  ): WpsInputData | undefined {
    if (!isDefined(parameter.value) || parameter.value === null) {
      return;
    }
    return (parameter as GeoJsonParameter).getProcessedValue(
      (parameter as GeoJsonParameter).value!
    );
  }
};

function simpleGeoJsonDataConverter(schemaType: string, klass: any) {
  return {
    inputToParameter: function (
      catalogFunction: CatalogFunctionMixin.Instance,
      input: Input,
      options: FunctionParameterOptions
    ) {
      if (
        !isDefined(input.ComplexData) ||
        !isDefined(input.ComplexData.Default) ||
        !isDefined(input.ComplexData.Default.Format) ||
        !isDefined(input.ComplexData.Default.Format.Schema)
      ) {
        return undefined;
      }

      const schema = input.ComplexData.Default.Format.Schema;
      if (schema.indexOf("http://geojson.org/geojson-spec.html#") !== 0) {
        return undefined;
      }

      if (schema.substring(schema.lastIndexOf("#") + 1) !== schemaType) {
        return undefined;
      }

      return new klass(catalogFunction, options);
    },
    parameterToInput: function (parameter: FunctionParameter) {
      return {
        inputType: "ComplexData",
        inputValue: klass.formatValueForUrl(parameter.value)
      };
    }
  };
}

function parameterTypeToConverter(
  parameter: FunctionParameter
): ParameterConverter | undefined {
  switch (parameter.type) {
    case BooleanParameter.type:
    case StringParameter.type:
    case EnumerationParameter.type:
      return LiteralDataConverter;
    case DateParameter.type:
      return (parameter as DateParameter).variant === "literal"
        ? LiteralDataConverter
        : ComplexDateConverter;
    case DateTimeParameter.type:
      return (parameter as DateTimeParameter).variant === "literal"
        ? LiteralDataConverter
        : ComplexDateTimeConverter;
    case PointParameter.type:
      return PointConverter;
    case LineParameter.type:
      return LineConverter;
    case PolygonParameter.type:
      return PolygonConverter;
    case RectangleParameter.type:
      return RectangleConverter;
    case GeoJsonParameter.type:
      return GeoJsonGeometryConverter;
    default:
      break;
  }
}

const parameterConverters: ParameterConverter[] = [
  LiteralDataConverter,
  ComplexDateConverter,
  ComplexDateTimeConverter,
  PointConverter,
  LineConverter,
  PolygonConverter,
  RectangleConverter,
  GeoJsonGeometryConverter
];

function throwInvalidWpsServerError(
  wps: WebProcessingServiceCatalogFunction,
  endpoint: string
) {
  throw networkRequestError({
    title: i18next.t("models.webProcessingService.invalidWPSServerTitle"),
    message: i18next.t("models.webProcessingService.invalidWPSServerMessage", {
      name: wps.name,
      endpoint
    })
  });
}
