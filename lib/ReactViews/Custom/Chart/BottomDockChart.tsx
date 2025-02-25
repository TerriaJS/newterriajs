import { RectClipPath } from "@visx/clip-path";
import { localPoint } from "@visx/event";
import { GridRows } from "@visx/grid";
import { Group } from "@visx/group";
import { withParentSize, WithParentSizeProvidedProps } from "@visx/responsive";
import { scaleLinear, scaleTime } from "@visx/scale";
import groupBy from "lodash-es/groupBy";
import minBy from "lodash-es/minBy";
import { observer } from "mobx-react";
import { useEffect, useMemo, useState } from "react";
import type { ChartPoint } from "../../../Charts/ChartData";
import type { ChartAxis, ChartItem } from "../../../ModelMixins/ChartableMixin";
import Styles from "./bottom-dock-chart.scss";
import Legends from "./Legends";
import Tooltip from "./Tooltip";
import type { XScale } from "./types";
import { Cursor, Plot, PointsOnMap, XAxis, YAxis } from "./utils";
import { ZoomX } from "./ZoomX";

const CHART_MIN_WIDTH = 110;
const DEFAULT_GRID_COLOR = "#efefef";
const Y_AXIS_NUM_TICKS = 4;
const Y_AXIS_TICK_LABEL_FONT_SIZE = 10;

interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface BottomDockChartProps extends WithParentSizeProvidedProps {
  chartItems: readonly ChartItem[];
  xAxis: ChartAxis;
  height: number;

  width?: number;
  margin?: Margin;
}

const _BottomDockChart: React.FC<BottomDockChartProps> = observer(
  ({ chartItems, xAxis, parentWidth = 0, width, height, margin }) => {
    return (
      <Chart
        chartItems={chartItems}
        xAxis={xAxis}
        height={height}
        margin={margin}
        width={Math.max(CHART_MIN_WIDTH, width || parentWidth)}
      />
    );
  }
);

export const BottomDockChart = withParentSize(_BottomDockChart);
BottomDockChart.displayName = "BottomDockChart";

const DEFAULT_MARGIN: Margin = { left: 20, right: 30, top: 10, bottom: 50 };

interface ChartProps {
  chartItems: readonly ChartItem[];
  xAxis: ChartAxis;
  width: number;
  height: number;
  margin?: Margin;
}

