import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import objectTrait from "../Decorators/objectTrait";
import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import ModelTraits from "../ModelTraits";
import { traitClass } from "../Trait";
import CatalogMemberTraits from "./CatalogMemberTraits";
import DiffableTraits from "./DiffableTraits";
import ExportWebCoverageServiceTraits from "./ExportWebCoverageServiceTraits";
import GetCapabilitiesTraits from "./GetCapabilitiesTraits";
import ImageryProviderTraits from "./ImageryProviderTraits";
import LayerOrderingTraits from "./LayerOrderingTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import LegendTraits from "./LegendTraits";
import MappableTraits from "./MappableTraits";
import { MinMaxLevelTraits } from "./MinMaxLevelTraits";
import UrlTraits from "./UrlTraits";

export const SUPPORTED_CRS_3857 = ["EPSG:3857", "EPSG:900913"];
export const SUPPORTED_CRS_4326 = ["EPSG:4326", "CRS:84", "EPSG:4283"];

export class WebMapServiceAvailableStyleTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Style Name",
    description: "The name of the style."
  })
  name?: string;

  @primitiveTrait({
    type: "string",
    name: "Title",
    description: "The title of the style."
  })
  title?: string;

  @primitiveTrait({
    type: "string",
    name: "Abstract",
    description: "The abstract describing the style."
  })
  abstract?: string;

  @objectTrait({
    type: LegendTraits,
    name: "Style Name",
    description: "The name of the style."
  })
  legend?: LegendTraits;
}

export class WebMapServiceAvailableLayerStylesTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Layer Name",
    description: "The name of the layer for which styles are available."
  })
  layerName?: string;

  @objectArrayTrait({
    type: WebMapServiceAvailableStyleTraits,
    name: "Styles",
    description: "The styles available for this layer.",
    idProperty: "name"
  })
  styles?: WebMapServiceAvailableStyleTraits[];
}

export class WebMapServiceAvailablePaletteTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Style Name",
    description: "The name of the style."
  })
  name: string = "default";

  @primitiveTrait({
    type: "string",
    name: "Title",
    description: "The title of the style."
  })
  title: string = "default";

  @primitiveTrait({
    type: "string",
    name: "Abstract",
    description: "The abstract describing the style."
  })
  abstract: string = "default";
}

export class WebMapServiceAvailableDimensionTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Dimension Name",
    description: "The name of the dimension."
  })
  name?: string;

  @primitiveArrayTrait({
    type: "string",
    name: "Dimension values",
    description: "Possible dimension values."
  })
  values?: string[];

  @primitiveTrait({
    type: "string",
    name: "Units",
    description: "The units of the dimension."
  })
  units?: string;

  @primitiveTrait({
    type: "string",
    name: "Unit Symbol",
    description: "The unitSymbol of the dimension."
  })
  unitSymbol?: string;

  @primitiveTrait({
    type: "string",
    name: "Default",
    description: "The default value for the dimension."
  })
  default?: string;

  @primitiveTrait({
    type: "boolean",
    name: "Multiple Values",
    description: "Can the dimension support multiple values."
  })
  multipleValues?: boolean;

  @primitiveTrait({
    type: "boolean",
    name: "Nearest Value",
    description: "The nearest value of the dimension."
  })
  nearestValue?: boolean;
}

export class WebMapServiceAvailableLayerDimensionsTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Layer Name",
    description: "The name of the layer for which dimensions are available."
  })
  layerName?: string;

  @objectArrayTrait({
    type: WebMapServiceAvailableDimensionTraits,
    name: "Dimensions",
    description: "The dimensions available for this layer.",
    idProperty: "name"
  })
  dimensions?: WebMapServiceAvailableDimensionTraits[];
}
export class GetFeatureInfoFormat extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Type",
    description:
      "The type of response to expect from a GetFeatureInfo request.  Valid values are 'json', 'xml', 'html', 'text' or 'csv'. If type is 'csv', then featureInfoContext will contain timeSeries object (see \"Customizing the Feature Info Template\" in documentation)"
  })
  type?: "json" | "xml" | "html" | "text" | "csv" | undefined;

  @primitiveTrait({
    type: "string",
    name: "Format",
    description:
      "The info format to request from the WMS server.  This is usually a MIME type such as 'application/json' or text/xml'.  If this parameter is not specified, the provider will request 'json' using 'application/json', 'xml' using 'text/xml', 'html' using 'text/html', and 'text' using 'text/plain'."
  })
  format?: string;
}

