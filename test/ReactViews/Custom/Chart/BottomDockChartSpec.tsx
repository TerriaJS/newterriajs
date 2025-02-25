import { act, ReactTestRenderer } from "react-test-renderer";
import { ChartItem } from "../../../../lib/ModelMixins/ChartableMixin";
import Terria from "../../../../lib/Models/Terria";
import ViewState from "../../../../lib/ReactViewModels/ViewState";
import { BottomDockChart } from "../../../../lib/ReactViews/Custom/Chart/BottomDockChart";
import { PointOnMap } from "../../../../lib/ReactViews/Custom/Chart/PointOnMap";
import { createWithContexts } from "../../withContext";
import timeout from "../../../../lib/Core/timeout";
import GeoJsonCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/GeoJsonCatalogItem";

describe("BottomDockChart", function () {
  let terria: Terria;
  let viewState: ViewState;
  let testRenderer: ReactTestRenderer;
  let chartItems: ChartItem[];

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria,
      catalogSearchProvider: undefined
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

  it("renders all points on map for active chart items", async function () {
    act(() => {
      testRenderer = createWithContexts(
        viewState,
        <BottomDockChart
          height={100}
          initialHeight={100}
          initialWidth={100}
          xAxis={{ scale: "time" } as never}
          chartItems={chartItems}
        />
      );
    });

    const pointsOnMap = terria.overlays.items.filter(
      (item) => item instanceof GeoJsonCatalogItem
    );
    expect(pointsOnMap.length).toBe(2);
  });
});
