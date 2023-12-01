import { Line } from "@visx/shape";
import { observer } from "mobx-react";
import { Ref, forwardRef, useImperativeHandle } from "react";
import type { ChartItem } from "../../../ModelMixins/ChartableMixin";
import type { ChartZoomHandle, Scales } from "./types";

interface Props {
  id: string;
  chartItem: ChartItem;
  scales: Scales;
}

const _MomentLines = function MomentLines(
  props: Props,
  ref: Ref<ChartZoomHandle>
) {
  const { id, chartItem, scales } = props;
  useImperativeHandle(
    ref,
    () => ({
      doZoom(scales) {
        const lines = document.querySelectorAll(`g#${id} line`);
        lines.forEach((line, i) => {
          const point = chartItem.points[i];
          if (point) {
            const x = scales.x(point.x);
            line.setAttribute("x1", x.toString());
            line.setAttribute("x2", x.toString());
          }
        });
      }
    }),
    [id, chartItem]
  );

  const baseKey = `moment-line-${chartItem.categoryName}-${chartItem.name}`;
  return (
    <g id={id}>
      {chartItem.points.map((p, i) => {
        const x = scales.x(p.x);
        const y = scales.y(0);
        return (
          <Line
            key={`${baseKey}-${i}`}
            from={{ x, y: 0 }}
            to={{ x, y }}
            stroke={chartItem.getColor()}
            strokeWidth={3}
            opacity={p.isSelected ? 1.0 : 0.3}
            pointerEvents="all"
            cursor="pointer"
            onClick={() => chartItem.onClick(p)}
          />
        );
      })}
    </g>
  );
};

export default observer(forwardRef(_MomentLines));
