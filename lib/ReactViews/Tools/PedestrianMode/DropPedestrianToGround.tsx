import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import EllipsoidTerrainProvider from "terriajs-cesium/Source/Core/EllipsoidTerrainProvider";
import sampleTerrainMostDetailed from "terriajs-cesium/Source/Core/sampleTerrainMostDetailed";
import ScreenSpaceEventHandler from "terriajs-cesium/Source/Core/ScreenSpaceEventHandler";
import ScreenSpaceEventType from "terriajs-cesium/Source/Core/ScreenSpaceEventType";
import Scene from "terriajs-cesium/Source/Scene/Scene";
import isDefined from "../../../Core/isDefined";
import Cesium from "../../../Models/Cesium";
import MouseTooltip from "./MouseTooltip";

type DropPedestrianToGroundProps = {
  cesium: Cesium;
  pedestrianHeight: number;
  onDropCancelled: () => void;
  afterDrop: () => void;
};

const DropPedestrianToGround: FC<DropPedestrianToGroundProps> = (props) => {
  const cesium = props.cesium;
  const scene = cesium.scene;
  const eventHandler = new ScreenSpaceEventHandler(scene.canvas);
  const [t] = useTranslation();
  const [showMouseTooltip, setShowMouseTooltip] = useState<boolean>(true);

  useEffect(function setupEventHandlers() {
    // Pause feature picking while we select a drop point on the map.
    cesium.isFeaturePickingPaused = true;

    const dropPedestrian = ({
      position: mousePosition
    }: {
      position: Cartesian2;
    }) => {
      // Convert mouse position to a point on the globe.
      const pickRay = scene.camera.getPickRay(mousePosition);
      const pickPosition = isDefined(pickRay)
        ? scene.globe.pick(pickRay, scene)
        : undefined;
      if (!pickPosition) return;

      setShowMouseTooltip(false);
      // Get the precise position and fly to it.
      getPrecisePosition(scene, pickPosition).then((cartographic) => {
        cartographic.height += props.pedestrianHeight;
        const position = Cartographic.toCartesian(cartographic);
        flyTo(scene, position, {
          orientation: {
            heading: scene.camera.heading,
            pitch: 0,
            roll: 0
          }
        }).then(props.afterDrop);
      });
    };

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") props.onDropCancelled();
    };

    eventHandler.setInputAction(
      dropPedestrian,
      ScreenSpaceEventType.LEFT_CLICK
    );
    eventHandler.setInputAction(
      props.onDropCancelled,
      ScreenSpaceEventType.RIGHT_CLICK
    );
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      eventHandler.destroy();
      cesium.isFeaturePickingPaused = false;
    };
  });

  return showMouseTooltip ? (
    <MouseTooltip
      scene={scene}
      text={t("pedestrianMode.dropPedestrianTooltipMessage")}
    />
  ) : null;
};

async function getPrecisePosition(
  scene: Scene,
  position: Cartesian3
): Promise<Cartographic> {
  const terrainProvider = scene.terrainProvider;
  const cartographic = Cartographic.fromCartesian(position);
  let preciseCartographic: Cartographic;
  if (
    terrainProvider === undefined ||
    terrainProvider instanceof EllipsoidTerrainProvider
  ) {
    preciseCartographic = cartographic;
    preciseCartographic.height = Math.max(0, preciseCartographic.height);
  } else {
    [preciseCartographic] = await sampleTerrainMostDetailed(terrainProvider, [
      cartographic
    ]);
  }
  return preciseCartographic;
}

async function flyTo(
  scene: Scene,
  destination: Cartesian3,
  options?: { duration?: number; orientation: any }
): Promise<void> {
  return new Promise((resolve) =>
    scene.camera.flyTo({
      destination,
      ...options,
      complete: () => {
        scene.requestRender();
        resolve();
      }
    })
  );
}

export default DropPedestrianToGround;
