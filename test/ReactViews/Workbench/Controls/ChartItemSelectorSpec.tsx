import { act } from "react-dom/test-utils";
import TestRenderer, { ReactTestRenderer } from "react-test-renderer";
import ChartableMixin, {
  ChartItem
} from "../../../../lib/ModelMixins/ChartableMixin";
import CreateModel from "../../../../lib/Models/Definition/CreateModel";
import Terria from "../../../../lib/Models/Terria";
import ChartItemSelector from "../../../../lib/ReactViews/Workbench/Controls/ChartItemSelector";
import UrlTraits from "../../../../lib/Traits/TraitsClasses/UrlTraits";
import mixTraits from "../../../../lib/Traits/mixTraits";
import MappableTraits from "../../../../lib/Traits/TraitsClasses/MappableTraits";

class SomeChartableItem extends ChartableMixin(
  CreateModel(mixTraits(UrlTraits, MappableTraits))
) {
  protected forceLoadMapItems(): Promise<void> {
    return Promise.resolve();
  }
  get mapItems() {
    return [];
  }
  get chartItems() {
    return [
      {
        item: this,
        id: "zzz",
        name: "zzz",
        categoryName: "ZZZ",
        key: `key-zzz`,
        type: "line",
        xAxis: { name: "Time", scale: "time" },
        points: [],
        domain: { x: [0, 100], y: [0, 50] },
        units: "time",
        isSelectedInWorkbench: true,
        showInChartPanel: true,
        updateIsSelectedInWorkbench: () => {},
        getColor: () => "#fff",
        pointOnMap: undefined
      } as ChartItem,
      {
        item: this,
        id: "aaa",
        name: "aaa",
        categoryName: "AAA",
        key: `key-aaa`,
        type: "line",
        xAxis: { name: "Time", scale: "time" },
        points: [],
        domain: { x: [0, 100], y: [0, 50] },
        units: "time",
        isSelectedInWorkbench: true,
        showInChartPanel: true,
        updateIsSelectedInWorkbench: () => {},
        getColor: () => "#fff",
        pointOnMap: undefined
      } as ChartItem
    ];
  }
}

describe("ChartItemSelector", function () {
  let terria: Terria;
  let item: SomeChartableItem;
  let testRenderer: ReactTestRenderer;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    item = new SomeChartableItem("test", terria);
    terria.addModel(item);
    terria.workbench.add(item);
    act(() => {
      testRenderer = TestRenderer.create(<ChartItemSelector item={item} />);
    });
  });

  it("sorts the chart items by name", function () {
    const chartItemNames = testRenderer.root
      .findAllByType("label")
      .map((c) => (c.children[3] as any).children[0].children[0]);
    expect(chartItemNames).toEqual(["aaa", "zzz"]);
  });
});
