import { act } from "react-dom/test-utils";
import TestRenderer, { ReactTestRenderer } from "react-test-renderer";
import WebMapServiceCatalogItem from "../../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import Terria from "../../../../lib/Models/Terria";
import { formatDateTime } from "../../../../lib/ReactViews/BottomDock/Timeline/DateFormats";
import DateTimeSelectorSection from "../../../../lib/ReactViews/Workbench/Controls/DateTimeSelectorSection";

describe("DateTimeSelectorSection", function () {
  let terria: Terria;
  let wmsItem: WebMapServiceCatalogItem;
  let testRenderer: ReactTestRenderer;
  let buttons: any[];
  let currentDateBtn: any;

  beforeEach(async function () {
    terria = new Terria({
      baseUrl: "./"
    });

    wmsItem = new WebMapServiceCatalogItem("mywms", terria);
    wmsItem.setTrait("definition", "url", "/test/WMS/comma_sep_datetimes.xml");
    wmsItem.setTrait("definition", "layers", "13_intervals");
    await wmsItem.loadMapItems();
    act(() => {
      testRenderer = TestRenderer.create(
        <DateTimeSelectorSection item={wmsItem} />
      );
    });
    buttons = testRenderer.root.findAllByType("button");

    currentDateBtn = buttons.filter((b) => {
      if (b.props["id"]?.indexOf("current-date-btn") > -1) return true;
      return false;
    })[0];
  });

  it("A datetime selector is rendered", function () {
    expect(buttons).toBeDefined();
    expect(buttons.length).toEqual(5);
    // Need to do it the longer way because Travis runs in a diff locale
    const expectedDateStr = formatDateTime(
      new Date("2014-01-01T00:00:00.000Z")
    );

    expect(currentDateBtn.children[0].children[0].children[0]).toEqual(
      expectedDateStr
    );

    const titleLabel = testRenderer.root.findByProps({
      id: "dateTimeSelectorLabel"
    });
    expect(titleLabel).toBeDefined();

    expect((titleLabel.children[0] as any).children[0]).toEqual(
      "dateTime.selectorLabel"
    );
  });

  it("A datetime selector uses timeLabel", function () {
    wmsItem.setTrait("definition", "timeLabel", "Some Label");

    const titleLabel: any = testRenderer.root.findByProps({
      id: "dateTimeSelectorLabel"
    });
    expect(titleLabel).toBeDefined();

    expect(titleLabel.children[0].children[0]).toEqual("Some Label");
  });

  it("A datetime selector can be formatted", function () {
    wmsItem.setTrait("definition", "dateFormat", "yyyy");
    expect(buttons).toBeDefined();
    expect(buttons.length).toEqual(5);
    expect(currentDateBtn.children[0].children[0].children[0]).toEqual("2014");
  });
});
