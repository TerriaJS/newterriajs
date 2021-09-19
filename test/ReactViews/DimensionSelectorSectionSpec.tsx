import { runInAction } from "mobx";
import TestRenderer from "react-test-renderer";
import { ThemeProvider } from "styled-components";
import CatalogMemberMixin from "../../lib/ModelMixins/CatalogMemberMixin";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import CreateModel from "../../lib/Models/Definition/CreateModel";
import CsvCatalogItem from "../../lib/Models/Catalog/CatalogItems/CsvCatalogItem";
import SelectableDimensions from "../../lib/Models/SelectableDimensions";
import Terria from "../../lib/Models/Terria";
import WebMapServiceCatalogItem from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import { terriaTheme } from "../../lib/ReactViews/StandardUserInterface/StandardTheme";
import DimensionSelectorSection from "../../lib/ReactViews/Workbench/Controls/DimensionSelectorSection";
import Select from "../../lib/Styled/Select";
import CatalogMemberTraits from "../../lib/Traits/TraitsClasses/CatalogMemberTraits";

export default class TestCatalogItem
  extends CatalogMemberMixin(CreateModel(CatalogMemberTraits))
  implements SelectableDimensions {
  static readonly type = "stub";
  get type() {
    return "test";
  }

  selectableDimensions = [
    {
      id: "some-id",
      name: "Some name",
      options: [
        { id: "option-1", name: "Option 1" },
        { id: "option-2", name: "Option 2" }
      ],
      selectedId: "option-2",
      allowUndefined: true,
      setDimensionValue: (stratumId: string, newStyle: string) => {}
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
      setDimensionValue: (stratumId: string, newStyle: string) => {}
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
      setDimensionValue: (stratumId: string, newStyle: string) => {},
      disable: true
    }
  ];
}

describe("DimensionSelectorSection", function() {
  let terria: Terria;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
  });

  it("shows all dimensions and styles for a mock layer", function(done) {
    const mockItem = new TestCatalogItem("what", terria);

    const section = TestRenderer.create(
      <ThemeProvider theme={terriaTheme}>
        <DimensionSelectorSection item={mockItem} />
      </ThemeProvider>
    );

    const selects = section.root.findAllByType(Select);
    expect(selects.length).toBe(2); // The 3rd Dimension has disable:true

    const dim1 = selects[0];
    expect(dim1.props.name).toContain("some-id");
    expect(dim1.props.value).toBe("option-2");

    const elevationOptions = dim1.findAllByType("option");
    expect(elevationOptions.length).toBe(3); // This contains an 'undefined' option

    const dim2 = selects[1];
    expect(dim2.props.name).toContain("some-id-2");
    expect(dim2.props.value).toBe("option-3");
    const customOptions = dim2.findAllByType("option");
    expect(customOptions.length).toBe(3);

    done();
  });

  it("show dimensions and styles for a 'real' WMS layer", function(done) {
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
      .then(function() {
        const section = TestRenderer.create(
          <ThemeProvider theme={terriaTheme}>
            <DimensionSelectorSection item={wmsItem} />
          </ThemeProvider>
        );

        const selects = section.root.findAllByType(Select);
        const labels = section.root.findAllByType("label");

        // Expect 3 dimensions (elevation, custom, another) + 2 styles (layer A, layer B)
        expect(selects.length).toBe(5);
        expect(labels.length).toBe(5);

        expect(selects[0].props.name).toContain(
          `${wmsItem.uniqueId}-elevation`
        );
        expect(selects[0].props.value).toBe("-0.59375");
        expect(selects[0].findAllByType("option").length).toBe(16);

        expect(selects[1].props.name).toContain(`${wmsItem.uniqueId}-custom`);
        expect(selects[1].props.value).toBe("Another thing");
        expect(selects[1].findAllByType("option").length).toBe(4);

        expect(selects[2].props.name).toContain(`${wmsItem.uniqueId}-another`);
        expect(selects[2].props.value).toBe("Second");
        expect(selects[2].findAllByType("option").length).toBe(3);

        // Check Style A
        expect(selects[3].props.name).toContain(`${wmsItem.uniqueId}-A-styles`);
        expect(selects[3].props.value).toBe("contour/ferret");
        expect(selects[3].findAllByType("option").length).toBe(41);

        expect(selects[4].props.name).toContain(`${wmsItem.uniqueId}-B-styles`);
        expect(selects[4].props.value).toBe("shadefill/alg2");
        expect(selects[4].findAllByType("option").length).toBe(40);
      })
      .then(done)
      .catch(done.fail);
  });

  it("shows csv region mapping options", async function(done) {
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(
      "build/TerriaJS/data/regionMapping.json"
    ).andReturn({
      responseText: JSON.stringify(
        require("../../wwwroot/data/regionMapping.json")
      )
    });

    jasmine.Ajax.stubRequest(
      "build/TerriaJS/data/regionids/region_map-FID_LGA_2015_AUST_LGA_CODE15.json"
    ).andReturn({
      responseText: JSON.stringify(
        require("../../wwwroot/data/regionids/region_map-FID_LGA_2015_AUST_LGA_CODE15.json")
      )
    });

    jasmine.Ajax.stubRequest("test/csv/lga_code_2015.csv").andReturn({
      responseText: require("raw-loader!../../wwwroot/test/csv/lga_code_2015.csv")
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
        <DimensionSelectorSection item={csvItem} />
      </ThemeProvider>
    );

    // Note: there will only be 2 selects: one for region column and one for region mapping.
    // The activeStyle select is hidden as there is only one option
    const selects = section.root.findAllByType(Select);
    expect(selects.length).toBe(2);

    if (selects.length < 2) {
      done.fail("Not enough select objects");
    }

    expect(selects[0].props.name).toContain("regionColumn");
    expect(selects[0].props.value).toBe("lga_code_2015");
    expect(selects[0].findAllByType("option").length).toBe(2);

    expect(selects[1].props.name).toContain("regionMapping");
    expect(selects[1].props.value).toBe("LGA_2015");

    done();

    jasmine.Ajax.uninstall();
  });
});
