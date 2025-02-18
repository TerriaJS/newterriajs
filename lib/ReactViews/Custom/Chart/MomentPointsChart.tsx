import { GlyphCircle } from "@visx/glyph";
import { scaleLinear } from "@visx/scale";
import { interpolateNumber as d3InterpolateNumber } from "d3-interpolate";
import { observer } from "mobx-react";
import { Ref, forwardRef, useImperativeHandle, useMemo } from "react";
import { ChartPoint } from "../../../Charts/ChartData";
import { ChartItem } from "../../../ModelMixins/ChartableMixin";
import Glyphs from "./Glyphs";

interface Props {
  id: string;
  chartItem: ChartItem;
  basisItem?: ChartItem;
  basisItemScales?: { x: any; y: any };
  scales: { x: any; y: any };
  glyph?: string;
}

export type ChartZoomFunction = (scales: {
  x: (arg0: number | Date) => number;
  y: (arg0: number) => number;
}) => void;

const _MomentPointsChart = function MomentPointsChart(
  props: Props,
  ref: Ref<{ doZoom: ChartZoomFunction }>
) {
  const {
    id,
    chartItem,
    basisItem,
    basisItemScales,
    scales,
    glyph = "circle"
  } = props;

  const points = useMemo(() => {
    if (basisItem && basisItemScales) {
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
  }, [chartItem, basisItem, basisItemScales, scales]);

  // Allow BottomDockChart and others to control zoom
  useImperativeHandle(
    ref,
    () => ({
      doZoom(scales) {
        if (points.length === 0) {
          return;
        }
        const vGlyphs = document.querySelectorAll(`g#${id} > g.visx-glyph`);
        vGlyphs.forEach((vGlyph, i) => {
          const point = points[i];
          if (point) {
            const left = scales.x(point.x);
            const top = scales.y(point.y);
            const scale = point.isSelected ? "scale(1.4, 1.4)" : "";
            vGlyph.setAttribute(
              "transform",
              `translate(${left}, ${top}) ${scale}`
            );
            vGlyph.setAttribute(
              "fill-opacity",
              `${point.isSelected ? 1.0 : 0.3}`
            );
          }
        });
      }
    }),
    [id, points]
  );

  const baseKey = `moment-point-${chartItem.categoryName}-${chartItem.name}`;
  const fillColor = chartItem.getColor();
  const isClickable = chartItem.onClick !== undefined;
  const clickProps = (point: typeof points[0]) => {
    if (isClickable) {
      return {
        pointerEvents: "all",
        cursor: "pointer",
        onClick: () => chartItem.onClick(point)
      };
    }
    return {};
  };
  const Glyph = Glyphs[glyph as keyof typeof Glyphs] ?? GlyphCircle;
  return (
    <g id={id}>
      {points.map((p, i) => (
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
};

/** Interpolates the given source point {x, y} to the closet point in the `sortedPoints` array.
 *
 * The source point and `sortedBasisPoints` may be of different scale, so we use `basisToSourceScale`
 * to generate a point in the original source items scale.
 */
function interpolate(
  p: ChartPoint,
  sortedBasisPoints: ChartPoint[],
  basisToSourceScale: ReturnType<typeof scaleLinear>
) {
  // MomentPointsChart always has Dates for x coordinates
  const x = p.x as Date;
  const closest = closestPointIndex(x, sortedBasisPoints);
  if (closest === undefined) {
    return p;
  }

  const a = sortedBasisPoints[closest];
  const b = sortedBasisPoints[closest + 1];
  if (a === undefined || b === undefined) {
    return p;
  }

  const aTime = (a.x as Date).getTime();
  const bTime = (b.x as Date).getTime();
  const xAsPercentage = (x.getTime() - aTime) / (bTime - aTime);

  const interpolated = {
    x,
    y: d3InterpolateNumber(
      basisToSourceScale(a.y) as number,
      basisToSourceScale(b.y) as number
    )(xAsPercentage)
  };
  return interpolated;
}

function closestPointIndex(x: Date, sortedPoints: ChartPoint[]) {
  for (let i = 0; i < sortedPoints.length; i++) {
    if ((sortedPoints[i].x as Date).getTime() >= x.getTime()) {
      if (i === 0) return 0;
      return i - 1;
    }
  }
  return;
}

export default observer(forwardRef(_MomentPointsChart));
