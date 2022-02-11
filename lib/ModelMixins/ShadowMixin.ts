import { computed, runInAction } from "mobx";
import ShadowMode from "terriajs-cesium/Source/Scene/ShadowMode";
import Constructor from "../Core/Constructor";
import Model from "../Models/Definition/Model";
import { SelectableDimension } from "../Models/SelectableDimensions/SelectableDimensions";
import ShadowTraits, { Shadows } from "../Traits/TraitsClasses/ShadowTraits";
import i18next from "i18next";

function ShadowMixin<T extends Constructor<Model<ShadowTraits>>>(Base: T) {
  abstract class ShadowMixin extends Base {
    get hasShadows() {
      return true;
    }

    @computed get cesiumShadows() {
      switch (this.shadows.toLowerCase()) {
        case "none":
          return ShadowMode.DISABLED;
        case "both":
          return ShadowMode.ENABLED;
        case "cast":
          return ShadowMode.CAST_ONLY;
        case "receive":
          return ShadowMode.RECEIVE_ONLY;
        default:
          return ShadowMode.DISABLED;
      }
    }

    /** Shadow SelectableDimension. This has to be added to a catalog member's `selectableDimension` array */
    @computed
    get shadowDimension(): SelectableDimension {
      return {
        id: "shadows",
        name: i18next.t("models.shadow.name"),
        options: [
          { id: "NONE", name: i18next.t("models.shadow.options.none") },
          { id: "CAST", name: i18next.t("models.shadow.options.cast") },
          { id: "RECEIVE", name: i18next.t("models.shadow.options.receive") },
          { id: "BOTH", name: i18next.t("models.shadow.options.both") }
        ],
        selectedId: this.shadows,
        disable: !this.showShadowUi,
        setDimensionValue: (strata: string, shadow: Shadows) =>
          runInAction(() => this.setTrait(strata, "shadows", shadow))
      };
    }
  }

  return ShadowMixin;
}

namespace ShadowMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof ShadowMixin>> {}
  export function isMixedInto(model: any): model is Instance {
    return model && model.hasShadows;
  }
}

export default ShadowMixin;
