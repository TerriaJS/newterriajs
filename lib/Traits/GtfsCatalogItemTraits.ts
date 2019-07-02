import mixTraits from "./mixTraits";
import UrlTraits from "./UrlTraits";
import TableTraits from "./TableTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import TimeVaryingTraits from "./TimeVaryingTraits";
import RasterLayerTraits from "./RasterLayerTraits";
import LayerOrderingTraits from "./LayerOrderingTraits";
import MappableTraits from "./MappableTraits";
import primitiveTrait from "./primitiveTrait";
import AutoRefreshingTraits from "./AutoRefreshingTraits";

export default class GtfsCatalogItemTraits extends mixTraits(
    UrlTraits,
    CatalogMemberTraits,
    MappableTraits,
    RasterLayerTraits,
    LayerOrderingTraits,
    AutoRefreshingTraits
  ) {
    @primitiveTrait({
      name: "GTFS API key",
      description: "The key that should be used when querying the GTFS API service",
      type: "string"
    })
    apiKey?: string;

    @primitiveTrait({
      name: "Image url",
      description: "Url for the image to use to represent a vehicle. Recommended size 32x32 pixels.",
      type: "string"
    })
    image?: string;
  }