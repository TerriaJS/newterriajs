import { act } from "react-dom/test-utils";
import TestRenderer, { ReactTestRenderer } from "react-test-renderer";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import Terria from "../../../../lib/Models/Terria";
import WebMapServiceCatalogItem from "../../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import DateTimePicker from "../../../../lib/ReactViews/BottomDock/Timeline/DateTimePicker";
import { GridRow } from "../../../../lib/ReactViews/BottomDock/Timeline/DatePicker/DateTimePicker.styles";

describe("DateTimePicker", function () {
  let terria: Terria;
  let wmsItem: WebMapServiceCatalogItem;
  let testRenderer: ReactTestRenderer;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
  });

  it("A datetime selector is rendered for WMS with not many dates", async function () {
    wmsItem = new WebMapServiceCatalogItem("mywms", terria);
    wmsItem.setTrait("definition", "url", "/test/WMS/comma_sep_datetimes.xml");
    wmsItem.setTrait("definition", "layers", "13_intervals");
    await wmsItem.loadMapItems();
    act(() => {
      testRenderer = TestRenderer.create(
        <DateTimePicker
          currentDate={
            wmsItem.currentDiscreteJulianDate === undefined
              ? undefined
              : JulianDate.toDate(wmsItem.currentDiscreteJulianDate)
          }
          dates={wmsItem.objectifiedDates}
          onChange={() => {}}
          openDirection="down"
          isOpen
          onClose={() => {}}
        />
      );
    });

    const dates = testRenderer.root.findAllByType(GridRow);
    expect(dates.length).toBe(13);

    expect(
      // ಠ_ಥ
      (dates[0] as any).children[0].children[0].children[0].children[0]
    ).toBe("2002");
  });
});
