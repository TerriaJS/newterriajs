import { action } from "mobx";
import { observer } from "mobx-react";
import { FC, Ref, useEffect, useRef } from "react";
import styled from "styled-components";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import ScreenSpaceEventHandler from "terriajs-cesium/Source/Core/ScreenSpaceEventHandler";
import ScreenSpaceEventType from "terriajs-cesium/Source/Core/ScreenSpaceEventType";
import Scene from "terriajs-cesium/Source/Scene/Scene";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import ClippingMixin from "../../../ModelMixins/ClippingMixin";
import BoxDrawing from "../../../Models/BoxDrawing";
import Cesium from "../../../Models/Cesium";
import CommonStrata from "../../../Models/Definition/CommonStrata";
import ViewState from "../../../ReactViewModels/ViewState";
import Text from "../../../Styled/Text";
import LatLonHeightTraits from "../../../Traits/TraitsClasses/LatLonHeightTraits";

type ItemType = ClippingMixin.Instance &
  CatalogMemberMixin.Instance & { clippingBoxDrawing: BoxDrawing };

interface PropsType {
  viewState: ViewState;
  cesium: Cesium;
  item: ItemType;
}

const pickScratch = new Cartesian3();

/**
 * A tool for repositioning the clipping box.
 *
 * It moves the clipping box to follow the mouse and places it where the user has clicked.
 * Action can be cancelled by pressing Escape button.
 */
const RepositionClippingBox: FC<React.PropsWithChildren<PropsType>> = observer(
  ({ cesium, item }) => {
    const promptRef: Ref<HTMLDivElement> = useRef(null);

    // End repositioning
    const endRepositioning = action((item: ItemType) => {
      item.repositionClippingBoxTrigger = false;

      // A hacky way to re-compute the boxDrawing so that it gets reset to the
      // saved trait position.
      item.clippingBox.setTrait(CommonStrata.user, "showClippingBox", false);
      window.setTimeout(
        action(() =>
          item.clippingBox.setTrait(CommonStrata.user, "showClippingBox", true)
        ),
        100
      );
    });

    // Move the clipping box and cursor prompt to follow the mouse
    const moveItem = (
      item: ItemType,
      canvasCursorPos: Cartesian2,
      cesium: Cesium
    ) => {
      const prompt = promptRef.current;
      if (prompt === null) {
        return;
      }

      const pickPosition = pickGlobePosition(
        canvasCursorPos,
        cesium.scene,
        pickScratch
      );
      if (!pickPosition) {
        return;
      }

      const rect = cesium.scene.canvas.getBoundingClientRect();
      const offset = 10; // 10px away from the cursor
      const left = canvasCursorPos.x + rect.left + offset;
      const top = canvasCursorPos.y + rect.top + offset;

      if (left <= rect.left) {
        return;
      }

      prompt.style.left = `${left}px`;
      prompt.style.top = `${top}px`;

      const boxDrawing = item.clippingBoxDrawing;
      // A hacky way to set boxDrawing position without setting the traits and
      // consequently triggering expensive recomputation
      boxDrawing.setPosition(pickPosition);
      boxDrawing.onChange?.({
        isFinished: false,
        modelMatrix: (boxDrawing as any).modelMatrix,
        translationRotationScale: (boxDrawing as any).trs
      });
    };

    // Place the clipping box at the screen position
    const placeItem = (
      item: ItemType,
      screenPosition: Cartesian2,
      cesium: Cesium
    ) => {
      const position = pickGlobePosition(
        screenPosition,
        cesium.scene,
        pickScratch
      );
      if (!position) {
        return false;
      }

      LatLonHeightTraits.setFromCartesian(
        item.clippingBox.position,
        CommonStrata.user,
        position
      );
      return true;
    };

    // Init effect that sets up the event handlers etc.
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    useEffect(
      action(function init() {
        const canvas = cesium.scene.canvas;

        const boxDrawing = item.clippingBoxDrawing;
        (boxDrawing as any).stopInteractions();
        boxDrawing.enableScaling = false;
        boxDrawing.enableRotation = false;

        setCursor(canvas, "crosshair");
        cesium.isFeaturePickingPaused = true;
        if (promptRef.current) setCursor(promptRef.current, "grabbing");

        const inputHandler = new ScreenSpaceEventHandler(canvas);
        inputHandler.setInputAction(
          ({ endPosition }: ScreenSpaceEventHandler.MotionEvent) => {
            moveItem(item, endPosition, cesium);
          },
          ScreenSpaceEventType.MOUSE_MOVE
        );

        inputHandler.setInputAction(
          ({ position }: ScreenSpaceEventHandler.PositionedEvent) =>
            placeItem(item, position, cesium) && endRepositioning(item),
          ScreenSpaceEventType.LEFT_CLICK
        );

        const escapeKeyHandler = (ev: KeyboardEvent) =>
          ev.key === "Escape" && endRepositioning(item);
        document.addEventListener("keydown", escapeKeyHandler);

        return function destroy() {
          inputHandler.destroy();
          setCursor(canvas, "auto");
          if (promptRef.current) setCursor(promptRef.current, "auto");
          if (item.clippingBoxDrawing?.dataSource?.show) {
            (item.clippingBoxDrawing as any).startInteractions();
          }
          document.removeEventListener("keydown", escapeKeyHandler);
          cesium.isFeaturePickingPaused = false;
          endRepositioning(item);
        };
      }),
      [item, cesium]
    );

    const initialX = window.innerWidth / 2;
    const initualY = window.innerHeight / 2;
    return (
      <CursorPrompt ref={promptRef} x={initialX} y={initualY}>
        <Text medium bold style={{ marginBottom: "5px" }}>
          Click on map to position clipping box
        </Text>
        <Text small textAlignCenter>
          Press ESC to cancel
        </Text>
      </CursorPrompt>
    );
  }
);

interface CursorPromptProps {
  x: number;
  y: number;
}

const CursorPrompt = styled.div.attrs<CursorPromptProps>(({ x, y }) => ({
  style: {
    left: x + 10,
    top: y + 10
  }
}))<CursorPromptProps>`
  position: absolute;
  overflow: visible;
  white-space: nowrap;
  max-width: 500px;
  background-color: #2563eb;
  color: white;
  padding: 12px;
  border-radius: 6px;
  box-shadow: 0px 10px 15px -3px #0000001a;
`;

function setCursor(el: HTMLElement, cursorName: string) {
  el.style.cursor = cursorName;
}

function pickGlobePosition(
  screenCoords: Cartesian2,
  scene: Scene,
  result?: Cartesian3
): Cartesian3 | undefined {
  const pickRay = scene.camera.getPickRay(screenCoords);
  return pickRay ? scene.globe.pick(pickRay, scene, result) : undefined;
}

export default RepositionClippingBox;
