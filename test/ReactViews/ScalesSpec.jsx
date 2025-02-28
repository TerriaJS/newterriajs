"use strict";

import { getMountedInstance } from "./MoreShallowTools";

import Scales from "../../lib/Charts/Scales";
import Chart from "../../lib/ReactViews/Custom/Chart/Chart";
import ChartData from "../../lib/Charts/ChartData";
// import TableStructure  from '../../lib/Map/TableStructure';

describe("Scales", function () {
  const size = {
    width: 1000,
    yAxesWidth: 66,
    height: 170,
    heightMinusXAxisLabelHeight: 170,
    plotHeight: 156,
    xAxisHeight: 14,
    xAxisLabelHeight: 20
  };
  it("handles a typical scale correctly", function (done) {
    const chartData = [
      new ChartData(
        [
          { x: 2, y: 5 },
          { x: 6, y: 2 }
        ],
        { name: "2-6" }
      )
    ];
    const chart = <Chart data={chartData} />;
    const instance = getMountedInstance(chart);
    instance
      .getChartDataPromise(instance.getChartParameters().data)
      .then(function (data) {
        const scale = Scales.calculate(size, undefined, data);
        expect(scale.x).toBeDefined();
        expect(scale.y).toBeDefined();
        expect(scale.x(2)).toEqual(0);
        expect(scale.x(6)).toEqual(size.width);
        expect(scale.y.undefined(5)).toEqual(0);
        expect(scale.y.undefined(2)).toEqual(size.plotHeight);
      })
      .then(done)
      .catch(done.fail);
  });

  it("handles overlapping X and Y domains correctly", function (done) {
    const chartData = [
      new ChartData(
        [
          { x: 2, y: 105 },
          { x: 6, y: 102 }
        ],
        { name: "one" }
      ),
      new ChartData(
        [
          { x: 4, y: 108 },
          { x: 10, y: 103 }
        ],
        { name: "two" }
      )
    ];
    const instance = getMountedInstance(<Chart data={chartData} />);
    instance
      .getChartDataPromise(instance.getChartParameters().data)
      .then(function (data) {
        const scale = Scales.calculate(size, undefined, data);
        expect(scale.x).toBeDefined();
        expect(scale.y).toBeDefined();
        expect(scale.x(2)).toEqual(0);
        expect(scale.x(10)).toEqual(size.width);
        expect(scale.y.undefined(108)).toEqual(0);
        expect(scale.y.undefined(102)).toEqual(size.plotHeight);
      })
      .then(done)
      .catch(done.fail);
  });
});