const Chart: React.FC<ChartProps> = observer(
  ({
    chartItems: propsChartItems,
    xAxis,
    width,
    height,
    margin = DEFAULT_MARGIN
  }) => {
    const [zoomedXScale, setZoomedXScale] = useState<any | undefined>(
      undefined
    );
    const [mouseCoords, setMouseCoords] = useState<
      { x: number; y: number } | undefined
    >(undefined);

    const processedChartItems: ChartItem[] = useMemo(() => {
      return sortChartItemsByType(propsChartItems)
        .filter((chartItem) => chartItem.points.length > 0)
        .map((chartItem) => {
          return {
            ...chartItem,
            points: chartItem.points.slice().sort((p1, p2) => +p1.x - +p2.x)
          };
        });
    }, [propsChartItems]);

    const plotHeight =
      height - margin.top - margin.bottom - Legends.maxHeightPx;

    const yAxes = useMemo(() => {
      const range = [plotHeight, 0];
      const chartItemsByUnit = groupBy(processedChartItems, "units");
      return Object.entries(chartItemsByUnit).map(([units, chartItems]) => {
        return {
          units: units === "undefined" ? undefined : units,
          scale: scaleLinear({ domain: calculateDomainY(chartItems), range }),
          color: chartItems[0].getColor()
        };
      });
    }, [plotHeight, processedChartItems]);

    // We need to consider only the left most Y-axis as its label values appear
    // outside the chart plot area. The labels of inner y-axes appear inside
    // the plot area.
    const estimatedYAxesWidth = useMemo(() => {
      const leftmostYAxis = yAxes[0];
      const maxLabelDigits = Math.max(
        0,
        ...leftmostYAxis.scale
          .ticks(Y_AXIS_NUM_TICKS)
          .map((n) => n.toString().length)
      );
      return maxLabelDigits * Y_AXIS_TICK_LABEL_FONT_SIZE;
    }, [yAxes]);

    const plotWidth = width - margin.left - margin.right - estimatedYAxesWidth;

    const adjustedMargin = useMemo(
      () => ({
        ...margin,
        left: margin.left + estimatedYAxesWidth
      }),
      [estimatedYAxesWidth, margin]
    );

    const initialXScale = useMemo(() => {
      const params = {
        domain: calculateDomainX(processedChartItems),
        range: [0, plotWidth]
      };
      if (xAxis.scale === "linear") return scaleLinear(params);
      else return scaleTime(params);
    }, [xAxis, processedChartItems, plotWidth]);

    const xScale = zoomedXScale || initialXScale;

    const initialScales = processedChartItems.map((c) => ({
      x: initialXScale,
      y: yAxes.find((y) => y.units === c.units)!.scale
    }));

    const zoomedScales = processedChartItems.map((c) => ({
      x: xScale,
      y: yAxes.find((y) => y.units === c.units)!.scale
    }));

    const pointsNearMouse = useMemo(() => {
      if (!mouseCoords) return [];
      return processedChartItems
        .map((chartItem: ChartItem) => ({
          chartItem,
          point: findNearestPoint(chartItem.points, mouseCoords, xScale, 7)
        }))
        .filter(pointNotUndefined);
    }, [processedChartItems, mouseCoords, xScale]);

    const cursorX =
      pointsNearMouse.length > 0
        ? xScale(pointsNearMouse[0].point.x)
        : mouseCoords?.x;

    const tooltip = useMemo(() => {
      const margin = adjustedMargin;
      const tooltip: {
        items: { chartItem: ChartItem; point: ChartPoint }[];
        right?: number;
        left?: number;
        bottom?: number;
      } = {
        items: pointsNearMouse
      };

      if (!mouseCoords || mouseCoords.x < plotWidth * 0.5) {
        tooltip.right = width - (plotWidth + margin.right);
      } else {
        tooltip.left = margin.left;
      }

      tooltip.bottom = height - (margin.top + plotHeight);
      return tooltip;
    }, [
      adjustedMargin,
      pointsNearMouse,
      mouseCoords,
      width,
      plotWidth,
      height,
      plotHeight
    ]);

    const setMouseCoordsFromEvent = (event: any) => {
      const coords = localPoint(
        event.target.ownerSVGElement || event.target,
        event
      );
      if (!coords) return;
      setMouseCoords({
        x: coords.x - adjustedMargin.left,
        y: coords.y - adjustedMargin.top
      });
    };

    useEffect(() => {
      setZoomedXScale(undefined);
    }, [processedChartItems]);

    if (processedChartItems.length === 0)
      return <div className={Styles.empty}>No data available</div>;

    return (
      <ZoomX
        surface="#zoomSurface"
        initialScale={initialXScale}
        scaleExtent={[1, Infinity]}
        translateExtent={[
          [0, 0],
          [Infinity, Infinity]
        ]}
        onZoom={setZoomedXScale}
      >
        <Legends width={plotWidth} chartItems={processedChartItems} />
        <div style={{ position: "relative" }}>
          <svg
            width="100%"
            height={height}
            onMouseMove={setMouseCoordsFromEvent}
            onMouseLeave={() => setMouseCoords(undefined)}
          >
            <Group left={adjustedMargin.left} top={adjustedMargin.top}>
              <RectClipPath
                id="plotClip"
                width={plotWidth}
                height={plotHeight}
              />
              <XAxis
                top={plotHeight + 1}
                scale={xScale}
                label={xAxis.units || (xAxis.scale === "time" ? "Date" : "")}
              />
              {yAxes.map((y, i) => (
                <YAxis
                  {...y}
                  key={`y-axis-${y.units}`}
                  color={yAxes.length > 1 ? y.color : DEFAULT_GRID_COLOR}
                  offset={i * 50}
                />
              ))}
              {yAxes.map((y) => (
                <GridRows
                  key={`grid-${y.units}`}
                  width={plotWidth}
                  height={plotHeight}
                  scale={y.scale}
                  numTicks={Y_AXIS_NUM_TICKS}
                  stroke={yAxes.length > 1 ? y.color : DEFAULT_GRID_COLOR}
                  lineStyle={{ opacity: 0.3 }}
                />
              ))}
              <svg
                id="zoomSurface"
                clipPath="url(#plotClip)"
                pointerEvents="all"
              >
                <rect
                  width={plotWidth}
                  height={plotHeight}
                  fill="transparent"
                />
                {cursorX && <Cursor x={cursorX} stroke={DEFAULT_GRID_COLOR} />}
                <Plot
                  chartItems={processedChartItems}
                  initialScales={initialScales}
                  zoomedScales={zoomedScales}
                />
              </svg>
            </Group>
          </svg>
          <Tooltip {...tooltip} />
          <PointsOnMap chartItems={processedChartItems} />
        </div>
      </ZoomX>
    );
  }
);

