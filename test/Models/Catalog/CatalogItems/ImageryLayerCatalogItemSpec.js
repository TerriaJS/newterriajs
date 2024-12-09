"use strict";

const CesiumEvent = require("terriajs-cesium/Source/Core/Event").default;
const ImageryLayer =
  require("terriajs-cesium/Source/Scene/ImageryLayer").default;
const ImageryProvider =
  require("terriajs-cesium/Source/Scene/ImageryProvider").default;
const ImageryState =
  require("terriajs-cesium/Source/Scene/ImageryState").default;
const JulianDate = require("terriajs-cesium/Source/Core/JulianDate").default;
const pollToPromise = require("../../lib/Core/pollToPromise");
const RequestErrorEvent =
  require("terriajs-cesium/Source/Core/RequestErrorEvent").default;
const Resource = require("terriajs-cesium/Source/Core/Resource").default;
const runLater = require("../../../../lib/Core/runLater");
const TimeIntervalCollection =
  require("terriajs-cesium/Source/Core/TimeIntervalCollection").default;
const TimeInterval =
  require("terriajs-cesium/Source/Core/TimeInterval").default;

const Terria = require("../../../../lib/Models/Terria");
const ImageryLayerCatalogItem = require("../../lib/Models/ImageryLayerCatalogItem");

