import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";
import { withParentSize } from "@vx/responsive";
import { scaleLinear, scaleTime } from "@visx/scale";
import { computed } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import { Component } from "react";
import ChartableMixin from "../../../ModelMixins/ChartableMixin";
import Styles from "./chart-preview.scss";
import LineChart from "./LineChart";
import styled from "styled-components";
import i18next from "i18next";

@withParentSize
@observer
class FeatureInfoPanelChart extends Component {
  static propTypes = {
    parentWidth: PropTypes.number,
    parentHeight: PropTypes.number,
    width: PropTypes.number,
    height: PropTypes.number.isRequired,
    margin: PropTypes.object,
    item: PropTypes.object.isRequired,
    xAxisLabel: PropTypes.string,
    baseColor: PropTypes.string
  };

  static defaultProps = {
    parentWidth: 0,
    parentHeight: 0,
    baseColor: "#efefef",
    margin: { top: 5, left: 5, right: 5, bottom: 5 }
  };

  @computed
  get chartItem() {
    return this.props.item.chartItems.find(
      chartItem =>
        chartItem.type === "line" || chartItem.type === "lineAndPoint"
    );
  }

  async componentDidUpdate() {
    (await this.props.item.loadMapItems()).raiseError(
      this.props.item.terria,
      `Failed to load chart for ${this.props.item.name}`
    );
  }

  async componentDidMount() {
    (await this.props.item.loadMapItems()).raiseError(
      this.props.item.terria,
      `Failed to load chart for ${this.props.item.name}`
    );
  }

  render() {
    const catalogItem = this.props.item;
    const height = this.props.height || this.props.parentHeight;
    const width = this.props.width || this.props.parentWidth;
    if (!ChartableMixin.isMixedInto(catalogItem)) {
      return (
        <ChartStatusText width={width} height={height}>
          {i18next.t("chart.noData")}
        </ChartStatusText>
      );
    } else if (!this.chartItem && catalogItem.isLoadingMapItems) {
      return (
        <ChartStatusText width={width} height={height}>
          {i18next.t("chart.loading")}
        </ChartStatusText>
      );
    } else if (!this.chartItem || this.chartItem.points.length === 0) {
      return (
        <ChartStatusText width={width} height={height}>
          {i18next.t("chart.noData")}
        </ChartStatusText>
      );
    }

    return (
      <div className={Styles.previewChart}>
        <Chart
          width={width}
          height={height}
          margin={this.props.margin}
          chartItem={this.chartItem}
          baseColor={this.props.baseColor}
          xAxisLabel={this.props.xAxisLabel}
        />
      </div>
    );
  }
}

@observer
class Chart extends Component {
  static propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    margin: PropTypes.object.isRequired,
    chartItem: PropTypes.object.isRequired,
    baseColor: PropTypes.string.isRequired,
    xAxisLabel: PropTypes.string
  };

  xAxisHeight = 30;
  yAxisWidth = 10;

  @computed
  get plot() {
    const { width, height, margin } = this.props;
    return {
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom - this.xAxisHeight
    };
  }

  @computed
  get scales() {
    const chartItem = this.props.chartItem;
    const xScaleParams = {
      domain: chartItem.domain.x,
      range: [this.props.margin.left + this.yAxisWidth, this.plot.width]
    };
    const yScaleParams = {
      domain: chartItem.domain.y,
      range: [this.plot.height, 0]
    };
    return {
      x:
        chartItem.xAxis.scale === "linear"
          ? scaleLinear(xScaleParams)
          : scaleTime(xScaleParams),
      y: scaleLinear(yScaleParams)
    };
  }

  render() {
    const { height, margin, chartItem, baseColor } = this.props;

    // Make sure points are asc sorted by x value
    chartItem.points = chartItem.points.sort(
      (a, b) => this.scales.x(a.x) - this.scales.x(b.x)
    );

    const id = `featureInfoPanelChart-${chartItem.name}`;
    const textStyle = {
      fill: baseColor,
      fontSize: 10,
      textAnchor: "middle",
      fontFamily: "Arial"
    };
    return (
      <svg width="100%" height={height}>
        <Group top={margin.top} left={margin.left}>
          <AxisBottom
            top={this.plot.height}
            // .nice() rounds the scale so that the aprox beginning and
            // aprox end labels are shown
            // See: https://stackoverflow.com/questions/21753126/d3-js-starting-and-ending-tick
            scale={this.scales.x.nice()}
            numTicks={4}
            stroke="#a0a0a0"
            tickStroke="#a0a0a0"
            tickLabelProps={(value, i, ticks) => {
              // To prevent the first and last values from getting clipped,
              // we position the first label text to start at the tick position
              // and the last label text to finish at the tick position. For all
              // others, middle of the text will coincide with the tick position.
              const textAnchor =
                i === 0 ? "start" : i === ticks.length - 1 ? "end" : "middle";
              return {
                ...textStyle,
                textAnchor
              };
            }}
            label={this.props.xAxisLabel}
            labelOffset={3}
            labelProps={textStyle}
          />
          <AxisLeft
            scale={this.scales.y}
            numTicks={4}
            stroke="none"
            tickStroke="none"
            label={chartItem.units}
            labelOffset={24}
            labelProps={textStyle}
            tickLabelProps={() => ({
              ...textStyle,
              textAnchor: "start",
              dx: "0.5em",
              dy: "0.25em"
            })}
          />
          <LineChart
            id={id}
            chartItem={chartItem}
            scales={this.scales}
            color={baseColor}
          />
        </Group>
      </svg>
    );
  }
}

const ChartStatusText = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${p => p.width}px;
  height: ${p => p.height}px;
`;

export default FeatureInfoPanelChart;
