import L from "leaflet";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import { FC, useEffect, useState } from "react";
import { useTheme } from "styled-components";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import EllipsoidGeodesic from "terriajs-cesium/Source/Core/EllipsoidGeodesic";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import Scene from "terriajs-cesium/Source/Scene/Scene";
import isDefined from "../../../Core/isDefined";
import Box from "../../../Styled/Box";
import Text from "../../../Styled/Text";
import { useViewState } from "../../Context";

const geodesic = new EllipsoidGeodesic();

const distances = [
  1, 2, 3, 5, 10, 20, 30, 50, 100, 200, 300, 500, 1000, 2000, 3000, 5000, 10000,
  20000, 30000, 50000, 100000, 200000, 300000, 500000, 1000000, 2000000,
  3000000, 5000000, 10000000, 20000000, 30000000, 50000000
];

interface IDistanceLegendProps {
  scale?: number;
  isPrintMode?: boolean;
}

export const DistanceLegend: FC<React.PropsWithChildren<IDistanceLegendProps>> =
  observer(({ scale = 1, isPrintMode = false }) => {
    const [distanceLabel, setDistanceLabel] = useState<string>();
    const [barWidth, setBarWidth] = useState<number>(0);

    const { terria } = useViewState();
    const theme = useTheme();

    let removeUpdateSubscription:
      | CesiumEvent.RemoveCallback
      | (() => void)
      | undefined;

    useEffect(() => {
      const viewerSubscriptions: CesiumEvent.RemoveCallback[] = [];
      /* eslint-disable-next-line react-hooks/exhaustive-deps */
      removeUpdateSubscription = addUpdateSubscription();

      return () => {
        if (removeUpdateSubscription) {
          removeUpdateSubscription();
        }
        viewerSubscriptions.forEach((clear) => clear());
      };
    }, [terria.cesium, terria.leaflet]);

    const addUpdateSubscription = ():
      | CesiumEvent.RemoveCallback
      | (() => void)
      | undefined => {
      if (isDefined(terria.cesium)) {
        const scene = terria.cesium.scene;
        let removeUpdateSubscription: CesiumEvent.RemoveCallback | undefined =
          scene.postRender.addEventListener(() => {
            updateDistanceLegendCesium(scene);
            if (isPrintMode) {
              removeUpdateSubscription?.();
              removeUpdateSubscription = undefined;
            }
          });
        return removeUpdateSubscription;
      } else if (isDefined(terria.leaflet)) {
        const map = terria.leaflet.map;
        let removeUpdateSubscription: (() => void) | undefined = undefined;

        if (!isPrintMode) {
          const potentialChangeCallback = function potentialChangeCallback() {
            updateDistanceLegendLeaflet(map);
          };
          removeUpdateSubscription = function () {
            map.off("zoomend", potentialChangeCallback);
            map.off("moveend", potentialChangeCallback);
          };

          map.on("zoomend", potentialChangeCallback);
          map.on("moveend", potentialChangeCallback);
        }

        updateDistanceLegendLeaflet(map);
        return removeUpdateSubscription;
      }
    };

    const updateDistanceLegendCesium = (scene: Scene) => {
      // Find the distance between two pixels at the bottom center of the screen.
      const width = scene.canvas.clientWidth;
      const height = scene.canvas.clientHeight;

      const left = scene.camera.getPickRay(
        new Cartesian2((width / 2) | 0, height - 1)
      );
      const right = scene.camera.getPickRay(
        new Cartesian2((1 + width / 2) | 0, height - 1)
      );

      const globe = scene.globe;

      if (!isDefined(left) || !isDefined(right)) {
        return;
      }

      const leftPosition = globe.pick(left, scene);
      const rightPosition = globe.pick(right, scene);

      if (!isDefined(leftPosition) || !isDefined(rightPosition)) {
        setBarWidth(0);
        setDistanceLabel(undefined);
        return;
      }

      const leftCartographic =
        globe.ellipsoid.cartesianToCartographic(leftPosition);
      const rightCartographic =
        globe.ellipsoid.cartesianToCartographic(rightPosition);

      geodesic.setEndPoints(leftCartographic, rightCartographic);
      const pixelDistance = geodesic.surfaceDistance;
      runInAction(() => (terria.mainViewer.scale = pixelDistance));

      // Find the first distance that makes the scale bar less than 100 pixels.
      const maxBarWidth = 100;
      let distance;
      for (let i = distances.length - 1; !isDefined(distance) && i >= 0; --i) {
        if (distances[i] / pixelDistance < maxBarWidth) {
          distance = distances[i];
        }
      }

      if (isDefined(distance)) {
        let label;
        if (distance >= 1000) {
          label = (distance / 1000).toString() + " km";
        } else {
          label = distance.toString() + " m";
        }
        setBarWidth(((distance / pixelDistance) * scale) | 0);
        setDistanceLabel(label);
      } else {
        setBarWidth(0);
        setDistanceLabel(undefined);
      }
    };

    const updateDistanceLegendLeaflet = (map: L.Map) => {
      const halfHeight = map.getSize().y / 2;
      const maxPixelWidth = 100;
      const maxMeters = map
        .containerPointToLatLng([0, halfHeight])
        .distanceTo(map.containerPointToLatLng([maxPixelWidth, halfHeight]));

      runInAction(() => (terria.mainViewer.scale = maxMeters / 100));
      // @ts-expect-error Accessing private method
      const meters = L.control.scale()._getRoundNum(maxMeters);
      const label = meters < 1000 ? meters + " m" : meters / 1000 + " km";

      setBarWidth((meters / maxMeters) * maxPixelWidth * scale);
      setDistanceLabel(label);
    };

    const barStyle = {
      width: barWidth + "px",
      left: 5 + (125 - barWidth) / 2 + "px",
      height: "2px"
    };

    return distanceLabel ? (
      <Box
        column
        centered
        css={`
          margin-top: 3px;
          margin-bottom: 3px;
          &:hover {
            background-color: ${theme.charcoalGrey};
          }
        `}
        paddedHorizontally={2}
        className="tjs-legend__distanceLegend"
      >
        <Text
          as="label"
          mono
          styledLineHeight="1"
          textLight
          styledFontSize="inherit"
        >
          {distanceLabel}
        </Text>
        <div
          style={barStyle}
          className="tjs-legend__bar"
          css={{
            backgroundColor: theme.textLight,
            transition: "all 0.5s ease-in-out 0s"
          }}
        />
      </Box>
    ) : null;
  });
