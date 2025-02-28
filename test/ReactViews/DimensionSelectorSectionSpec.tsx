import { runInAction } from "mobx";
import ReactSelect from "react-select";
import TestRenderer from "react-test-renderer";
import { ThemeProvider } from "styled-components";
import CatalogMemberMixin from "../../lib/ModelMixins/CatalogMemberMixin";
import CsvCatalogItem from "../../lib/Models/Catalog/CatalogItems/CsvCatalogItem";
import WebMapServiceCatalogItem from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import CreateModel from "../../lib/Models/Definition/CreateModel";
import SelectableDimensions, {
  DEFAULT_PLACEMENT,
  SelectableDimension as SelectableDimensionModel
} from "../../lib/Models/SelectableDimensions/SelectableDimensions";
import Terria from "../../lib/Models/Terria";
import { SelectableDimensionGroup } from "../../lib/ReactViews/SelectableDimensions/Group";
import SelectableDimension from "../../lib/ReactViews/SelectableDimensions/SelectableDimension";
import { terriaTheme } from "../../lib/ReactViews/StandardUserInterface";
import SelectableDimensionSection from "../../lib/ReactViews/Workbench/Controls/SelectableDimensionSection";
import Checkbox from "../../lib/Styled/Checkbox";
import CatalogMemberTraits from "../../lib/Traits/TraitsClasses/CatalogMemberTraits";

import lgaCode2015 from "../../wwwroot/test/csv/lga_code_2015.csv";
import lgaCodeJson from "../../wwwroot/data/regionids/region_map-FID_LGA_2015_AUST_LGA_CODE15.json";
import regionMapping from "../../wwwroot/data/regionMapping.json";

export default class TestCatalogItem
  extends CatalogMemberMixin(CreateModel(CatalogMemberTraits))
  implements SelectableDimensions
{
  static readonly type = "stub";
  get type() {
    return "test";
  }

  get selectableDimensions() {
    return this.selectableDimensionsValue;
  }

  selectableDimensionsValue: SelectableDimensionModel[] = [
    {
      id: "some-id",
      name: "Some name",
      options: [
        { id: "option-1", name: "Option 1" },
        { id: "option-2", name: "Option 2" }
      ],
      selectedId: "option-2",
      allowUndefined: true,
      setDimensionValue: (_stratumId: string, _newStyle: string) => {}
    },
    {
      id: "some-id-2",
      name: "Some name 2",
      options: [
        { id: "option-3", name: "Option 3" },
        { id: "option-4", name: "Option 4" },
        { id: "option-5", name: "Option 5" }
      ],
      selectedId: "option-3",
      allowUndefined: false,
      setDimensionValue: (_stratumId: string, _newStyle: string) => {}
    },
    {
      id: "some-id-3",
      name: "Some name 3",
      options: [
        { id: "option-6", name: "Neko" },
        { id: "option-7", name: "Mochi" },
        { id: "option-8", name: "A dog" }
      ],
      selectedId: "option-8",
      allowUndefined: false,
      setDimensionValue: (_stratumId: string, _newStyle: string) => {},
      disable: true
    },
    {
      id: "some-id-4",
      name: "Some name 4",
      options: [
        { id: "true", name: "Option 1" },
        { id: "false", name: "Option 2" }
      ],
      selectedId: "false",
      type: "checkbox",
      setDimensionValue: (_stratumId, _newStyle) => {}
    }
  ];
}

