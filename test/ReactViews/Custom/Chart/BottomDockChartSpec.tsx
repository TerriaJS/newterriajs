import TestRenderer, { act, ReactTestRenderer } from "react-test-renderer";
import { ChartItem } from "../../../../lib/ModelMixins/ChartableMixin";
import Terria from "../../../../lib/Models/Terria";
import BottomDockChart from "../../../../lib/ReactViews/Custom/Chart/BottomDockChart";
import PointOnMap from "../../../../lib/ReactViews/Custom/Chart/PointOnMap";

describe("BottomDockChart", function () {
  let terria: Terria;
  let testRenderer: ReactTestRenderer;
  let chartItems: ChartItem[];

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    chartItems = [
      {
        item: {} as any,
        id: "zzz",
        name: "zzz",
        categoryName: "ZZZ",
        key: `key-zzz`,
        type: "line",
        xAxis: { name: "Time", scale: "time" },
        points: [{ x: 10, y: 10 }],
        domain: { x: [0, 100], y: [0, 50] },
        units: "time",
        isSelectedInWorkbench: true,
        showInChartPanel: true,
        updateIsSelectedInWorkbench: () => {},
        getColor: () => "#fff",
        pointOnMap: { latitude: -33.8688, longitude: 151.2093 }
      },
      {
        item: {} as any,
        id: "aaa",
        name: "aaa",
        categoryName: "AAA",
        key: `key-aaa`,
        type: "line",
        xAxis: { name: "Time", scale: "time" },
        points: [{ x: 10, y: 10 }],
        domain: { x: [0, 100], y: [0, 50] },
        units: "time",
        isSelectedInWorkbench: true,
        showInChartPanel: true,
        updateIsSelectedInWorkbench: () => {},
        getColor: () => "#fff",
        pointOnMap: { latitude: -37.814, longitude: 144.96332 }
      }
    ];
  });

  it("renders all points on map for active chart items", function () {
    act(() => {
      testRenderer = TestRenderer.create(
        <BottomDockChart
          terria={terria}
          initialHeight={100}
          initialWidth={100}
          xAxis={{ scale: "time" }}
          chartItems={chartItems}
        />
      );
    });
    const pointsOnMap = testRenderer.root.findAllByType(PointOnMap);
    expect(pointsOnMap.length).toBe(2);
  });
});
