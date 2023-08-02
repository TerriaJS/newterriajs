import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

export default class CogBandTraits extends ModelTraits {
  @primitiveTrait({
    name: "url",
    description: "The url pointing to the online resource for this band",
    type: "string"
  })
  url?: string;

  @primitiveTrait({
    name: "bandName",
    description: "The name for the band, e.g. 'red', 'blue', or 'green'",
    type: "string"
  })
  bandName?: string;

  @primitiveTrait({
    name: "bandIndex",
    description:
      "If this band is coming from a multiband tiff, please specify the index of the band you want",
    type: "string"
  })
  bandIndex?: string;
}