describe("ImageryLayerCatalogItem", function () {
  describe("Time slider initial time as specified by initialTimeSource ", function () {
    var terria;
    var catalogItem;

    beforeEach(function () {
      terria = new Terria({
        baseUrl: "./"
      });
      catalogItem = new ImageryLayerCatalogItem(terria);
    });

    // Future developers take note: some of these tests will stop working in August 3015.
    it('should be start if "start" set', function () {
      catalogItem.initialTimeSource = "start";
      catalogItem.intervals = new TimeIntervalCollection([
        new TimeInterval({
          start: JulianDate.fromIso8601("2013-08-07T00:00:00.00Z"),
          stop: JulianDate.fromIso8601("2015-08-09T00:00:00.00Z")
        })
      ]);
      var currentTime = JulianDate.toIso8601(catalogItem.clock.currentTime, 3);
      // Do not compare time, because on some systems the second could have ticked over between getting the two times.
      currentTime = currentTime.substr(0, 10);
      expect(currentTime).toBe("2013-08-07");
    });

    it('should be current time if "present" set', function () {
      catalogItem.initialTimeSource = "present";
      catalogItem.intervals = new TimeIntervalCollection([
        new TimeInterval({
          start: JulianDate.fromIso8601("2013-08-07T00:00:00.00Z"),
          stop: JulianDate.fromIso8601("3115-08-09T00:00:00.00Z")
        })
      ]);
      var dateNow = new Date().toISOString();
      var currentTime = JulianDate.toIso8601(catalogItem.clock.currentTime, 3);
      // Do not compare time, because on some systems the second could have ticked over between getting the two times.
      dateNow = dateNow.substr(0, 10);
      currentTime = currentTime.substr(0, 10);
      expect(currentTime).toBe(dateNow);
    });

    it('should be last time if "end" set', function () {
      catalogItem.initialTimeSource = "end";
      catalogItem.intervals = new TimeIntervalCollection([
        new TimeInterval({
          start: JulianDate.fromIso8601("2013-08-07T00:00:00.00Z"),
          stop: JulianDate.fromIso8601("2015-08-09T00:00:00.00Z")
        })
      ]);
      var currentTime = JulianDate.toIso8601(catalogItem.clock.currentTime, 3);
      // Do not compare time, because on some systems the second could have ticked over between getting the two times.
      currentTime = currentTime.substr(0, 10);
      expect(currentTime).toBe("2015-08-09");
    });

    it("should be set to date specified if date is specified", function () {
      catalogItem.initialTimeSource = "2015-08-08T00:00:00.00Z";
      catalogItem.intervals = new TimeIntervalCollection([
        new TimeInterval({
          start: JulianDate.fromIso8601("2013-08-07T00:00:00.00Z"),
          stop: JulianDate.fromIso8601("2015-08-11T00:00:00.00Z")
        })
      ]);
      var currentTime = JulianDate.toIso8601(catalogItem.clock.currentTime, 3);
      // Do not compare time, because on some systems the second could have ticked over between getting the two times.
      currentTime = currentTime.substr(0, 10);
      expect(currentTime).toBe("2015-08-08");
    });

    it("should be set to start if date specified is before time range, with two intervals", function () {
      catalogItem.initialTimeSource = "2012-01-01T12:00:00Z";
      catalogItem.intervals = new TimeIntervalCollection([
        new TimeInterval({
          start: JulianDate.fromIso8601("2013-08-01T15:00:00Z"),
          stop: JulianDate.fromIso8601("2013-08-01T18:00:00Z")
        }),
        new TimeInterval({
          start: JulianDate.fromIso8601("2013-09-01T11:00:00Z"),
          stop: JulianDate.fromIso8601("2013-09-03T13:00:00Z")
        })
      ]);
      var currentTime = JulianDate.toIso8601(catalogItem.clock.currentTime, 3);
      // Do not compare time, because on some systems the second could have ticked over between getting the two times.
      currentTime = currentTime.substr(0, 10);
      expect(currentTime).toBe("2013-08-01");
    });

    it("should throw if a rubbish string is specified", function () {
      catalogItem.initialTimeSource = "2015z08-08";

      expect(function () {
        catalogItem.intervals = new TimeIntervalCollection([
          new TimeInterval({
            start: JulianDate.fromIso8601("2013-08-07T00:00:00.00Z"),
            stop: JulianDate.fromIso8601("2115-08-09T00:00:00.00Z")
          })
        ]);
      }).toThrow();
    });
  });

  describe("tile error handling", function () {
    const image = document.createElement("img");
    image.src = "images/blank.png";

    let terria;
    let catalogItem;
    let imageryProvider;
    let globeOrMap;
    let imagery;
    let imageryLayer;

    beforeEach(function () {
      terria = {
        error: new CesiumEvent()
      };
      catalogItem = {
        terria: terria,
        tileErrorThresholdBeforeDisabling: 5
      };
      imageryProvider = {
        requestImage: function (_x, _y, _level) {
          return ImageryProvider.loadImage(this, "images/blank.png");
        },
        errorEvent: new CesiumEvent()
      };
      globeOrMap = {
        terria: terria,
        addImageryProvider: function (options) {
          options.imageryProvider.errorEvent.addEventListener(
            options.onLoadError
          );
          return new ImageryLayer(options.imageryProvider);
        },
        isImageryLayerShown: function () {
          return true;
        }
      };
      imagery = {
        level: 0,
        x: 0,
        y: 0
      };

      terria.currentViewer = globeOrMap;

      imageryLayer = ImageryLayerCatalogItem.enableLayer(
        catalogItem,
        imageryProvider,
        1.0,
        0,
        globeOrMap
      );
    });

    function failLoad(statusCode, times) {
      return spyOn(Resource.prototype, "fetchImage").and.callFake(
        function (options) {
          if (times > 0) {
            --times;
            if (options.preferBlob) {
              return Promise.reject(
                new RequestErrorEvent(statusCode, "bad", [])
              );
            } else {
              return Promise.reject(image);
            }
          } else {
            return Promise.resolve(image);
          }
        }
      );
    }

    it("ignores errors in disabled layers", function (done) {
      spyOn(globeOrMap, "isImageryLayerShown").and.returnValue(false);
      const fetchImage = failLoad(503, 10);

      imageryLayer._requestImagery(imagery);

      pollToPromise(function () {
        return imagery.state === ImageryState.FAILED;
      })
        .then(function () {
          expect(fetchImage.calls.count()).toEqual(1);
        })
        .then(done)
        .catch(done.fail);
    });

    it("retries images that fail with a 503 error", function (done) {
      const fetchImage = failLoad(503, 2);

      imageryLayer._requestImagery(imagery);

      pollToPromise(function () {
        return imagery.state === ImageryState.RECEIVED;
      })
        .then(function () {
          expect(fetchImage.calls.count()).toEqual(4);
        })
        .then(done)
        .catch(done.fail);
    });

    it("eventually gives up on a tile that only succeeds when loaded via blob", function (done) {
      const fetchImage = spyOn(Resource.prototype, "fetchImage").and.callFake(
        function (options) {
          if (options.preferBlob) {
            return runLater(function () {
              return image;
            });
          } else {
            return runLater(function () {
              return Promise.reject(image);
            });
          }
        }
      );

      imageryLayer._requestImagery(imagery);

      pollToPromise(function () {
        return imagery.state === ImageryState.FAILED;
      })
        .then(function () {
          expect(fetchImage.calls.count()).toBeGreaterThan(5);
        })
        .then(done)
        .catch(done.fail);
    });

    it("ignores any number of 404 errors if treat404AsError is false", function (done) {
      const fetchImage = failLoad(404, 100);
      catalogItem.treat404AsError = false;

      const tiles = [];
      for (let i = 0; i < 20; ++i) {
        tiles[i] = {
          level: 20,
          x: i,
          y: i
        };
        imageryLayer._requestImagery(tiles[i]);
      }

      pollToPromise(function () {
        let result = true;
        for (let i = 0; i < tiles.length; ++i) {
          result = result && tiles[i].state === ImageryState.FAILED;
        }
        return result;
      })
        .then(function () {
          expect(fetchImage.calls.count()).toEqual(tiles.length * 2);
        })
        .then(done)
        .catch(done.fail);
    });

    it("ignores any number of 403 errors if treat403AsError is false", function (done) {
      const fetchImage = failLoad(403, 100);
      catalogItem.treat403AsError = false;

      const tiles = [];
      for (let i = 0; i < 20; ++i) {
        tiles[i] = {
          level: 20,
          x: i,
          y: i
        };
        imageryLayer._requestImagery(tiles[i]);
      }

      pollToPromise(function () {
        let result = true;
        for (let i = 0; i < tiles.length; ++i) {
          result = result && tiles[i].state === ImageryState.FAILED;
        }
        return result;
      })
        .then(function () {
          expect(fetchImage.calls.count()).toEqual(tiles.length * 2);
        })
        .then(done)
        .catch(done.fail);
    });

    it("doesn't disable the layer after only five 404s if treat404AsError is true", function (done) {
      const fetchImage = failLoad(404, 100);
      catalogItem.treat404AsError = true;
      catalogItem.isShown = true;

      const tiles = [];
      for (let i = 0; i < 5; ++i) {
        tiles[i] = {
          level: 20,
          x: i,
          y: i
        };
        imageryLayer._requestImagery(tiles[i]);
      }

      pollToPromise(function () {
        let result = true;
        for (let i = 0; i < tiles.length; ++i) {
          result = result && tiles[i].state === ImageryState.FAILED;
        }
        return result;
      })
        .then(function () {
          expect(fetchImage.calls.count()).toEqual(tiles.length * 2);
          expect(catalogItem.isShown).toBe(true);
        })
        .then(done)
        .catch(done.fail);
    });

    it("disables the layer after six 404s if treat404AsError is true", function (done) {
      const fetchImage = failLoad(404, 100);
      catalogItem.treat404AsError = true;
      catalogItem.isShown = true;

      const tiles = [];
      for (let i = 0; i < 6; ++i) {
        tiles[i] = {
          level: 20,
          x: i,
          y: i
        };
        imageryLayer._requestImagery(tiles[i]);
      }

      pollToPromise(function () {
        let result = true;
        for (let i = 0; i < tiles.length; ++i) {
          result = result && tiles[i].state === ImageryState.FAILED;
        }
        return result;
      })
        .then(function () {
          expect(fetchImage.calls.count()).toEqual(tiles.length * 2);
          expect(catalogItem.isShown).toBe(false);
        })
        .then(done)
        .catch(done.fail);
    });
  });
});
