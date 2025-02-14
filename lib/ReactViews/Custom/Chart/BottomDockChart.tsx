import { observer } from "mobx-react";
import { action, computed, observable, makeObservable } from "mobx";
import { AxisLeft, AxisBottom } from "@visx/axis";
import { RectClipPath } from "@visx/clip-path";
import { localPoint } from "@visx/event";
import { GridRows } from "@visx/grid";
import { Group } from "@visx/group";
import { withParentSize } from "@visx/responsive";
import { scaleLinear, scaleTime } from "@visx/scale";
import { Line } from "@visx/shape";
import type { ZoomScale } from "d3-zoom";
import React, { type MouseEvent, type RefObject } from "react";
import groupBy from "lodash-es/groupBy";
import minBy from "lodash-es/minBy";
import Legends from "./Legends";
import LineChart from "./LineChart";
import MomentLinesChart from "./MomentLinesChart";
import MomentPointsChart from "./MomentPointsChart";
import Tooltip from "./Tooltip";
import ZoomX from "./ZoomX";
import Styles from "./bottom-dock-chart.scss";
import LineAndPointChart from "./LineAndPointChart";
import PointOnMap from "./PointOnMap";
import { ChartItem } from "../../../ModelMixins/ChartableMixin";
import Terria from "../../../Models/Terria";
import isDefined from "../../../Core/isDefined";

const chartMinWidth = 110;
const defaultGridColor = "#efefef";
const labelColor = "#efefef";

type MouseCoords = { x: number; y: number };

interface BottomDockChartProps {
  terria: Terria;
  parentWidth: number;
  width?: number;
  height: number;
  chartItems: ChartItem[];
  xAxis: any; // object
  margin?: { left: number; right: number; top: number; bottom: number };
}

@observer
class BottomDockChart extends React.Component<BottomDockChartProps> {
  static defaultProps = {
    parentWidth: 0
  };

  constructor(props: BottomDockChartProps) {
    super(props);
    makeObservable(this);
  }

  render() {
    return (
      <Chart
        {...this.props}
        width={Math.max(
          chartMinWidth,
          this.props.width || this.props.parentWidth
        )}
      />
    );
  }
}

export default withParentSize(BottomDockChart);

interface ChartProps {
  terria: Terria;
  width: number;
  height: number;
  chartItems: ChartItem[];
  xAxis: any; // object
  margin: { left: number; right: number; top: number; bottom: number };
}

@observer
class Chart extends React.Component<ChartProps> {
  static defaultProps = {
    margin: { left: 20, right: 30, top: 10, bottom: 50 }
  };

  @observable.ref zoomedXScale: ZoomScale | undefined;
  @observable mouseCoords: MouseCoords | undefined;

  constructor(props: ChartProps) {
    super(props);
    makeObservable(this);
  }

  @computed
  get chartItems() {
    return sortChartItemsByType(this.props.chartItems)
      .map((chartItem) => {
        return {
          ...chartItem,
          points: chartItem.points.sort((p1: any, p2: any) => p1.x - p2.x)
        };
      })
      .filter((chartItem) => chartItem.points.length > 0);
  }

  @computed
  get plotHeight() {
    const { height, margin } = this.props;
    return height - margin.top - margin.bottom - Legends.maxHeightPx;
  }

  @computed
  get plotWidth() {
    const { width, margin } = this.props;
    return width - margin.left - margin.right - this.estimatedYAxesWidth;
  }

  @computed
  get adjustedMargin() {
    const margin = this.props.margin;
    return {
      ...margin,
      left: margin.left + this.estimatedYAxesWidth
    };
  }

  @computed
  get initialXScale() {
    const xAxis = this.props.xAxis;
    const domain = calculateDomain(this.chartItems);
    const params = {
      domain: domain.x,
      range: [0, this.plotWidth]
    };
    if (xAxis.scale === "linear") return scaleLinear(params);
    else return scaleTime(params);
  }

  @computed
  get xScale(): ZoomScale {
    return this.zoomedXScale || this.initialXScale;
  }

  @computed
  get yAxes() {
    const range = [this.plotHeight, 0];
    const chartItemsByUnit = groupBy(this.chartItems, "units");
    return Object.entries(chartItemsByUnit).map(([units, chartItems]) => {
      return {
        units: units === "undefined" ? undefined : units,
        scale: scaleLinear({ domain: calculateDomain(chartItems).y, range }),
        color: chartItems[0].getColor()
      };
    });
  }

  @computed
  get initialScales() {
    return this.chartItems.map((c) => ({
      x: this.initialXScale,
      y: this.yAxes.find((y) => y.units === c.units)?.scale
    }));
  }

  @computed
  get zoomedScales() {
    return this.chartItems.map((c) => ({
      x: this.xScale,
      y: this.yAxes.find((y) => y.units === c.units)?.scale
    }));
  }

  @computed
  get cursorX() {
    if (this.pointsNearMouse.length > 0)
      // @ts-expect-error xScale is not a function.
      return this.xScale(this.pointsNearMouse[0].point.x);
    return this.mouseCoords && this.mouseCoords.x;
  }

