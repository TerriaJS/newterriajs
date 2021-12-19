import { isJsonObject } from "../Core/Json";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import MappableMixin from "../ModelMixins/MappableMixin";
import CatalogMemberTraits from "../Traits/TraitsClasses/CatalogMemberTraits";
import MappableTraits from "../Traits/TraitsClasses/MappableTraits";
import SplitterTraits from "../Traits/TraitsClasses/SplitterTraits";
import hasTraits from "./Definition/hasTraits";
import Model from "./Definition/Model";

export type Comparable = Model<
  SplitterTraits & CatalogMemberTraits & MappableTraits
> &
  MappableMixin.Instance &
  CatalogMemberMixin.Instance;

/**
 * Returns true if the item is Comparable.
 */
export function isComparableItem(item: any): item is Comparable {
  const isComparable =
    item &&
    MappableMixin.isMixedInto(item) &&
    CatalogMemberMixin.isMixedInto(item) &&
    hasTraits(item, MappableTraits, "show") &&
    hasTraits(item, CatalogMemberTraits, "name") &&
    hasTraits(item, SplitterTraits, "splitDirection");
  return isComparable;
}

/**
 * Object used to store compare workflow configuration
 */
export type CompareConfig = {
  // Activates the compare workflow when true
  showCompare: boolean;
  // ID of the item to show in the left panel
  leftPanelItemId: string | undefined;
  // ID of the item to show in the right panel
  rightPanelItemId: string | undefined;
  // True if the comparison was directly invoked by the user as opposed to
  // invoked by restoring a share link state. When directly invoked by the user
  // context items will be hidden on launch. Otherwise they retain the state
  // from the share link.
  isUserTriggered?: boolean;
};

/**
 * Create a ComapreConfig object from the given json.
 */
export function createCompareConfig(json: any = {}): CompareConfig | undefined {
  if (!isJsonObject(json)) {
    return undefined;
  }

  const showCompare = json.showCompare === true ? true : false;

  const leftPanelItemId =
    typeof json.leftPanelItemId === "string" ? json.leftPanelItemId : undefined;

  const rightPanelItemId =
    typeof json.rightPanelItemId === "string"
      ? json.rightPanelItemId
      : undefined;

  return {
    showCompare,
    leftPanelItemId,
    rightPanelItemId
  };
}
