import { observer } from "mobx-react";
import { forwardRef, useImperativeHandle, useRef } from "react";
import type { ChartItem } from "../../../ModelMixins/ChartableMixin";
import LineChart from "./LineChart";
import MomentPointsChart from "./MomentPointsChart";
import type { ChartZoomHandle, Scales } from "./types";

interface Props {
  id: string;
  chartItem: ChartItem;
  scales: Scales;
  color?: string;
  glyph?: string;
}

/**
 * A line chart, where each data point is represented by a circle, and a line is
 * drawn between each point.
 */
export const _LineAndPointChart = forwardRef<ChartZoomHandle, Props>(
  ({ id, chartItem, scales, color, glyph }, ref) => {
    const lineRef = useRef<ChartZoomHandle>(null);
    const pointRef = useRef<ChartZoomHandle>(null);

    useImperativeHandle(
      ref,
      () => ({
        doZoom(scales) {
          lineRef.current?.doZoom(scales);
          pointRef.current?.doZoom(scales);
        }
      }),
      []
    );

    return (
      <>
        <LineChart
          ref={lineRef}
          chartItem={chartItem}
          scales={scales}
          color={color}
          id={id + "-line"}
        />
        <MomentPointsChart
          ref={pointRef}
          id={id + "-point"}
          chartItem={chartItem}
          scales={scales}
          glyph={glyph}
        />
      </>
    );
  }
);

_LineAndPointChart.displayName = "LineAndPointChart";

export default observer(_LineAndPointChart);
