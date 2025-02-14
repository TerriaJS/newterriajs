import { observer } from "mobx-react";
import { makeObservable } from "mobx";
import { type ZoomBehavior, type ZoomScale, zoom as d3Zoom } from "d3-zoom";
import { select as d3Select } from "d3-selection";
import React, { type ReactNode } from "react";

interface ZoomXProps {
  initialScale: ZoomScale;
  scaleExtent: [number, number];
  translateExtent: [[number, number], [number, number]];
  children?: ReactNode;
  onZoom: (s: ZoomScale) => void;
  surface: string; // selector for querying the zoom surface
}

@observer
class ZoomX extends React.Component<ZoomXProps> {
  readonly zoom: ZoomBehavior<any, any>;

  constructor(props: ZoomXProps) {
    super(props);
    this.zoom = d3Zoom()
      .scaleExtent(props.scaleExtent)
      .translateExtent(props.translateExtent)
      .on("zoom", (event) => {
        props.onZoom(event.transform.rescaleX(this.props.initialScale));
      });
    makeObservable(this);
  }

  componentDidMount() {
    d3Select(this.props.surface).call(this.zoom);
  }

  render() {
    return this.props.children;
  }
}

export default ZoomX;
