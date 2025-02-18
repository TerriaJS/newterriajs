import { scaleLinear, scaleTime } from "@visx/scale";
import { Glyph, GlyphSquare } from "@visx/glyph";
import maxBy from "lodash-es/maxBy";
import minBy from "lodash-es/minBy";
import React from "react";
import TestRenderer from "react-test-renderer";
import MomentPointsChart from "../../../../lib/ReactViews/Custom/Chart/MomentPointsChart";
import type { ChartItem } from "../../../../lib/ModelMixins/ChartableMixin";

describe("MomentPointsChart", function () {
  const chartItem: ChartItem = {
    item: {} as any,
    id: "zzz",
    key: `key-zzz`,
    type: "line",
    xAxis: { name: "Time", scale: "time" },
    categoryName: "Points chart",
    name: "chartitem",
    points: [
      { x: new Date("2020-05-25"), y: 0.5 },
      { x: new Date("2020-05-26"), y: 0.5 },
      { x: new Date("2020-05-27"), y: 0.5 },
      { x: new Date("2020-05-28"), y: 0.5 },
      { x: new Date("2020-05-29"), y: 0.5 },
      { x: new Date("2020-05-30"), y: 0.5 }
    ],
    domain: { x: [new Date("2020-05-25"), new Date("2020-05-30")], y: [0, 10] },
    isSelectedInWorkbench: true,
    showInChartPanel: true,
    updateIsSelectedInWorkbench: () => {},
    getColor: () => "red",
    onClick: () => {}
  };

  const scales = getScales(chartItem.points as { x: Date; y: number }[]);
  const props = {
    id: "testid",
    chartItem,
    scales: { x: scales.x, y: scales.y.domain([0, 1]) }
  };

  it("renders all points", function () {
    const renderer = TestRenderer.create(<MomentPointsChart {...props} />);
    const glyphs = renderer.root.findAllByType(Glyph);
    expect(glyphs.length).toBe(6);
  });

  it("renders the points at the correct positions", function () {
    const renderer = TestRenderer.create(<MomentPointsChart {...props} />);
    const glyphs = renderer.root.findAllByType(Glyph);
    const xs = [0, 2, 4, 6, 8, 10];
    glyphs.forEach((glyph, i) => {
      expect(glyph.props.left).toEqual(xs[i]);
      expect(glyph.props.top).toEqual(5);
    });
  });

  it("renders the correct type of glyph", function () {
    const renderer = TestRenderer.create(
      <MomentPointsChart {...props} glyph="square" />
    );
    const glyphs = renderer.root.findAllByType(GlyphSquare);
    expect(glyphs.length).toBe(6);
  });

  describe("when a basis item is provided", function () {
    it("renders the points on the basis item", function () {
      const basisItem = {
        ...chartItem,
        name: "basisitem",
        points: chartItem.points.map(({ x }, i) => ({
          x,
          y: [0, 10, 2, 5, 8, 6][i]
        }))
      };
      const basisItemScales = getScales(
        basisItem.points as { x: Date; y: number }[]
      );
      const propsWithBasisItem = {
        ...props,
        basisItem,
        basisItemScales
      };
      const renderer = TestRenderer.create(
        <MomentPointsChart {...propsWithBasisItem} />
      );
      const glyphs = renderer.root.findAllByType(Glyph);
      const xs = [0, 2, 4, 6, 8, 10];
      const ys = [0, 10, 2, 5, 8, 6];
      glyphs.forEach((point, i) => {
        expect(point.props.left).toEqual(xs[i]);
        expect(point.props.top).toEqual(ys[i]);
      });
    });
  });
});

function getScales(points: { x: Date; y: number }[]) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xDomain = [
    minBy(xs, (d) => d.getTime())!,
    maxBy(xs, (d) => d.getTime())!
  ];
  const yDomain = [Math.min(...ys), Math.max(...ys)];
  return {
    x: scaleTime({ domain: xDomain, range: [0, 10] }),
    y: scaleLinear({ domain: yDomain, range: [0, 10] })
  };
}
