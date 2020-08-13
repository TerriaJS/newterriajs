import { act } from "react-dom/test-utils";
import TestRenderer, { ReactTestRenderer } from "react-test-renderer";

import React from "react";

import Terria from "../../../../lib/Models/Terria";
import WebMapServiceCatalogItem from "../../../../lib/Models/WebMapServiceCatalogItem";
import DateTimePicker from "../../../../lib/ReactViews/BottomDock/Timeline/DateTimePicker";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import { formatDateTime } from "../../../../lib/ReactViews/BottomDock/Timeline/DateFormats";
import { runInAction } from "mobx";
import CommonStrata from "../../../../lib/Models/CommonStrata";
import isDefined from "../../../../lib/Core/isDefined";

const DateButton = require("../../../../lib/ReactViews/BottomDock/Timeline/DateTimePicker")
  .DateButton;
const GridRow = require("../../../../lib/ReactViews/BottomDock/Timeline/DateTimePicker")
  .GridRow;

describe("DateTimePicker", function() {
  let terria: Terria;
  let wmsItem: WebMapServiceCatalogItem;
  let testRenderer: ReactTestRenderer;

  beforeEach(async function() {
    terria = new Terria({
      baseUrl: "./"
    });
  });

  it("A datetime selector is rendered for WMS with not many dates", async function() {
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
          isOpen={true}
          showCalendarButton={false}
          onOpen={() => {}}
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

  it("A datetime selector is rendered for WMS with many dates", async function() {
    wmsItem = new WebMapServiceCatalogItem("mywms2", terria);
    wmsItem.setTrait(
      "definition",
      "url",
      "/test/WMS/period_datetimes_many_intervals.xml"
    );
    wmsItem.setTrait("definition", "layers", "single_period");
    await wmsItem.loadMapItems();

    if (isDefined(wmsItem.discreteTimesAsSortedJulianDates?.[0])) {
      runInAction(() => {
        wmsItem.setTrait(
          CommonStrata.user,
          "currentTime",
          JulianDate.toIso8601(
            wmsItem.discreteTimesAsSortedJulianDates![0].time
          )
        );
      });
    }
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
          isOpen={true}
          showCalendarButton={false}
          onOpen={() => {}}
          onClose={() => {}}
        />
      );
    });

    const dates = testRenderer.root.findAllByType(DateButton);

    const years = wmsItem.objectifiedDates[20];
    const months = years[years.indice[0]];
    const days = months[months.indice[0]];
    const expectedDates = days[days.indice[0]];

    expect(dates.length).toBe(expectedDates.indice.length);
  });
});
