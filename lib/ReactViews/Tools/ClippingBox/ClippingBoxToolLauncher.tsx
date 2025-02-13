import { action } from "mobx";
import { observer } from "mobx-react";
import { FC, useEffect } from "react";
import ClippingMixin from "../../../ModelMixins/ClippingMixin";
import BoxDrawing from "../../../Models/BoxDrawing";
import Workbench from "../../../Models/Workbench";
import ViewState from "../../../ReactViewModels/ViewState";
import RepositionClippingBox from "./RepositionClippingBox";

interface PropsType {
  viewState: ViewState;
}

const TOOL_NAME = "reposition-clipping-box";

/**
 * A component that launches the clipping box repositioning tool when it gets
 *  triggerred by the user.
 */
const ClippingBoxToolLauncher: FC<PropsType> = observer(({ viewState }) => {
  const item = findItemRequiringRepositioning(viewState.terria.workbench);
  const cesium = viewState.terria.cesium;
  useEffect(
    function init() {
      if (!item || !cesium) {
        return;
      }

      viewState.openTool({
        toolName: TOOL_NAME,
        getToolComponent: () => RepositionClippingBox,
        params: { viewState, item, cesium },
        showCloseButton: false
      });

      return action(function cleanup() {
        const currentTool = viewState.currentTool;
        if (
          currentTool &&
          currentTool.toolName === TOOL_NAME &&
          currentTool.params?.item === item
        ) {
          item.repositionClippingBoxTrigger = false;
          viewState.closeTool();
        }
      });
    },
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [item, cesium]
  );

  return null;
});

/**
 * Find a workbench item that requires clipping box respositioning
 */
function findItemRequiringRepositioning(
  workbench: Workbench
): (ClippingMixin.Instance & { clippingBoxDrawing: BoxDrawing }) | undefined {
  return workbench.items.find(
    (it) =>
      ClippingMixin.isMixedInto(it) &&
      it.clippingBoxDrawing &&
      it.repositionClippingBoxTrigger
  ) as
    | (ClippingMixin.Instance & { clippingBoxDrawing: BoxDrawing })
    | undefined;
}

export default ClippingBoxToolLauncher;
