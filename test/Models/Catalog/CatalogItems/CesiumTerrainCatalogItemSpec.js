"use strict";

var CesiumTerrainCatalogItem = require("../../../../lib/Models/Catalog/CatalogItems/CesiumTerrainCatalogItem");
var CesiumTerrainProvider =
  require("terriajs-cesium/Source/Core/CesiumTerrainProvider").default;
var loadWithXhr = require("../../../../lib/Core/loadWithXhr");
var Terria = require("../../../../lib/Models/Terria");

describe("CesiumTerrainCatalogItem", function () {
  var terria;
  var item;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    item = new CesiumTerrainCatalogItem(terria);
  });

  it("has correct type", function () {
    expect(item.type).toBe("cesium-terrain");
    expect(item.typeName).toContain("Cesium");
  });

  it("creates imagery provider with correct URL", function (done) {
    spyOn(loadWithXhr, "load").and.callFake(
      function (
        url,
        _responseType,
        _method,
        _data,
        _headers,
        deferred,
        _overrideMimeType,
        _preferText,
        _timeout
      ) {
        expect(url.indexOf("http://example.com/foo/bar")).toBe(0);
        deferred.resolve(
          JSON.stringify({
            tilejson: "2.1.0",
            format: "heightmap-1.0",
            version: "1.0.0",
            scheme: "tms",
            tiles: ["{z}/{x}/{y}.terrain?v={version}"]
          })
        );
      }
    );

    item.url = "http://example.com/foo/bar";
    var terrainProvider = item._createTerrainProvider();
    expect(terrainProvider instanceof CesiumTerrainProvider).toBe(true);
    terrainProvider.readyPromise
      .then(function () {
        expect(loadWithXhr.load.calls.any()).toBe(true);
      })
      .then(done);
  });
});
