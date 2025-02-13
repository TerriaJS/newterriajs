"use strict";

import { getMountedInstance } from "./MoreShallowTools";
import Terria from "../../lib/Models/Terria";
import ImageryLayerCatalogItem from "../../lib/Models/ImageryLayerCatalogItem";
import { Timeline } from "../../lib/ReactViews/BottomDock/Timeline/Timeline";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import DataSourceClock from "terriajs-cesium/Source/DataSources/DataSourceClock";

describe("Timeline", function () {
  describe("dateTime format", function () {
    let terria;
    let catalogItem;

    beforeEach(function () {
      terria = new Terria({
        baseUrl: "./"
      });
      // Set time
      catalogItem = new ImageryLayerCatalogItem(terria);
      catalogItem.clock = new DataSourceClock();
    });

    it("currentTime should be used if provided", function () {
      const timeline = <Timeline terria={terria} t={() => {}} />;
      catalogItem.dateFormat.currentTime = "mmm";
      terria.timelineStack.addToTop(catalogItem);
      terria.clock.currentTime = JulianDate.fromIso8601("2016-01-03");
      terria.clock.onTick.raiseEvent(terria.clock);

      const result = getMountedInstance(timeline);
      expect(result.state.currentTimeString).toBe("Jan");
    });

    it("currentTime should not be used if not provided", function () {
      const timeline = <Timeline terria={terria} t={() => {}} />;
      terria.timelineStack.addToTop(catalogItem);
      terria.clock.currentTime = JulianDate.fromIso8601("2016-01-01T00:00");
      terria.clock.onTick.raiseEvent(terria.clock);

      const result = getMountedInstance(timeline);
      expect(result.state.currentTimeString).toBe("01/01/2016, 00:00:00");
    });
  });
});
