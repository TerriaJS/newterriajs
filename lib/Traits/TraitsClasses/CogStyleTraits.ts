import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import ModelTraits from "../ModelTraits";

export default class CogStyleTraits extends ModelTraits {
  @primitiveTrait({
    name: "Function Name",
    description: "The name of a predefined colour mapping function in Terriajs",
    type: "string"
  })
  functionName?: string;

  @primitiveArrayTrait({
    name: "Function Inputs",
    description:
      "The names for the bands to be input into the style function, in order, e.g. ['red', 'blue', 'green']",
    type: "string"
  })
  functionInputs?: string[];
}