describe("DimensionSelectorSection", function () {
  let terria: Terria;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
  });

  it("shows all dimensions and styles for a mock layer", function (done) {
    const mockItem = new TestCatalogItem("what", terria);

    const section = TestRenderer.create(
      <ThemeProvider theme={terriaTheme}>
        <SelectableDimensionSection
          item={mockItem}
          placement={DEFAULT_PLACEMENT}
        />
      </ThemeProvider>
    );

    const selects = section.root.findAllByType(ReactSelect);
    expect(selects.length).toBe(2); // The 3rd Dimension has disable:true

    const checkboxes = section.root.findAllByType(Checkbox);
    expect(checkboxes.length).toBe(1);

    done();
  });

  it("show dimensions and styles for a 'real' WMS layer", function (done) {
    const wmsItem = new WebMapServiceCatalogItem("some-layer", terria);
    runInAction(() => {
      wmsItem.setTrait(CommonStrata.definition, "url", "http://example.com");
      wmsItem.setTrait(
        CommonStrata.definition,
        "getCapabilitiesUrl",
        "test/WMS/styles_and_dimensions.xml"
      );
      wmsItem.setTrait(CommonStrata.definition, "layers", "A,B");
      wmsItem.setTrait(CommonStrata.definition, "dimensions", {
        styles: "contour/ferret,shadefill/alg2",
        custom: "Another thing",
        elevation: "-0.59375"
      });
      wmsItem.setTrait(
        CommonStrata.definition,
        "styles",
        "contour/ferret,shadefill/alg2"
      );
    });

    wmsItem
      .loadMetadata()
      .then(function () {
        const section = TestRenderer.create(
          <ThemeProvider theme={terriaTheme}>
            <SelectableDimensionSection
              item={wmsItem}
              placement={DEFAULT_PLACEMENT}
            />
          </ThemeProvider>
        );

        const selects = section.root.findAllByType(ReactSelect);
        const labels = section.root.findAllByType("label");

        // Expect 3 dimensions (elevation, custom, another) + 2 styles (layer A, layer B)
        expect(selects.length).toBe(5);
        expect(labels.length).toBe(5);
      })
      .then(done)
      .catch(done.fail);
  });

  it("shows csv region mapping options", async function (done) {
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(
      "build/TerriaJS/data/regionMapping.json"
    ).andReturn({
      responseJSON: regionMapping
    });

    jasmine.Ajax.stubRequest(
      "https://tiles.terria.io/region-mapping/regionids/region_map-FID_LGA_2015_AUST_LGA_CODE15.json"
    ).andReturn({
      responseJSON: lgaCodeJson
    });

    jasmine.Ajax.stubRequest("test/csv/lga_code_2015.csv").andReturn({
      responseText: lgaCode2015
    });

    const csvItem = new CsvCatalogItem("some-csv", terria, undefined);

    runInAction(() => {
      csvItem.setTrait(
        CommonStrata.definition,
        "url",
        "test/csv/lga_code_2015.csv"
      );

      csvItem.setTrait(
        CommonStrata.definition,
        "enableManualRegionMapping",
        true
      );
    });

    await csvItem.loadMapItems();

    const section = TestRenderer.create(
      <ThemeProvider theme={terriaTheme}>
        <SelectableDimensionSection
          item={csvItem}
          placement={DEFAULT_PLACEMENT}
        />
      </ThemeProvider>
    );

    const groups = section.root.findAllByType(SelectableDimensionGroup);
    expect(groups.length).toBe(1);

    console.log(groups[0].props);
    expect(groups[0].props.dim.id).toBe(csvItem.selectableDimensions[0].id);

    done();

    jasmine.Ajax.uninstall();
  });

  describe("when given a SelectableDimensionCheckboxGroup", function () {
    let mockItem: TestCatalogItem;

    beforeEach(function () {
      mockItem = new TestCatalogItem("what", terria);
      mockItem.selectableDimensionsValue = [
        {
          id: "checkbox-group1",
          type: "checkbox-group",
          selectedId: "true",
          options: [
            {
              id: "true",
              name: "true"
            },
            {
              id: "false",
              name: "false"
            }
          ],
          setDimensionValue: () => {},
          selectableDimensions: [
            {
              id: "checkbox-1",
              type: "checkbox",
              name: "Checkbox 1",
              selectedId: "true",
              options: [
                { id: "true", name: "When checked" },
                { id: "false", name: "When unchecked" }
              ],
              setDimensionValue: () => {}
            },
            {
              id: "select-1",
              type: "select",
              name: "Dropdown 1",
              selectedId: "true",
              options: [
                { id: "option-1", name: "Option 1" },
                { id: "option-2", name: "Option 2" }
              ],
              setDimensionValue: () => {}
            },
            {
              disable: true,
              id: "select-2",
              type: "select",
              name: "Dropdown 2",
              selectedId: "true",
              options: [
                { id: "option-3", name: "Option 3" },
                { id: "option-4", name: "Option 4" }
              ],
              setDimensionValue: () => {}
            }
          ]
        }
      ];
    });
  });

  describe("when given a SelectableDimensionGroup", function () {
    let mockItem: TestCatalogItem;

    beforeEach(function () {
      mockItem = new TestCatalogItem("what", terria);
      mockItem.selectableDimensionsValue = [
        {
          id: "group",
          type: "group",
          name: "Selectable group",
          isOpen: true,
          selectableDimensions: [
            {
              id: "checkbox-1",
              type: "checkbox",
              name: "Checkbox 1",
              selectedId: "true",
              options: [
                { id: "true", name: "When checked" },
                { id: "false", name: "When unchecked" }
              ],
              setDimensionValue: () => {}
            },
            {
              id: "select-1",
              type: "select",
              name: "Dropdown 1",
              selectedId: "true",
              options: [
                { id: "option-1", name: "Option 1" },
                { id: "option-2", name: "Option 2" }
              ],
              setDimensionValue: () => {}
            },
            {
              disable: true,
              id: "select-2",
              type: "select",
              name: "Dropdown 2",
              selectedId: "true",
              options: [
                { id: "option-3", name: "Option 3" },
                { id: "option-4", name: "Option 4" }
              ],
              setDimensionValue: () => {}
            }
          ]
        }
      ];
    });

    it("renders the group", function () {
      const section = TestRenderer.create(
        <ThemeProvider theme={terriaTheme}>
          <SelectableDimensionSection
            item={mockItem}
            placement={DEFAULT_PLACEMENT}
          />
        </ThemeProvider>
      );

      const group = section.root.findByType(SelectableDimensionGroup);
      expect(group.props.dim.type).toEqual("group");
    });

    it("renders all the group children", function () {
      const section = TestRenderer.create(
        <ThemeProvider theme={terriaTheme}>
          <SelectableDimensionSection
            item={mockItem}
            placement={DEFAULT_PLACEMENT}
          />
        </ThemeProvider>
      );

      expect(section.root.findAllByType(SelectableDimension).length).toBe(1);

      const group = section.root.findByType(SelectableDimensionGroup);
      expect(group.props.dim.type).toEqual("group");

      const collapsible: TestRenderer.ReactTestInstance = (
        group.children[0] as any
      ).children[0].children[0];

      const button = collapsible.children[0];

      if (typeof button === "string") throw "Invalid button";
      button.props.onClick();

      expect(section.root.findAllByType(SelectableDimension).length).toBe(3);
    });
  });
});
