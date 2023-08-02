import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import LayerOrderingTraits from "./LayerOrderingTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import MappableTraits from "./MappableTraits";
import ImageryProviderTraits from "./ImageryProviderTraits";
import UrlTraits from "./UrlTraits";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import CogBandTraits from "./CogBandTraits";
import CogStyleTraits from "./CogStyleTraits";

export default class CogCompositeCatalogItemTraits extends mixTraits(
  ImageryProviderTraits,
  LayerOrderingTraits,
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits,
  LegendOwnerTraits
) {
  @objectArrayTrait({
    name: "Cog Band Urls Object Array",
    description:
      "The supported distribution formats and their mapping to Terria types. " +
      "These are listed in order of preference.",
    type: CogBandTraits,
    idProperty: "bandName"
  })
  bands?: CogBandTraits[];

  @objectArrayTrait({
    name: "Style",
    description:
      "The supported distribution formats and their mapping to Terria types. " +
      "These are listed in order of preference.",
    type: CogStyleTraits,
    idProperty: "functionName"
  })
  style?: CogStyleTraits[];
}
