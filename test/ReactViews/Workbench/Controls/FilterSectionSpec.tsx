import TestRenderer, { ReactTestRenderer } from "react-test-renderer";
import FilterSection from "../../../../lib/ReactViews/Workbench/Controls/FilterSection";
import { Range } from "rc-slider";
import Terria from "../../../../lib/Models/Terria";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import CreateModel from "../../../../lib/Models/Definition/CreateModel";
import { FilterTraits } from "../../../../lib/Traits/TraitsClasses/Cesium3dTilesTraits";
import objectArrayTrait from "../../../../lib/Traits/Decorators/objectArrayTrait";
import ModelTraits from "../../../../lib/Traits/ModelTraits";
import { runInAction } from "mobx";

class TestTraits extends ModelTraits {
  @objectArrayTrait({
    type: FilterTraits,
    idProperty: "name",
    name: "filters",
    description: "The filters to apply to this catalog item."
  })
  filters?: FilterTraits[];
}

class TestModel extends CreateModel(TestTraits) {}

describe("FilterSectionSpec", function () {
  let testRenderer: ReactTestRenderer;
  let terria: Terria;
  let item: TestModel;

  beforeAll(() => {
    terria = new Terria({
      baseUrl: "./"
    });
    item = new TestModel("test", terria);
  });

  it("Renders nothing if no filters", function () {
    testRenderer = TestRenderer.create(<FilterSection item={item} />);
    expect(testRenderer.root.children.length).toBe(0);
  });

  it("Renders a range input for each filter", function () {
    runInAction(() => {
      const filter = item.addObject(
        CommonStrata.user,
        "filters",
        "level-filter"
      );
      filter?.setTrait(CommonStrata.user, "property", "level");
      filter?.setTrait(CommonStrata.user, "minimumValue", 0);
      filter?.setTrait(CommonStrata.user, "maximumValue", 42);
      filter?.setTrait(CommonStrata.user, "minimumShown", 10);
      filter?.setTrait(CommonStrata.user, "maximumShown", 20);
    });

    testRenderer = TestRenderer.create(<FilterSection item={item} />);
    const rangeInputs = testRenderer.root.findAllByType(Range);
    expect(rangeInputs.length).toBe(1);
  });
});
