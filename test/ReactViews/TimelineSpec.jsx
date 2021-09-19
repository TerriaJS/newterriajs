"use strict";
// import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import { Timeline } from "../../lib/ReactViews/BottomDock/Timeline/Timeline";
import { getMountedInstance } from "./MoreShallowTools";

const Terria = require("../../lib/Models/Terria");

const ImageryLayerCatalogItem = require("../../lib/Models/ImageryLayerCatalogItem");
const DataSourceClock = require("terriajs-cesium/Source/DataSources/DataSourceClock")
  .default;

describe("Timeline", function() {
  describe("dateTime format", function() {
    let terria;
    let catalogItem;

    beforeEach(function() {
      terria = new Terria({
        baseUrl: "./"
      });
      // Set time
      catalogItem = new ImageryLayerCatalogItem(terria);
      catalogItem.clock = new DataSourceClock();
    });

    it("currentTime should be used if provided", function() {
      const timeline = <Timeline terria={terria} t={() => {}} />;
      catalogItem.dateFormat.currentTime = "mmm";
      terria.timelineStack.addToTop(catalogItem);
      terria.clock.currentTime = JulianDate.fromIso8601("2016-01-03");
      terria.clock.onTick.raiseEvent(terria.clock);

      const result = getMountedInstance(timeline);
      expect(result.state.currentTimeString).toBe("Jan");
    });

    it("currentTime should not be used if not provided", function() {
      const timeline = <Timeline terria={terria} t={() => {}} />;
      terria.timelineStack.addToTop(catalogItem);
      terria.clock.currentTime = JulianDate.fromIso8601("2016-01-01T00:00");
      terria.clock.onTick.raiseEvent(terria.clock);

      const result = getMountedInstance(timeline);
      expect(result.state.currentTimeString).toBe("01/01/2016, 00:00:00");
    });
  });
});
