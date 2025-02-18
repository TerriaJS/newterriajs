import { ReactTestRenderer } from "react-test-renderer";
import { ChartItem } from "../../../../lib/ModelMixins/ChartableMixin";
import Terria from "../../../../lib/Models/Terria";

describe("BottomDockChart", function () {
  let _terria: Terria;
  let _testRenderer: ReactTestRenderer;
  let _chartItems: ChartItem[];

  beforeEach(function () {
    _terria = new Terria({
      baseUrl: "./"
    });
    _chartItems = [
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
      } as ChartItem,
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
      } as ChartItem
    ];
  });

  /* Disabled in efa9ac860f because the test fails. Old comment:
     FIXME: disabling because the new version of `withParentSize` from
  `  @vx/responsive` uses ResizeObserver to trigger render which doesn't seem to
     work correctly in tests
  it("renders all points on map for active chart items", function () {
    act(() => {
      testRenderer = TestRenderer.create(
        <BottomDockChart
          terria={terria}
          height={100}
          width={100}
          xAxis={{ scale: "time" }}
          chartItems={chartItems}
        />
      );
    });
    const pointsOnMap = testRenderer.root.findAllByType(PointOnMap);
    expect(pointsOnMap.length).toBe(2);
  });
  */
});