Chart.displayName = "Chart";

// Type guard to filter ChartItems that don't produce a nearestPoint
const pointNotUndefined = (itemPoint: {
  chartItem: ChartItem;
  point?: ChartPoint;
}): itemPoint is { chartItem: ChartItem; point: ChartPoint } =>
  itemPoint.point !== undefined;

/**
 * Sorts chartItems so that `momentPoints` are rendered on top then
 * `momentLines` and then any other types.
 * @param {ChartItem[]} chartItems array of chartItems to sort
 */
const sortChartItemsByType = (chartItems: readonly ChartItem[]) => {
  return chartItems.slice().sort((a, b) => {
    if (a.type === "momentPoints") return 1;
    else if (b.type === "momentPoints") return -1;
    else if (a.type === "momentLines") return 1;
    else if (b.type === "momentLines") return -1;
    return 0;
  });
};

/**
 * Calculates a combined domain of all chartItems.
 * Convert Dates to numbers
 */
const calculateDomainX = (chartItems: ChartItem[]) => {
  const xmin = Math.min(...chartItems.map((c) => +c.domain.x[0]));
  const xmax = Math.max(...chartItems.map((c) => +c.domain.x[1]));
  return [xmin, xmax];
};

const calculateDomainY = (chartItems: ChartItem[]) => {
  const ymin = Math.min(...chartItems.map((c) => c.domain.y[0]));
  const ymax = Math.max(...chartItems.map((c) => c.domain.y[1]));
  return [ymin, ymax];
};

const findNearestPoint = (
  points: readonly ChartPoint[],
  coords: ChartPoint,
  xScale: XScale,
  maxDistancePx: number
) => {
  function distance(coords: ChartPoint, point: ChartPoint) {
    // Works with numbers or Dates
    return point ? +coords.x - +xScale(point.x) : Infinity;
  }

  let left = 0;
  let right = points.length;
  let mid = 0;
  for (;;) {
    if (left === right) break;
    mid = left + Math.floor((right - left) / 2);
    if (distance(coords, points[mid]) === 0) break;
    else if (distance(coords, points[mid]) < 0) right = mid;
    else left = mid + 1;
  }

  const leftPoint = points[mid - 1];
  const midPoint = points[mid];
  const rightPoint = points[mid + 1];

  const nearestPoint = minBy([leftPoint, midPoint, rightPoint], (p) =>
    p ? Math.abs(distance(coords, p)) : Infinity
  );

  return nearestPoint !== undefined &&
    Math.abs(distance(coords, nearestPoint)) <= maxDistancePx
    ? nearestPoint
    : undefined;
};
