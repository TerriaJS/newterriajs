import { JsonObject } from "../Core/Json";
import Feature from "./Feature";

/** This model can be used to inject properties into FeatureInfoSections context. These properties will be accessible from featureInfoTemplate mustache template.
 */
interface FeatureInfoContext {
  featureInfoContext: (f: Feature) => JsonObject | undefined;
}

namespace FeatureInfoContext {
  export function is(model: any): model is FeatureInfoContext {
    return "featureInfoContext" in model;
  }
}

export default FeatureInfoContext;
