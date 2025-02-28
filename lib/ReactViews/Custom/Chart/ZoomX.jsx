import { observer } from "mobx-react";
import { zoom as d3Zoom } from "d3-zoom";
import { select as d3Select } from "d3-selection";
import PropTypes from "prop-types";
import { Component } from "react";

@observer
class ZoomX extends Component {
  static propTypes = {
    initialScale: PropTypes.func.isRequired,
    scaleExtent: PropTypes.array.isRequired,
    translateExtent: PropTypes.array.isRequired,
    children: PropTypes.node,
    onZoom: PropTypes.func.isRequired,
    surface: PropTypes.string.isRequired // selector for querying the zoom surface
  };

  constructor(props) {
    super(props);
    this.zoom = d3Zoom()
      .scaleExtent(props.scaleExtent)
      .translateExtent(props.translateExtent)
      .on("zoom", (event) => {
        props.onZoom(event.transform.rescaleX(this.props.initialScale));
      });
  }

  componentDidMount() {
    d3Select(this.props.surface).call(this.zoom);
  }

  render() {
    return this.props.children;
  }
}

export default ZoomX;