  @computed
  get pointsNearMouse() {
    const coords = this.mouseCoords;
    if (!isDefined(coords)) return [];
    return this.chartItems
      .map((chartItem) => ({
        chartItem,
        point: findNearestPoint(chartItem.points, coords, this.xScale, 7)
      }))
      .filter(({ point }) => point !== undefined);
  }

  @computed
  get tooltip() {
    const margin = this.adjustedMargin;
    const tooltipCommon = {
      items: this.pointsNearMouse,
      bottom: this.props.height - (margin.top + this.plotHeight)
    };

    if (!this.mouseCoords || this.mouseCoords.x < this.plotWidth * 0.5) {
      return {
        right: this.props.width - (this.plotWidth + margin.right),
        ...tooltipCommon
      };
    }
    return { left: margin.left, ...tooltipCommon };
  }

  @computed
  get estimatedYAxesWidth() {
    const numTicks = 4;
    const tickLabelFontSize = 10;
    // We need to consider only the left most Y-axis as its label values appear
    // outside the chart plot area. The labels of inner y-axes appear inside
    // the plot area.
    const leftmostYAxis = this.yAxes[0];
    const maxLabelDigits = Math.max(
      0,
      ...leftmostYAxis.scale.ticks(numTicks).map((n) => n.toString().length)
    );
    return maxLabelDigits * tickLabelFontSize;
  }

  @action
  setZoomedXScale(scale: ZoomScale | undefined) {
    this.zoomedXScale = scale;
  }

  @action
  setMouseCoords(coords: MouseCoords | undefined) {
    this.mouseCoords = coords;
  }

  setMouseCoordsFromEvent(event: MouseEvent<SVGSVGElement>) {
    const coords = localPoint(
      // @ts-expect-error no ownerSVGElement.
      event.target.ownerSVGElement || event.target,
      event
    );
    if (!coords) return;
    this.setMouseCoords({
      x: coords.x - this.adjustedMargin.left,
      y: coords.y - this.adjustedMargin.top
    });
  }

  componentDidUpdate(prevProps: ChartProps) {
    // Unset zoom scale if any chartItems are added or removed
    if (prevProps.chartItems.length !== this.props.chartItems.length) {
      this.setZoomedXScale(undefined);
    }
  }

  render() {
    const { height, xAxis, terria } = this.props;
    if (this.chartItems.length === 0)
      return <div className={Styles.empty}>No data available</div>;

    return (
      <ZoomX
        surface="#zoomSurface"
        initialScale={this.initialXScale}
        scaleExtent={[1, Infinity]}
        translateExtent={[
          [0, 0],
          [Infinity, Infinity]
        ]}
        onZoom={(zoomedScale) => this.setZoomedXScale(zoomedScale)}
      >
        <Legends width={this.plotWidth} chartItems={this.chartItems} />
        <div style={{ position: "relative" }}>
          <svg
            width="100%"
            height={height}
            onMouseMove={this.setMouseCoordsFromEvent.bind(this)}
            onMouseLeave={() => this.setMouseCoords(undefined)}
          >
            <Group
              left={this.adjustedMargin.left}
              top={this.adjustedMargin.top}
            >
              <RectClipPath
                id="plotClip"
                width={this.plotWidth}
                height={this.plotHeight}
              />
              <XAxis
                top={this.plotHeight + 1}
                scale={this.xScale}
                label={xAxis.units || (xAxis.scale === "time" && "Date")}
              />
              {this.yAxes.map((y, i) => (
                <YAxis
                  {...y}
                  key={`y-axis-${y.units}`}
                  color={this.yAxes.length > 1 ? y.color : defaultGridColor}
                  offset={i * 50}
                />
              ))}
              {this.yAxes.map((y, _i) => (
                <GridRows
                  key={`grid-${y.units}`}
                  width={this.plotWidth}
                  height={this.plotHeight}
                  scale={y.scale}
                  numTicks={4}
                  stroke={this.yAxes.length > 1 ? y.color : defaultGridColor}
                  lineStyle={{ opacity: 0.3 }}
                />
              ))}
              <svg
                id="zoomSurface"
                clipPath="url(#plotClip)"
                pointerEvents="all"
              >
                <rect
                  width={this.plotWidth}
                  height={this.plotHeight}
                  fill="transparent"
                />
                {this.cursorX && (
                  <Cursor x={this.cursorX} stroke={defaultGridColor} />
                )}
                <Plot
                  chartItems={this.chartItems}
                  initialScales={this.initialScales}
                  zoomedScales={this.zoomedScales}
                />
              </svg>
            </Group>
          </svg>
          <Tooltip {...this.tooltip} />
          {this.chartItems.map((chartItem: ChartItem) =>
            pointOnMap(terria, chartItem)
          )}
        </div>
      </ZoomX>
    );
  }
}

interface PlotProps {
  chartItems: ChartItem[];
  initialScales: any[];
  zoomedScales: any[];
}

