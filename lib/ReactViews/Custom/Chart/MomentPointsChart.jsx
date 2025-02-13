import { scaleLinear } from "@visx/scale";
import { interpolateNumber as d3InterpolateNumber } from "d3-interpolate";
import { computed, makeObservable } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import { Component } from "react";
import Glyphs from "./Glyphs";
import { GlyphCircle } from "@visx/glyph";

@observer
class MomentPointsChart extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    chartItem: PropTypes.object.isRequired,
    basisItem: PropTypes.object,
    basisItemScales: PropTypes.object,
    scales: PropTypes.object.isRequired,
    glyph: PropTypes.string
  };

  static defaultProps = {
    glyph: "circle"
  };

  constructor(props) {
    super(props);
    makeObservable(this);
  }

  @computed
  get points() {
    const { chartItem, basisItem, basisItemScales, scales } = this.props;
    if (basisItem) {
      // We want to stick the chartItem points to the basis item, to do this we
      // interpolate the chart item points to match the basis item points. This
      // interpolation should not affect the scale of the chart item points.
      const basisToSourceScale = scaleLinear({
        domain: basisItemScales.y.domain(),
        range: scales.y.domain()
      });
      const interpolatedPoints = chartItem.points.map((p) => ({
        ...p,
        ...interpolate(p, basisItem.points, basisToSourceScale)
      }));
      return interpolatedPoints;
    }
    return chartItem.points;
  }

  doZoom(scales) {
    const points = this.points;
    if (points.length === 0) {
      return;
    }
    const glyphs = document.querySelectorAll(
      `g#${this.props.id} > g.visx-glyph`
    );
    glyphs.forEach((glyph, i) => {
      const point = points[i];
      if (point) {
        const left = scales.x(point.x);
        const top = scales.y(point.y);
        const scale = point.isSelected ? "scale(1.4, 1.4)" : "";
        glyph.setAttribute("transform", `translate(${left}, ${top}) ${scale}`);
        glyph.setAttribute("fill-opacity", point.isSelected ? 1.0 : 0.3);
      }
    });
  }

  render() {
    const { id, chartItem, scales, glyph } = this.props;
    const baseKey = `moment-point-${chartItem.categoryName}-${chartItem.name}`;
    const fillColor = chartItem.getColor();
    const isClickable = chartItem.onClick !== undefined;
    const clickProps = (point) => {
      if (isClickable) {
        return {
          pointerEvents: "all",
          cursor: "pointer",
          onClick: () => chartItem.onClick(point)
        };
      }
      return {};
    };
    const Glyph = Glyphs[glyph] ?? GlyphCircle;
    return (
      <g id={id}>
        {this.points.map((p, i) => (
          <Glyph
            key={`${baseKey}-${i}`}
            left={scales.x(p.x)}
            top={scales.y(p.y)}
            size={100}
            fill={fillColor}
            fillOpacity={p.isSelected ? 1.0 : 0.3}
            {...clickProps(p)}
          />
        ))}
      </g>
    );
  }
}

/** Interpolates the given source point {x, y} to the closet point in the `sortedPoints` array.
 *
 * The source point and `sortedBasisPoints` may be of different scale, so we use `basisToSourceScale`
 * to generate a point in the original source items scale.
 */
function interpolate({ x, y }, sortedBasisPoints, basisToSourceScale) {
  const closest = closestPointIndex(x, sortedBasisPoints);
  if (closest === undefined) {
    return { x, y };
  }

  const a = sortedBasisPoints[closest];
  const b = sortedBasisPoints[closest + 1];
  if (a === undefined || b === undefined) {
    return { x, y };
  }

  const xAsPercentage =
    (x.getTime() - a.x.getTime()) / (b.x.getTime() - a.x.getTime());

  const interpolated = {
    x,
    y: d3InterpolateNumber(
      basisToSourceScale(a.y),
      basisToSourceScale(b.y)
    )(xAsPercentage)
  };
  return interpolated;
}

function closestPointIndex(x, sortedPoints) {
  for (let i = 0; i < sortedPoints.length; i++) {
    if (sortedPoints[i].x.getTime() >= x.getTime()) {
      if (i === 0) return 0;
      return i - 1;
    }
  }
}

export default MomentPointsChart;
