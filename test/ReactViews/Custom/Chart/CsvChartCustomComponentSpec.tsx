import CsvCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/CsvCatalogItem";
import TerriaFeature from "../../../../lib/Models/Feature/Feature";
import StubCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/StubCatalogItem";
import Terria from "../../../../lib/Models/Terria";
import CsvChartCustomComponent from "../../../../lib/ReactViews/Custom/CsvChartCustomComponent";
import {
  DomElement,
  ProcessNodeContext
} from "../../../../lib/ReactViews/Custom/CustomComponent";

describe("CsvChartCustomComponent", function () {
  let terria: Terria;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
  });

  describe("setTraitsFromAttrs", function () {
    let component: CsvChartCustomComponent;
    let context: ProcessNodeContext;
    let node: DomElement;

    beforeEach(function () {
      component = new CsvChartCustomComponent();
      context = {
        terria: terria,
        catalogItem: new StubCatalogItem(undefined, terria, undefined),
        feature: new TerriaFeature({})
      };
      node = {
        name: component.name,
        attribs: {
          data: '[["x","y","z"],[1,10,3],[2,15,9],[3,8,12],[5,25,4]]'
        }
      };
    });

    it("accepts a list of plain strings columnTitles", async function () {
      node.attribs = {
        ...node.attribs,
        "column-titles": "Meteor,Speed,Temperature"
      };
      const chart = component.processNode(context, node, [], 0);
      expect(chart).toBeDefined();
      if (chart) {
        const csvCatalogItem =
          await chart.props.children[0].props.sourceItems[0];
        expect(csvCatalogItem instanceof CsvCatalogItem).toBeTruthy();
        expect(csvCatalogItem.columnTitles).toEqual([
          "Meteor",
          "Speed",
          "Temperature"
        ]);
      }
    });

    it("accepts a list of {name, title} columnTitles", async function () {
      node.attribs = {
        ...node.attribs,
        "column-titles": "x:Meteor,y:Speed,z:Temperature"
      };
      const chart = component.processNode(context, node, [], 0);
      expect(chart).toBeDefined();
      if (chart) {
        const csvCatalogItem =
          await chart.props.children[0].props.sourceItems[0];
        expect(csvCatalogItem instanceof CsvCatalogItem).toBeTruthy();
        expect(csvCatalogItem.columns[0].title).toBe("Meteor");
        expect(csvCatalogItem.columns[1].title).toBe("Speed");
        expect(csvCatalogItem.columns[2].title).toBe("Temperature");
      }
    });

    it("can create a download url from csv text passed as chart body", function () {
      const url = component.constructDownloadUrlFromBody("a,b\n1,2\n3,4");
      expect(url.startsWith("blob:")).toBeTruthy();
    });
  });
});
