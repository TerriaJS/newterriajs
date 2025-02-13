import { act } from "react-dom/test-utils";
import {
  create,
  ReactTestInstance,
  ReactTestRenderer
} from "react-test-renderer";
import { ThemeProvider } from "styled-components";
import WebMapServiceCatalogItem from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import Terria from "../../lib/Models/Terria";
import { terriaTheme } from "../../lib/ReactViews/StandardUserInterface";
import ShortReport from "../../lib/ReactViews/Workbench/Controls/ShortReport";

describe("ShortReport", function () {
  let testRenderer: ReactTestRenderer | undefined;
  let terria: Terria;
  let wmsItem: WebMapServiceCatalogItem;

  beforeEach(function () {
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
      },
      {
        name: "Report Name - with no content",
        content: undefined,
        show: undefined
      }
    ]);
  });

  describe("with basic props", function () {
    it("renders without errors", function () {
      act(() => {
        testRenderer = create(
          <ThemeProvider theme={terriaTheme}>
            <ShortReport item={wmsItem} />
          </ThemeProvider>
        );
      });

      if (!testRenderer) throw "Invalid testRenderer";

      const reports = testRenderer.root.findAll((node: ReactTestInstance) =>
        node.children.some((child: any) => child.match?.("Report Name"))
      );
      expect(reports.length).toEqual(3);

      // Test that collapsible components have been created with correct props
      expect(
        testRenderer.root.findAllByProps({
          title: "Report Name 1",
          isOpen: true
        }).length
      ).toBe(1);

      expect(
        testRenderer.root.findAllByProps({
          title: "Report Name 2",
          isOpen: false
        }).length
      ).toBe(1);

      // Expect no Collapsible component
      expect(
        testRenderer.root.findAllByProps({
          title: "Report Name - with no content",
          isOpen: true
        }).length
      ).toBe(0);

      const boxes = testRenderer.root.findAllByType("p");
      expect(
        boxes.some(
          (box) => box.props.children === "Report Name - with no content"
        )
      ).toBeTruthy();
    });
  });
});
