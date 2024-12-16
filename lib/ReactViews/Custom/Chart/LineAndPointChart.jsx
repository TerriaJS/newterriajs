import PropTypes from "prop-types";
import React from "react";
import LineChart from "./LineChart";
import MomentPointsChart from "./MomentPointsChart";

/**
 * A line chart, where each data point is represented by a circle, and a line is
 * drawn between each point.
 */
export default class LineAndPointChart extends React.PureComponent {
  static propTypes = {
    id: PropTypes.string.isRequired,
    chartItem: PropTypes.object.isRequired,
    scales: PropTypes.object.isRequired,
    color: PropTypes.string,
    glyph: PropTypes.string
  };

  constructor(props) {
    super(props);
    this.lineRef = React.createRef();
    this.pointRef = React.createRef();
  }

  doZoom(scales) {
    this.lineRef.current.doZoom(scales);
    this.pointRef.current.doZoom(scales);
  }

  render() {
    return (
      <>
        <LineChart
          ref={this.lineRef}
          chartItem={this.props.chartItem}
          scales={this.props.scales}
          color={this.props.color}
          id={this.props.id + "-line"}
        />
        <MomentPointsChart
          ref={this.pointRef}
          id={this.props.id + "-point"}
          chartItem={this.props.chartItem}
          scales={this.props.scales}
          glyph={this.props.glyph}
        />
      </>
    );
  }
}