@observer
class Plot extends React.Component<PlotProps> {
  constructor(props: PlotProps) {
    super(props);
    makeObservable(this);
  }

  // FIXME: real return type is LegacyRef<T>[].
  @computed
  get chartRefs(): RefObject<any>[] {
    return this.props.chartItems.map((_) => React.createRef());
  }

  componentDidUpdate() {
    Object.values(this.chartRefs).forEach(({ current: ref }, i) => {
      if (typeof ref.doZoom === "function") {
        ref.doZoom(this.props.zoomedScales[i]);
      }
    });
  }

  render() {
    const { chartItems, initialScales } = this.props;
    return chartItems.map((chartItem, i) => {
      switch (chartItem.type) {
        case "line":
          return (
            <LineChart
              key={chartItem.key}
              ref={this.chartRefs[i]}
              id={sanitizeIdString(chartItem.key)}
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
              ref={this.chartRefs[i]}
              id={sanitizeIdString(chartItem.key)}
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
              ref={this.chartRefs[i]}
              id={sanitizeIdString(chartItem.key)}
              chartItem={chartItem}
              scales={initialScales[i]}
            />
          );
        }
        case "lineAndPoint": {
          return (
            <LineAndPointChart
              key={chartItem.key}
              ref={this.chartRefs[i]}
              id={sanitizeIdString(chartItem.key)}
              chartItem={chartItem}
              scales={initialScales[i]}
              glyph={chartItem.glyphStyle}
            />
          );
        }
      }
    });
  }
}

interface XAxisProps {
  top: number;
  scale: any; // func
  label: string;
}

class XAxis extends React.PureComponent<XAxisProps> {
  render() {
    const { scale, children, ...restProps } = this.props;
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
          fill: labelColor,
          fontSize: 12,
          textAnchor: "middle",
          fontFamily: "Arial"
        }}
        // .nice() rounds the scale so that the approximate beginning and end
        // labels are shown.
        // See: https://stackoverflow.com/questions/21753126/d3-js-starting-and-ending-tick
        scale={scale.nice()}
        // @ts-expect-error Wrong type for children in AxisProps vs React.
        children={children} // eslint-disable-line react/no-children-prop
        {...restProps}
      />
    );
  }
}

interface YAxisProps {
  scale: any; // func
  color: string;
  units?: string;
  offset: number;
}

class YAxis extends React.PureComponent<YAxisProps> {
  render() {
    const { scale, color, units, offset } = this.props;
    return (
      <AxisLeft
        key={`y-axis-${units}`}
        left={offset}
        scale={scale}
        numTicks={4}
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
          fontSize: 10,
          fontFamily: "Arial"
        })}
      />
    );
  }
}

interface CursorProps {
  x: number;
  stroke: string;
}

class Cursor extends React.PureComponent<CursorProps> {
  render() {
    const { x, ...rest } = this.props;
    return <Line from={{ x, y: 0 }} to={{ x, y: 1000 }} {...rest} />;
  }
}

function pointOnMap(terria: Terria, chartItem: ChartItem) {
  return chartItem.pointOnMap ? (
    <PointOnMap
      key={`point-on-map-${chartItem.key}`}
      terria={terria}
      color={chartItem.getColor()}
      point={chartItem.pointOnMap}
    />
  ) : null;
}

/**
 * Calculates a combined domain of all chartItems.
 */
function calculateDomain(chartItems: ChartItem[]) {
  // @ts-expect-error number | Date not assignable to number.
  const xmin = Math.min(...chartItems.map((c) => c.domain.x[0]));
  // @ts-expect-error number | Date not assignable to number.
  const xmax = Math.max(...chartItems.map((c) => c.domain.x[1]));
  const ymin = Math.min(...chartItems.map((c) => c.domain.y[0]));
  const ymax = Math.max(...chartItems.map((c) => c.domain.y[1]));
  return {
    x: [xmin, xmax],
    y: [ymin, ymax]
  };
}

/**
 * Sorts chartItems so that `momentPoints` are rendered on top then
 * `momentLines` and then any other types.
 * @param chartItems array of chartItems to sort
 */
function sortChartItemsByType(chartItems: ChartItem[]) {
  return chartItems.slice().sort((a, b) => {
    if (a.type === "momentPoints") return 1;
    else if (b.type === "momentPoints") return -1;
    else if (a.type === "momentLines") return 1;
    else if (b.type === "momentLines") return -1;
    return 0;
  });
}

function findNearestPoint(
  points: any[],
  coords: MouseCoords,
  xScale: ZoomScale,
  maxDistancePx: number
) {
  function distance(coords: MouseCoords, point: any) {
    // @ts-expect-error xScale is not a function.
    return point ? coords.x - xScale(point.x) : Infinity;
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

  return Math.abs(distance(coords, nearestPoint)) <= maxDistancePx
    ? nearestPoint
    : undefined;
}

function sanitizeIdString(id: string) {
  // delete all non-alphanum chars
  return id.replace(/[^a-zA-Z0-9_-]/g, "");
}
