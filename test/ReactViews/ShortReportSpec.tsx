import { create, ReactTestInstance } from "react-test-renderer";
import { act } from "react-dom/test-utils";
import { ThemeProvider } from "styled-components";
import { terriaTheme } from "../../lib/ReactViews/StandardUserInterface/StandardTheme";
import ShortReport from "../../lib/ReactViews/Workbench/Controls/ShortReport";
import Terria from "../../lib/Models/Terria";
import WebMapServiceCatalogItem from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";

describe("ShortReport", function() {
  let testRenderer: any;
  let terria: Terria;
  let wmsItem: WebMapServiceCatalogItem;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });

    wmsItem = new WebMapServiceCatalogItem("mochiwms", terria);
    wmsItem.setTrait("definition", "shortReportSections", [
      {
        name: "Report Name 1",
        content: "Some content which is showing",
        show: true
      },
      {
        name: "Report Name 2",
        content: "Some content which is hidden by default",
        show: false
      }
    ]);
  });

  describe("with basic props", function() {
    it("renders without errors", function() {
      act(() => {
        testRenderer = create(
          <ThemeProvider theme={terriaTheme}>
            <ShortReport item={wmsItem} />
          </ThemeProvider>
        );
      });

      const reports = testRenderer.root.findAll((node: ReactTestInstance) =>
        node.children.some((child: any) => child.match?.("Report Name"))
      );
      expect(reports.length).toEqual(2);

      const expandedReports = testRenderer.root.findAll(
        (node: ReactTestInstance) =>
          node.children.some((child: any) =>
            child.match?.("Some content which is showing")
          )
      );
      expect(expandedReports.length).toEqual(1);
    });
  });
});
