import { act } from "react-dom/test-utils";
import TestRenderer, { ReactTestRenderer } from "react-test-renderer";
import Terria from "../../../../lib/Models/Terria";
import WebMapServiceCatalogItem from "../../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import { formatDateTime } from "../../../../lib/ReactViews/BottomDock/Timeline/DateFormats";
import DateTimeSelectorSection from "../../../../lib/ReactViews/Workbench/Controls/DateTimeSelectorSection";

describe("DateTimeSelectorSection", function() {
  let terria: Terria;
  let wmsItem: WebMapServiceCatalogItem;
  let testRenderer: ReactTestRenderer;
  let buttons: any;
  let currentDateBtn: any;

  beforeEach(async function() {
    terria = new Terria({
      baseUrl: "./"
    });

    wmsItem = new WebMapServiceCatalogItem("mywms", terria);
    wmsItem.setTrait("definition", "url", "/test/WMS/comma_sep_datetimes.xml");
    wmsItem.setTrait("definition", "layers", "13_intervals");
    await wmsItem.loadMapItems();
    act(() => {
      testRenderer = TestRenderer.create(
        <DateTimeSelectorSection t={() => {}} item={wmsItem} />
      );
    });
    buttons = testRenderer.root.findAllByType("button");

    currentDateBtn = buttons.filter((b: any) => {
      if (b.props.className.indexOf("currentDate") > -1) return true;
      return false;
    })[0];
  });

  it("A datetime selector is rendered", function() {
    expect(buttons).toBeDefined();
    expect(buttons.length).toEqual(5);
    // Need to do it the longer way because Travis runs in a diff locale
    const expectedDateStr = formatDateTime(
      new Date("2014-01-01T00:00:00.000Z")
    );
    expect(currentDateBtn.children[0]).toEqual(expectedDateStr);
  });

  it("A datetime selector can be formatted", async function() {
    wmsItem.setTrait("definition", "dateFormat", "yyyy");
    expect(buttons).toBeDefined();
    expect(buttons.length).toEqual(5);
    expect(currentDateBtn.children[0]).toEqual("2014");
  });
});
