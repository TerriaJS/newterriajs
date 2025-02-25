import { AxisBottom, AxisLeft } from "@visx/axis";
import { observer } from "mobx-react";
import { memo, useEffect, useRef, type ComponentPropsWithoutRef } from "react";
import type { ChartItem } from "../../../ModelMixins/ChartableMixin";
import LineAndPointChart from "./LineAndPointChart";
import LineChart from "./LineChart";
import MomentLinesChart from "./MomentLinesChart";
import MomentPointsChart from "./MomentPointsChart";
import type { ChartZoomHandle, XScale, YScale } from "./types";
import { Line } from "@visx/shape";
import PointOnMap from "./PointOnMap";

const LABEL_COLOR = "#efefef";
const Y_AXIS_NUM_TICKS = 4;
const Y_AXIS_TICK_LABEL_FONT_SIZE = 10;

interface PlotProps {
  chartItems: readonly ChartItem[];
  initialScales: readonly { x: XScale; y: YScale }[];
  zoomedScales: readonly { x: XScale; y: YScale }[];
}

export const Plot = memo(
  ({ chartItems, initialScales, zoomedScales }: PlotProps) => {
    const chartRefs = useRef<{ id: string; zoomHandle: ChartZoomHandle }[]>([]);

    useEffect(() => {
      chartRefs.current?.forEach((ref, i) => {
        if (typeof ref?.zoomHandle.doZoom === "function") {
          ref.zoomHandle.doZoom(zoomedScales[i]);
        }
      });
    }, [zoomedScales]);

    const addToRefs = (id: string, el: ChartZoomHandle | null) => {
      if (el) {
        chartRefs.current.push({ id, zoomHandle: el });
      } else {
        chartRefs.current = chartRefs.current.filter((ref) => ref.id !== id);
      }
    };

    return chartItems.map((chartItem, i) => {
      const id = sanitizeIdString(chartItem.key);
      switch (chartItem.type) {
        case "line":
          return (
            <LineChart
              key={chartItem.key}
              ref={(node) => addToRefs(id, node)}
              id={id}
              chartItem={chartItem}
              scales={initialScales[i]}
            />
          );
        case "momentPoints": {
          // Find a basis item to stick the points on, if we can't find one, we
          // vertically center the points
          const basisItemIndex = chartItems.findIndex(
            (item) =>
              (item.type === "line" || item.type === "lineAndPoint") &&
              item.xAxis.scale === "time"
          );
          return (
            <MomentPointsChart
              key={chartItem.key}
              ref={(node) => addToRefs(id, node)}
              id={id}
              chartItem={chartItem}
              scales={initialScales[i]}
              basisItem={chartItems[basisItemIndex]}
              basisItemScales={initialScales[basisItemIndex]}
              glyph={chartItem.glyphStyle}
            />
          );
        }
        case "momentLines": {
          return (
            <MomentLinesChart
              key={chartItem.key}
              ref={(node) => addToRefs(id, node)}
              id={id}
              chartItem={chartItem}
              scales={initialScales[i]}
            />
          );
        }
        case "lineAndPoint": {
          return (
            <LineAndPointChart
              key={chartItem.key}
              ref={(node) => addToRefs(id, node)}
              id={id}
              chartItem={chartItem}
              scales={initialScales[i]}
              glyph={chartItem.glyphStyle}
            />
          );
        }
      }
    });
  }
);

Plot.displayName = "Plot";

interface XAxisProps {
  top: number;
  scale: XScale;
  label: string;
}

export const XAxis = memo(({ scale, ...restProps }: XAxisProps) => {
  return (
    <AxisBottom
      stroke="#efefef"
      tickStroke="#efefef"
      tickLabelProps={() => ({
        fill: "#efefef",
        textAnchor: "middle",
        fontSize: 12,
        fontFamily: "Arial"
      })}
      labelProps={{
        fill: LABEL_COLOR,
        fontSize: 12,
        textAnchor: "middle",
        fontFamily: "Arial"
      }}
      // .nice() rounds the scale so that the aprox beginning and
      // aprox end labels are shown
      // See: https://stackoverflow.com/questions/21753126/d3-js-starting-and-ending-tick
      scale={scale.nice()}
      {...restProps}
    />
  );
});
XAxis.displayName = "XAxis";

interface YAxisProps {
  scale: YScale;
  color: string;
  units?: string;
  offset: number;
}

export const YAxis = memo(({ scale, color, units, offset }: YAxisProps) => {
  return (
    <AxisLeft
      key={`y-axis-${units}`}
      left={offset}
      scale={scale}
      numTicks={Y_AXIS_NUM_TICKS}
      stroke={color}
      tickStroke={color}
      label={units || ""}
      labelOffset={10}
      labelProps={{
        fill: color,
        textAnchor: "middle",
        fontSize: 12,
        fontFamily: "Arial"
      }}
      tickLabelProps={() => ({
        fill: color,
        textAnchor: "end",
        fontSize: Y_AXIS_TICK_LABEL_FONT_SIZE,
        fontFamily: "Arial"
      })}
    />
  );
});
YAxis.displayName = "YAxis";

interface CursorProps extends ComponentPropsWithoutRef<typeof Line> {
  x: number;
}

export const Cursor = memo(({ x, ...restProps }: CursorProps) => {
  return <Line from={{ x, y: 0 }} to={{ x, y: 1000 }} {...restProps} />;
});

Cursor.displayName = "Cursor";

interface PointsOnMapProps {
  chartItems: readonly ChartItem[];
}

export const PointsOnMap: React.FC<PointsOnMapProps> = observer(
  ({ chartItems }) => {
    return chartItems.map(
      (chartItem) =>
        chartItem.pointOnMap && (
          <PointOnMap
            key={`point-on-map-${chartItem.key}`}
            color={chartItem.getColor()}
            point={chartItem.pointOnMap}
          />
        )
    );
  }
);
PointsOnMap.displayName = "PointsOnMap";

const sanitizeIdString = (id: string) => {
  // delete all non-alphanum chars
  return id.replace(/[^a-zA-Z0-9_-]/g, "");
};
