import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import objectTrait from "../Decorators/objectTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import { GeoJsonTraits } from "./GeoJsonTraits";
import GetCapabilitiesTraits from "./GetCapabilitiesTraits";
import StyleTraits from "./StyleTraits";

// TODO: Update this list. Is this what we want for WFS services? How do we prioritise "urn:ogc:def:crs:EPSG::4326"?
// export const SUPPORTED_CRS_3857 = ["EPSG:3857", "EPSG:900913"];
export const SUPPORTED_CRS_4326 = [
  "urn:ogc:def:crs:EPSG::4326",
  "EPSG:4326",
  "CRS:84",
  "EPSG:4283"
];
export default class WebFeatureServiceCatalogItemTraits extends mixTraits(
  GeoJsonTraits,
  GetCapabilitiesTraits
) {
  @primitiveTrait({
    type: "string",
    name: "Type Name(s)",
    description: "The type name or names to display."
  })
  typeNames?: string;

  @primitiveTrait({
    type: "number",
    name: "Max features",
    description: "Maximum number of features to display."
  })
  maxFeatures = 1000;

  @primitiveTrait({
    type: "string",
    name: "Srs Name",
    description: `Spatial Reference System to use. For WFS we prefer WGS 84 (${SUPPORTED_CRS_4326.join(
      ", "
    )}). With WFS requests it is best to use the urn identifier for the srsName, to enforce lat,long order in returned results.`
  })
  srsName?: string;

  @primitiveTrait({
    type: "string",
    name: "Output Format",
    description: `Output format to request for WFS requests. We support gml3 and gml3.1.1.`
  })
  outputFormat?: string;

  @anyTrait({
    name: "Parameters",
    description:
      "Additional parameters to pass to the WFS Server when requesting features."
  })
  parameters?: JsonObject;

  @objectTrait({
    type: StyleTraits,
    name: "Style",
    description:
      "Styling rules that follow [simplestyle-spec](https://github.com/mapbox/simplestyle-spec)"
  })
  style?: StyleTraits;
}
