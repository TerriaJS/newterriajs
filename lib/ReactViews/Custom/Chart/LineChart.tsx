import { LinePath } from "@visx/shape";
import { line } from "d3-shape";
import React from "react";
import { observer } from "mobx-react";
import { makeObservable } from "mobx";

type ItemType = any;

interface LineChartProps {
  id: string;
  chartItem: ItemType;
  scales: { x: (p: number) => number; y: (p: number) => number };
  color?: string;
}

@observer
class LineChart extends React.PureComponent<LineChartProps> {
  constructor(props: LineChartProps) {
    super(props);
    makeObservable(this);
  }

  doZoom(scales: any) {
    const el = document.querySelector(`#${this.props.id} path`);
    if (!el) return;
    const { chartItem } = this.props;
    const area = line()
      .x((p: any) => scales.x(p.x))
      .y((p: any) => scales.y(p.y))(chartItem.points);
    if (!area) return;
    el.setAttribute("d", area);
  }

  render() {
    const { chartItem, scales, color } = this.props;
    const stroke = color || chartItem.getColor();
    return (
      <g id={this.props.id}>
        <LinePath
          data={chartItem.points}
          x={(p: any) => scales.x(p.x)}
          y={(p: any) => scales.y(p.y)}
          stroke={stroke}
          strokeWidth={2}
        />
      </g>
    );
  }
}

export default LineChart;