@traitClass({
  description: `Creates a single item in the catalog from one or many WMS layers.

<strong>Note:</strong> <i>To present all layers in an available WMS as individual items in the catalog use the \`WebMapServiceCatalogGroup\`.</i>`,
  example: {
    type: "wms",
    name: "Mangrove Cover",
    url: "https://ows.services.dea.ga.gov.au",
    layers: "mangrove_cover_v2_0_2"
  }
})
export default class WebMapServiceCatalogItemTraits extends mixTraits(
  ExportWebCoverageServiceTraits,
  DiffableTraits,
  LayerOrderingTraits,
  GetCapabilitiesTraits,
  ImageryProviderTraits,
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits,
  LegendOwnerTraits,
  MinMaxLevelTraits
) {
  @primitiveTrait({
    type: "string",
    name: "Layer(s)",
    description: "The layer or layers to display (comma separated values)."
  })
  layers?: string;

  @primitiveTrait({
    type: "string",
    name: "Style(s)",
    description:
      "The styles to use with each of the `Layer(s)` (comma separated values). This maps one-to-one with `Layer(s)`"
  })
  styles?: string;

  @primitiveTrait({
    type: "string",
    name: "Style(s)",
    description: `CRS to use with WMS layers. We support Web Mercator (${SUPPORTED_CRS_3857.join(
      ", "
    )}) and WGS 84 (${SUPPORTED_CRS_4326.join(", ")})`
  })
  crs?: string;

  @anyTrait({
    name: "Dimensions",
    description:
      "Dimension parameters used to request a particular layer along one or more dimensional axes (including elevation, excluding time). Do not include `_dim` prefx for parameter keys. These dimensions will be applied to all layers (if applicable)"
  })
  dimensions?: { [key: string]: string };

  @objectArrayTrait({
    type: WebMapServiceAvailableLayerStylesTraits,
    name: "Available Styles",
    description: "The available styles.",
    idProperty: "layerName"
  })
  availableStyles?: WebMapServiceAvailableLayerStylesTraits[];

  @objectArrayTrait({
    type: WebMapServiceAvailableLayerDimensionsTraits,
    name: "Available Dimensions",
    description: "The available dimensions.",
    idProperty: "layerName"
  })
  availableDimensions?: WebMapServiceAvailableLayerDimensionsTraits[];

  @anyTrait({
    name: "Parameters",
    description:
      "Additional parameters to pass WMS `GetMap` and `GetFeatureInfo` requests. Style parameters are stored as CSV in `styles`, dimension parameters are stored in `dimensions`."
  })
  parameters?: JsonObject;

  @primitiveTrait({
    type: "number",
    name: "Maximum Refresh Intervals",
    description:
      "The maximum number of discrete times that can be created by a single " +
      "date range, when specified in the format time/time/periodicity. E.g. " +
      "`2015-04-27T16:15:00/2015-04-27T18:45:00/PT15M` has 11 times."
  })
  maxRefreshIntervals: number = 10000;

  @primitiveTrait({
    type: "boolean",
    name: "Disable dimension selectors",
    description: "When true, disables the dimension selectors in the workbench."
  })
  disableDimensionSelectors = false;

  @primitiveTrait({
    type: "boolean",
    name: "Is GeoServer",
    description: "True if this WMS is a GeoServer; otherwise, false."
  })
  isGeoServer: boolean = false;

  @primitiveTrait({
    type: "boolean",
    name: "Is Esri",
    description: "True if this WMS is from Esri; otherwise, false."
  })
  isEsri: boolean = false;

  @primitiveTrait({
    type: "boolean",
    name: "Is Thredds",
    description: "True if this WMS is from a THREDDS server; otherwise, false."
  })
  isThredds: boolean = false;

  @primitiveTrait({
    type: "boolean",
    name: "Is NcWMS",
    description: "True if this WMS supports NcWMS."
  })
  isNcWMS: boolean = false;

  @primitiveTrait({
    type: "boolean",
    name: "Supports color scale range",
    description:
      "Gets or sets whether this WMS server has been identified as supporting the COLORSCALERANGE parameter."
  })
  supportsColorScaleRange: boolean = false;

  @primitiveTrait({
    type: "boolean",
    name: "Supports GetLegendGraphic requests",
    description:
      "Gets or sets whether this WMS server supports GetLegendGraphic requests."
  })
  supportsGetLegendGraphic: boolean = false;

  @primitiveTrait({
    type: "boolean",
    name: "Supports GetTimeseries requests",
    description:
      'Gets or sets whether this WMS server supports GetTimeseries requests. If true, then GetTimeseries will be used instead of GetFeatureInfo. This will also set default value of `getFeatureInfoFormat` to `{ format: "text/csv", type: "text" }`'
  })
  supportsGetTimeseries: boolean = false;

  @primitiveTrait({
    type: "number",
    name: "Color scale minimum",
    description:
      "The minimum of the color scale range. Because COLORSCALERANGE is a non-standard property supported by ncWMS servers, this property is ignored unless WebMapServiceCatalogItem's supportsColorScaleRange is true. WebMapServiceCatalogItem's colorScaleMaximum must be set as well."
  })
  colorScaleMinimum: number = -50;

  @primitiveTrait({
    type: "number",
    name: "Color scale maximum",
    description:
      "The maximum of the color scale range. Because COLORSCALERANGE is a non-standard property supported by ncWMS servers, this property is ignored unless WebMapServiceCatalogItem's supportsColorScaleRange is true. WebMapServiceCatalogItem's colorScaleMinimum must be set as well."
  })
  colorScaleMaximum: number = 50;

  @primitiveTrait({
    type: "boolean",
    name: "Supports NcWMS Palettes",
    description:
      "Gets or sets whether this WMS server has been identified as supporting NcWMS Palettes. This will default to true if the server is identified as an NcWMS server."
  })
  supportsNcWmsPalettes: boolean = false;

  @primitiveTrait({
    type: "boolean",
    name: "Supports NcWMS GetMetadata requests",
    description:
      "Gets or sets whether this WMS server supports NcWMS GetMetadata requests. This will default to true if the server is identified as an NcWMS server."
  })
  supportsNcWmsGetMetadata: boolean = false;

  @primitiveTrait({
    type: "string",
    name: "Palette",
    description:
      "palette is a non-standard property supported by THREDDS servers. This property is ignored unless WebMapServiceCatalogItem's isThredds is true. If the server doesn't provide a default, the default palette is 'default'."
  })
  palette?: string = "default";

  @primitiveArrayTrait({
    type: "string",
    name: "Available Palettes",
    description: "The available palettes."
  })
  availablePalettes: string[] = [];

  @primitiveArrayTrait({
    type: "string",
    name: "No Palettes styles",
    description: "Styles that do not support palettes"
  })
  noPaletteStyles: string[] = [];

  @primitiveTrait({
    type: "boolean",
    name: "Use WMS version 1.3.0",
    description:
      'Use WMS version 1.3.0. True by default (unless `url` has `"version=1.1.1"` or `"version=1.1.0"`), if false, then WMS version 1.1.1 will be used.'
  })
  useWmsVersion130: boolean = true;

  @objectTrait({
    type: GetFeatureInfoFormat,
    name: "GetFeatureInfo format",
    description:
      'Format parameter to pass to GetFeatureInfo requests. Defaults to "application/json", "application/vnd.ogc.gml", "text/html" or "text/plain" - depending on GetCapabilities response'
  })
  getFeatureInfoFormat?: GetFeatureInfoFormat;

  @primitiveTrait({
    type: "string",
    name: "GetFeatureInfo URL",
    description:
      "If defined, this URL will be used for `GetFeatureInfo` requests instead of `url`."
  })
  getFeatureInfoUrl?: string;

  @anyTrait({
    name: "Parameters",
    description:
      "Additional parameters to pass WMS `GetFeatureInfo` requests. If `parameters` trait is also defined, this is applied on top. Dimension parameters are stored in `dimensions`."
  })
  getFeatureInfoParameters?: JsonObject;
}
