import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

export default class ClusteringTraits extends ModelTraits {
  @primitiveTrait({
    name: "Enabled",
    description: "True to enable clustering. False by default",
    type: "boolean"
  })
  enabled = false;

  @primitiveTrait({
    name: "pixelRange",
    description: "The pixel range to extend the screen space bounding box",
    type: "number"
  })
  pixelRange: number = 35;

  @primitiveTrait({
    name: "minimumClusterSize",
    description:
      "The minimum number of screen space objects that can be clustered",
    type: "number"
  })
  minimumClusterSize: number = 5;

  @primitiveTrait({
    name: "pinSize",
    description: "The size of the pin, in pixels",
    type: "number"
  })
  pinSize: number = 60;

  @primitiveTrait({
    name: "pinBackgroundColor",
    type: "string",
    description: "The color of the pin"
  })
  pinBackgroundColor: string = "gray";
}
