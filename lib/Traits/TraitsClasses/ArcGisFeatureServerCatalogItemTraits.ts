import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import { traitClass } from "../Trait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import FeaturePickingTraits from "./FeaturePickingTraits";
import { GeoJsonTraits } from "./GeoJsonTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import MappableTraits from "./MappableTraits";
import { MinMaxLevelTraits } from "./MinMaxLevelTraits";
import UrlTraits from "./UrlTraits";

@traitClass({
  description: `Creates a single item in the catalog from one ESRI Feature Server layer.

  <strong>Note:</strong> <i>Must specify <b>layer ID</b>, e.g. <code>/0</code>, in the URL path.</i>

  Some traits are only relevant when the service supports tiling (see \`tileRequests\` trait).`,
  example: {
    url: "https://services5.arcgis.com/OvOcYIrJnM97ABBA/arcgis/rest/services/Australian_Public_Hospitals_WFL1/FeatureServer/0",
    type: "esri-featureServer",
    name: "Australian Public Hospitals",
    id: "some id"
  }
})
export default class ArcGisFeatureServerCatalogItemTraits extends mixTraits(
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits,
  LegendOwnerTraits,
  GeoJsonTraits,
  FeaturePickingTraits,
  MinMaxLevelTraits
) {
  @primitiveTrait({
    type: "boolean",
    name: "Clamp to Ground",
    description:
      "Whether the features in this service should be clamped to the terrain surface."
  })
  clampToGround: boolean = true;

  @primitiveTrait({
    type: "boolean",
    name: "Use style information from service",
    description:
      "Whether to symbolise the data using the drawingInfo object available in the service endpoint."
  })
  useStyleInformationFromService: boolean = true;

  @primitiveTrait({
    type: "string",
    name: "layerDef",
    description:
      "DEPRECATED, use `where` instead. The 'layerDef' string to pass to the server when requesting geometry."
  })
  layerDef: string = "1=1";

  @primitiveTrait({
    type: "string",
    name: "Where clause",
    description:
      "The 'where' string to pass to the server when requesting geometry."
  })
  where: string = "1=1";

  @primitiveTrait({
    type: "number",
    name: "Maximum features",
    description:
      "The maximum number of features to be retrieved from the feature service."
  })
  maxFeatures: number = 5000;

  @primitiveTrait({
    type: "number",
    name: "Features per request",
    description:
      "The number of features to be retrieved from the feature service in each request. This should be equal to the " +
      "maxRecordCount specified by the server."
  })
  featuresPerRequest: number = 1000;

  @primitiveTrait({
    type: "boolean",
    name: "Supports pagination",
    description:
      "Whether this feature service supports pagination. By default, this will be inferred from the server's response."
  })
  supportsPagination?: boolean;

  @primitiveTrait({
    type: "boolean",
    name: "Tile requests",
    description:
      "Whether this feature service supports tiled requests. This will be true by default, if the server supports tiling and no unsupported Point/Label/Trail styles are used (for example custom marker images)"
  })
  tileRequests: boolean = true;

  @primitiveTrait({
    type: "number",
    name: "Maximum features",
    description:
      "For each tile, the maximum number of features to be retrieved from the feature service. This will limit the number of requests, each request uses featuresPerTileRequest trait."
  })
  maxTiledFeatures: number = 100000;

  @primitiveTrait({
    type: "number",
    name: "Features per request",
    description:
      "The number of features to be retrieved from the feature service in each request. This should be equal to the " +
      "tileMaxRecordCount specified by the server."
  })
  featuresPerTileRequest: number = 4000;

  @primitiveTrait({
    type: "number",
    name: "maxRecordCountFactor",
    description:
      "When set, the maximum number of features returned by the query will equal the maxRecordCount of the service multiplied by this factor. This only applies to tiled requests. This will use the server's default value."
  })
  maxRecordCountFactor: number = 1;

  @primitiveTrait({
    type: "boolean",
    name: "Tile requests",
    description:
      "Whether this feature service supports tiled requests. By default, this will be inferred from the server's response."
  })
  supportsQuantization: boolean = true;

  @primitiveTrait({
    type: "string",
    name: "Object ID Field",
    description:
      "The field in the feature service that contains the unique identifier for each feature."
  })
  objectIdField: string = "OBJECTID";

  @primitiveArrayTrait({
    type: "string",
    name: "Out Fields",
    description:
      "The fields to be included in the response from the feature service. This will default to the object ID field, and include any fields required for styling. Currently, this only applies to tiled requests."
  })
  outFields: string[] = ["OBJECTID"];
}
