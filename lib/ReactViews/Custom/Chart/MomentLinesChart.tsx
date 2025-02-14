import { observer } from "mobx-react";
import { makeObservable } from "mobx";
import { Line } from "@visx/shape";
import React from "react";
import { ChartItem } from "../../../ModelMixins/ChartableMixin";

interface MomentLinesProps {
  id: string;
  chartItem: ChartItem;
  scales: any;
}

@observer
class MomentLines extends React.Component<MomentLinesProps> {
  constructor(props: MomentLinesProps) {
    super(props);
    makeObservable(this);
  }

  doZoom(scales: any) {
    const lines = document.querySelectorAll(`g#${this.props.id} line`);
    lines.forEach((line, i) => {
      const point = this.props.chartItem.points[i];
      if (point) {
        const x = scales.x(point.x);
        line.setAttribute("x1", x);
        line.setAttribute("x2", x);
      }
    });
  }

  render() {
    const { id, chartItem, scales } = this.props;
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
  }
}

export default MomentLines;
