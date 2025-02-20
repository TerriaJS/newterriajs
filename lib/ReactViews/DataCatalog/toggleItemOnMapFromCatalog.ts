import {
  Category,
  DataSourceAction
} from "../../Core/AnalyticEvents/analyticEvents";
import getPath from "../../Core/getPath";
import ReferenceMixin from "../../ModelMixins/ReferenceMixin";
import TimeVarying from "../../ModelMixins/TimeVarying";
import { BaseModel } from "../../Models/Definition/Model";
import Terria from "../../Models/Terria";
import ViewState from "../../ReactViewModels/ViewState";

// Whether the item is being added or removed
export enum Op {
  Add,
  Remove
}

// Assume that member could be a reference to a reference
// All references should be loaded before calling this (by workbench.add)
function addOrRemoveFromTimelineStack(
  terria: Terria,
  member: BaseModel,
  op: Op
): void {
  if (ReferenceMixin.isMixedInto(member))
    return (
      member.target && addOrRemoveFromTimelineStack(terria, member.target, op)
    );
  if (TimeVarying.is(member)) {
    if (op === Op.Add) terria.timelineStack.addToTop(member);
    else terria.timelineStack.remove(member);
  }
}

/**
 * Toggle an item on or off the map. A utility function intended to be used by DataCatalogX
 *  React components and friends (should be called from inside the explorer panel)
 *
 * @param viewState
 * @param item Could be an item or a Reference to an item
 * @param keepCatalogOpen
 * @param analyticsEvents
 */
export default async function toggleItemOnMapFromCatalog(
  viewState: ViewState,
  item: BaseModel,
  keepCatalogOpen: boolean,
  analyticsEvents: {
    [Op.Add]: DataSourceAction;
    [Op.Remove]: DataSourceAction;
  }
) {
  const op = viewState.terria.workbench.contains(item) ? Op.Remove : Op.Add;

  if (op === Op.Add) {
    (await viewState.terria.workbench.add(item)).raiseError(
      viewState.terria,
      undefined,
      true // We want to force show error to user here - because this function is called when a user clicks the "Add to workbench"  buttons
    );
  } else {
    viewState.terria.workbench.remove(item);
  }

  addOrRemoveFromTimelineStack(viewState.terria, item, op);

  if (viewState.terria.workbench.contains(item) && !keepCatalogOpen) {
    viewState.closeCatalog();
    viewState.terria.analytics?.logEvent(
      Category.dataSource,
      analyticsEvents[op],
      getPath(item)
    );
  }
}
