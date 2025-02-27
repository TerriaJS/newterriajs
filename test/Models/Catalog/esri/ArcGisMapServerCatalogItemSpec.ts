import i18next from "i18next";
import { configure, runInAction } from "mobx";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import ArcGisMapServerImageryProvider from "terriajs-cesium/Source/Scene/ArcGisMapServerImageryProvider";
import _loadWithXhr from "../../../../lib/Core/loadWithXhr";
import ArcGisMapServerCatalogItem from "../../../../lib/Models/Catalog/Esri/ArcGisMapServerCatalogItem";
import Terria from "../../../../lib/Models/Terria";
import CommonStrata from "./../../../../lib/Models/Definition/CommonStrata";
import mapServerJson from "../../../../wwwroot/test/ArcGisMapServer/Dynamic_National_Map_Hydrography_and_Marine/mapserver.json";

configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

interface ExtendedLoadWithXhr {
  (): any;
  load: { (...args: any[]): any; calls?: any };
}

const loadWithXhr: ExtendedLoadWithXhr = _loadWithXhr as any;

describe("ArcGisMapServerCatalogItem", function () {
  const mapServerUrl =
    "http://www.example.com/Dynamic_National_Map_Hydrography_and_Marine/MapServer";

  const singleLayerUrl = mapServerUrl + "/31";

  let item: ArcGisMapServerCatalogItem;

  beforeEach(function () {
    item = new ArcGisMapServerCatalogItem("test", new Terria());
    const realLoadWithXhr = loadWithXhr.load;
    // We replace calls to GA's servers with pre-captured JSON files so our testing is isolated, but reflects real data.
    spyOn(loadWithXhr, "load").and.callFake(function (...args: any[]) {
      let url = args[0];
      url = url.replace("http://example.com/42/", "");

      if (url.match("Dynamic_National_Map_Hydrography_and_Marine/MapServer")) {
        url = url.replace(/^.*\/MapServer/, "MapServer");
        url = url.replace(/MapServer\/?\?.*/i, "mapserver.json");
        url = url.replace(/MapServer\/Legend\/?\?.*/i, "legend.json");
        url = url.replace(/MapServer\/Layers\/?\?.*/i, "layers.json");
        url = url.replace(/MapServer\/31\/?\?.*/i, "31.json");
        args[0] =
          "test/ArcGisMapServer/Dynamic_National_Map_Hydrography_and_Marine/" +
          url;
      } else if (url.match("SingleFusedMapCache/MapServer")) {
        url = url.replace(/^.*\/MapServer/, "MapServer");
        url = url.replace(/MapServer\/?\?.*/i, "mapserver.json");
        url = url.replace(/MapServer\/Legend\/?\?.*/i, "legend.json");
        url = url.replace(/MapServer\/Layers\/?\?.*/i, "layers.json");
        args[0] = "test/ArcGisMapServer/SingleFusedMapCache/" + url;
      } else if (url.match("/token")) {
        args[0] =
          "test/ArcGisMapServer/Dynamic_National_Map_Hydrography_and_Marine/token.json";
        args[1] = "text";
        args[2] = "GET";
        args[3] = undefined;
        return realLoadWithXhr(...args);
      } else if (url.match("/cadastre_history/MapServer")) {
        args[0] = "test/ArcGisMapServer/time-enabled.json";
      } else if (url.match("/LayerWithTiles/MapServer")) {
        url = url.replace(/^.*\/MapServer/, "MapServer");
        url = url.replace(/MapServer\/?\?.*/i, "mapserver.json");
        url = url.replace(/MapServer\/Legend\/?\?.*/i, "legend.json");
        url = url.replace(/MapServer\/Layers\/?\?.*/i, "layers.json");
        args[0] = "test/ArcGisMapServer/LayerWithTiles/" + url;
      }

      return realLoadWithXhr(...args);
    });
  });

  it("has a type and type name", function () {
    expect(ArcGisMapServerCatalogItem.type).toBe("esri-mapServer");
    expect(item.typeName).toBe(
      i18next.t("models.arcGisMapServerCatalogItem.name")
    );
  });

  it("supports splitting", function () {
    expect(item.disableSplitter).toBeFalsy();
  });

  it("supports zooming to extent", function () {
    expect(item.disableZoomTo).toBeFalsy();
  });

  it("supports preview", function () {
    expect(item.disableAboutData).toBeFalsy();
  });

  describe("loadMapItems", function () {
    it("can load all layers", async function () {
      runInAction(() => {
        item = new ArcGisMapServerCatalogItem("test", new Terria());
        item.setTrait(CommonStrata.definition, "url", mapServerUrl);
      });
      await item.loadMapItems();
      expect(item.layersArray.length).toBe(74);
    });

    it("can load specific layers", async function () {
      runInAction(() => {
        item = new ArcGisMapServerCatalogItem("test", new Terria());
        item.setTrait(CommonStrata.definition, "url", mapServerUrl);
        item.setTrait(CommonStrata.definition, "layers", "31,32");
      });
      await item.loadMapItems();
      expect(item.layersArray.length).toBe(2);
    });

    it("can load specific layers - and ignore invalid layers", async function () {
      runInAction(() => {
        item = new ArcGisMapServerCatalogItem("test", new Terria());
        item.setTrait(CommonStrata.definition, "url", mapServerUrl);
        item.setTrait(CommonStrata.definition, "layers", "31,32,ahhhh,200");
      });
      await item.loadMapItems();
      expect(item.layersArray.length).toBe(2);
    });

    it("can load a single layer given in the URL", async function () {
      runInAction(() => {
        item = new ArcGisMapServerCatalogItem("test", new Terria());
        item.setTrait(CommonStrata.definition, "url", singleLayerUrl);
      });
      await item.loadMapItems();
      expect(item.layersArray.length).toBe(1);
      expect(item.layers).toBe("31");
    });

    describe("when tokenUrl is set", function () {
      beforeEach(() => {
        runInAction(() => {
          item = new ArcGisMapServerCatalogItem("test", new Terria());
          item.setTrait(CommonStrata.definition, "url", singleLayerUrl);
          item.setTrait(
            CommonStrata.definition,
            "tokenUrl",
            "http://example.com/token"
          );
        });
      });

      it("fetches the token", async function () {
        await item.loadMapItems();
        expect(loadWithXhr.load.calls.argsFor(0)[0]).toBe(
          "http://example.com/token"
        );
      });

      it("adds the token to subsequent requests", async function () {
        await item.loadMapItems();
        const tokenre = /token=fakeToken/;
        expect(tokenre.test(loadWithXhr.load.calls.argsFor(1)[0])).toBeTruthy();
        expect(tokenre.test(loadWithXhr.load.calls.argsFor(2)[0])).toBeTruthy();
        expect(tokenre.test(loadWithXhr.load.calls.argsFor(3)[0])).toBeTruthy();
      });

      it("passess the token to the imageryProvider", async function () {
        await item.loadMapItems();
        const imageryProvider: any = item.mapItems[0].imageryProvider;
        expect(imageryProvider.token).toBe("fakeToken");
      });
    });
  });

  describe("after loading", function () {
    beforeEach(async function () {
      runInAction(() => {
        item = new ArcGisMapServerCatalogItem("test", new Terria());
        item.setTrait(CommonStrata.definition, "url", mapServerUrl);
      });
      await item.loadMapItems();
    });

    it("returns exactly one mapItems", function () {
      expect(item.mapItems.length).toBe(1);
    });

    describe("the mapItem", function () {
      it("correctly sets `alpha`", function () {
        runInAction(() =>
          item.setTrait(CommonStrata.definition, "opacity", 0.42)
        );
        expect(item.mapItems[0].alpha).toBe(0.42);
      });

      it("correctly sets `show`", function () {
        runInAction(() =>
          item.setTrait(CommonStrata.definition, "show", false)
        );
        expect(item.mapItems[0].show).toBe(false);
      });

      describe("imageryProvider", function () {
        let imageryProvider: ArcGisMapServerImageryProvider;

        beforeEach(async function () {
          runInAction(() => {
            item.setTrait(CommonStrata.definition, "layers", "31");
            item.setTrait(CommonStrata.definition, "parameters", {
              foo: "bar"
            });
            item.setTrait(CommonStrata.definition, "minScaleDenominator", 1);
            item.setTrait(
              CommonStrata.definition,
              "hideLayerAfterMinScaleDenominator",
              true
            );
          });

          await item.loadMapItems();
          imageryProvider = item.mapItems[0]
            .imageryProvider as ArcGisMapServerImageryProvider;
        });

        it("should be an ArcGisMapServerImageryProvider", function () {
          expect(
            imageryProvider instanceof ArcGisMapServerImageryProvider
          ).toBeTruthy();
        });

        it("sets the URL correctly", function () {
          expect(imageryProvider.url).toBe(mapServerUrl + "/");
        });

        it("sets the layers correctly", function () {
          expect(imageryProvider.layers).toBe("31");
        });

        it("converts layer names to layer ids when constructing imagery provider", async function () {
          item.setTrait(
            CommonStrata.definition,
            "layers",
            "Offshore_Rocks_And_Wrecks"
          );
          await item.loadMapItems();
          const imageryProvider = item.mapItems[0]
            .imageryProvider as ArcGisMapServerImageryProvider;
          expect(imageryProvider.layers).toBe("31");
        });

        it("tilingScheme should be a WebMercatorTilingScheme", function () {
          expect(
            imageryProvider.tilingScheme instanceof WebMercatorTilingScheme
          ).toBeTruthy();
        });

        it("sets the maximumLevel", function () {
          expect(imageryProvider.maximumLevel).toBe(13);
        });

        it("passes on request parameters", function () {
          expect(imageryProvider.parameters).toEqual(item.parameters);
        });

        it("correctly sets enablePickFeatures", function () {
          expect(imageryProvider.enablePickFeatures).toBe(true);
        });

        it("show scaleWorkbenchInfo when hideLayerAfterMinScaleDenominator", function () {
          item.setTrait(
            CommonStrata.definition,
            "hideLayerAfterMinScaleDenominator",
            true
          );
          spyOn(item.terria, "raiseErrorToUser");
          imageryProvider.requestImage(0, 0, 100);
          expect(item.scaleWorkbenchInfo).toBeDefined();
        });

        it("usePreCachedTilesIfAvailable = false if requesting specific layers", async function () {
          runInAction(() => {
            item = new ArcGisMapServerCatalogItem("test", new Terria());
            item.setTrait(
              CommonStrata.definition,
              "url",
              "http://www.example.com/LayerWithTiles/MapServer"
            );
            item.setTrait(CommonStrata.definition, "layers", "0");
          });
          await item.loadMapItems();

          expect(item.layersArray.length).toBe(1);

          imageryProvider = item.mapItems[0]
            .imageryProvider as ArcGisMapServerImageryProvider;
          expect(imageryProvider.usingPrecachedTiles).toBe(false);
          expect(item.usePreCachedTilesIfAvailable).toBe(false);
        });

        it("usePreCachedTilesIfAvailable = false if requesting layer ID in url path", async function () {
          runInAction(() => {
            item = new ArcGisMapServerCatalogItem("test", new Terria());
            item.setTrait(
              CommonStrata.definition,
              "url",
              "http://www.example.com/LayerWithTiles/MapServer/1"
            );
          });
          await item.loadMapItems();

          expect(item.layersArray.length).toBe(1);

          imageryProvider = item.mapItems[0]
            .imageryProvider as ArcGisMapServerImageryProvider;
          expect(imageryProvider.usingPrecachedTiles).toBe(false);
          expect(item.usePreCachedTilesIfAvailable).toBe(false);
        });

        it("usePreCachedTilesIfAvailable = false if parameters have been specified", async function () {
          runInAction(() => {
            item = new ArcGisMapServerCatalogItem("test", new Terria());
            item.setTrait(
              CommonStrata.definition,
              "url",
              "http://www.example.com/LayerWithTiles/MapServer"
            );
            item.setTrait(CommonStrata.definition, "layers", undefined);
            item.setTrait(CommonStrata.definition, "parameters", {
              test: "something"
            });
          });
          await item.loadMapItems();

          expect(item.parameters).toEqual({ test: "something" });

          imageryProvider = item.mapItems[0]
            .imageryProvider as ArcGisMapServerImageryProvider;
          expect(imageryProvider.usingPrecachedTiles).toBe(false);
          expect(item.usePreCachedTilesIfAvailable).toBe(false);
        });

        it("usePreCachedTilesIfAvailable = true if not requesting specific layers", async function () {
          runInAction(() => {
            item = new ArcGisMapServerCatalogItem("test", new Terria());
            item.setTrait(
              CommonStrata.definition,
              "url",
              "http://www.example.com/LayerWithTiles/MapServer"
            );
            item.setTrait(CommonStrata.definition, "layers", undefined);
          });
          await item.loadMapItems();
          expect(item.layersArray.length).toBe(2);

          imageryProvider = item.mapItems[0]
            .imageryProvider as ArcGisMapServerImageryProvider;
          expect(imageryProvider.usingPrecachedTiles).toBe(true);
          expect(item.usePreCachedTilesIfAvailable).toBe(true);
        });

        it("usePreCachedTilesIfAvailable = true if requesting all layers", async function () {
          runInAction(() => {
            item = new ArcGisMapServerCatalogItem("test", new Terria());
            item.setTrait(
              CommonStrata.definition,
              "url",
              "http://www.example.com/LayerWithTiles/MapServer"
            );
            item.setTrait(CommonStrata.definition, "layers", "0,1");
          });
          await item.loadMapItems();
          expect(item.layersArray.length).toBe(2);

          imageryProvider = item.mapItems[0]
            .imageryProvider as ArcGisMapServerImageryProvider;
          expect(imageryProvider.usingPrecachedTiles).toBe(true);
          expect(item.usePreCachedTilesIfAvailable).toBe(true);
        });
      });
    });

    it("defines the name - with no layers specified", function () {
      // Using name from MapServer metadata
      expect(item.name).toBe(
        "Australia 250K Topographic Hydrography and Marine Layers"
      );
    });

    it("defines the name - with single layer specified", function () {
      item.setTrait(CommonStrata.definition, "layers", "21");
      // Using name from layer 21 metadata
      expect(item.name).toBe("Watercourses All Rivers Labels");
    });

    it("defines the name - with multiple layers specified", function () {
      item.setTrait(CommonStrata.definition, "layers", "21,22");
      // Using name from MapServer metadata - we don't support combining names across multiple layers
      expect(item.name).toBe(
        "Australia 250K Topographic Hydrography and Marine Layers"
      );
    });

    it("defines the dataCustodian", function () {
      expect(item.dataCustodian).toBe("Geoscience Australia");
    });

    it("defines maximum scale - with no layers specified", function () {
      // With no layer specified, we expect rectangle to be calculated using all layer metadata

      expect(item.maximumScale).toBeDefined();
      expect(item.maximumScale).toEqual(0);
    });

    it("defines maximum scale - with single layer specified", function () {
      // With a single layer specified, we expect rectangle to be calculated using layer metadata

      item.setTrait(CommonStrata.definition, "layers", "3");

      expect(item.maximumScale).toBeDefined();
      expect(item.maximumScale).toEqual(70000);
    });

    it("defines maximum scale - with multiple layers specified", function () {
      // With a multiple layers specified, we expect rectangle to be a union of all calculated rectangles from each layer metadata.

      item.setTrait(CommonStrata.definition, "layers", "19,20");

      expect(item.maximumScale).toBeDefined();
      expect(item.maximumScale).toEqual(300001);
    });

    it("defines a rectangle - with no layers specified", function () {
      // With no layer specified, we expect rectangle to be calculated using MapServer metadata

      expect(item.rectangle).toBeDefined();
      expect(item.rectangle.west).toEqual(97.90759300700006);
      expect(item.rectangle.south).toEqual(-54.25906877199998);
      expect(item.rectangle.east).toEqual(167.2820957260001);
      expect(item.rectangle.north).toEqual(0.9835908000000587);
    });

    it("defines a rectangle - with single layer specified", function () {
      // With a single layer specified, we expect rectangle to be calculated using layer metadata

      item.setTrait(CommonStrata.definition, "layers", "3");

      expect(item.rectangle).toBeDefined();
      expect(item.rectangle.west).toEqual(113.11904000000004);
      expect(item.rectangle.south).toEqual(-43.66633999999999);
      expect(item.rectangle.east).toEqual(153.62995);
      expect(item.rectangle.north).toEqual(-9.063350000000014);
    });

    it("defines a rectangle - with multiple layers specified", function () {
      // With a multiple layers specified, we expect rectangle to be a union of all calculated rectangles from each layer metadata.

      item.setTrait(CommonStrata.definition, "layers", "4,5");

      expect(item.rectangle).toBeDefined();
      expect(item.rectangle.west).toEqual(112.92034999999998);
      expect(item.rectangle.south).toEqual(-43.65735999999998);
      expect(item.rectangle.east).toEqual(153.63570000000004);
      expect(item.rectangle.north).toEqual(-8.99857000000003);
    });

    it("defines info - no layer specified", function () {
      // With no layer specified, we expect to only get description and copyright text from MapServer metadata
      expect(item.info.map(({ name, content }) => [name, content])).toEqual([
        [
          i18next.t("models.arcGisMapServerCatalogItem.serviceDescription"),
          "This service has been created specifically for display in the National Map and the symbology displayed may not suit other mapping applications. The AusHydro dataset represents the Australia's surface hydrology at a national scale. It includes natural and man-made geographic features such as: watercourse areas, swamps, reservoirs, canals, etc. This product presents hydrology polygon, point and line features which topologically connect and forms a complete flow path network for the entire continent of Australia. The GEODATA 250K data are best suited to graphical applications. These data may vary greatly in quality depending on the method of capture and digitising specifications in place at the time of capture. These features include the culture, drainage, hydrography, waterbodies and marine themes. Some datasets reflects the increasing data from scale to scale. The data is sourced from Geoscience Australia 250K Topographic data and AusHydro_V_2_0 data."
        ],
        [
          i18next.t("models.arcGisMapServerCatalogItem.copyrightText"),
          "Geoscience Australia, AusHydro Contributors (Geoscience Australia, NSW Department Land and Property Information, Queensland Department of National Resources and Mines, Victorian Department of Environment, Land, Water and Planning, South Australia Department for Environment, Water and Natural Resources, Tasmanian Department of Primary Industries, Parks, Water and Environment and Western Australian Land Information Authority (Landgate) )"
        ]
      ]);
    });

    it("defines info - with single layer specified", function () {
      // With a single layer specified, we expect to get description and copyright text from Layer metadata (in addition to description from MapServer metadata)
      item.setTrait(CommonStrata.definition, "layers", "0");
      expect(item.info.map(({ name, content }) => [name, content])).toEqual([
        [
          i18next.t("models.arcGisMapServerCatalogItem.dataDescription"),
          "This is a customised layer to show the user of the web map service where the 250K data labels are not appropriate to use past between these scales (National Scale to 1:300,000 Scale)."
        ],
        [
          i18next.t("models.arcGisMapServerCatalogItem.serviceDescription"),
          "This service has been created specifically for display in the National Map and the symbology displayed may not suit other mapping applications. The AusHydro dataset represents the Australia's surface hydrology at a national scale. It includes natural and man-made geographic features such as: watercourse areas, swamps, reservoirs, canals, etc. This product presents hydrology polygon, point and line features which topologically connect and forms a complete flow path network for the entire continent of Australia. The GEODATA 250K data are best suited to graphical applications. These data may vary greatly in quality depending on the method of capture and digitising specifications in place at the time of capture. These features include the culture, drainage, hydrography, waterbodies and marine themes. Some datasets reflects the increasing data from scale to scale. The data is sourced from Geoscience Australia 250K Topographic data and AusHydro_V_2_0 data."
        ],
        [
          i18next.t("models.arcGisMapServerCatalogItem.copyrightText"),
          "Geoscience Australia"
        ]
      ]);
    });

    it("defines info - with multiple layers specified", function () {
      // With a multiple layers specified, we expect to only get description and copyright text from MapServer metadata.
      // We currently don't support showing description and copyright text if more than 1 layer is specified
      item.setTrait(CommonStrata.definition, "layers", "0,1");
      expect(item.info.map(({ name, content }) => [name, content])).toEqual([
        [
          i18next.t("models.arcGisMapServerCatalogItem.serviceDescription"),
          "This service has been created specifically for display in the National Map and the symbology displayed may not suit other mapping applications. The AusHydro dataset represents the Australia's surface hydrology at a national scale. It includes natural and man-made geographic features such as: watercourse areas, swamps, reservoirs, canals, etc. This product presents hydrology polygon, point and line features which topologically connect and forms a complete flow path network for the entire continent of Australia. The GEODATA 250K data are best suited to graphical applications. These data may vary greatly in quality depending on the method of capture and digitising specifications in place at the time of capture. These features include the culture, drainage, hydrography, waterbodies and marine themes. Some datasets reflects the increasing data from scale to scale. The data is sourced from Geoscience Australia 250K Topographic data and AusHydro_V_2_0 data."
        ],
        [
          i18next.t("models.arcGisMapServerCatalogItem.copyrightText"),
          "Geoscience Australia, AusHydro Contributors (Geoscience Australia, NSW Department Land and Property Information, Queensland Department of National Resources and Mines, Victorian Department of Environment, Land, Water and Planning, South Australia Department for Environment, Water and Natural Resources, Tasmanian Department of Primary Industries, Parks, Water and Environment and Western Australian Land Information Authority (Landgate) )"
        ]
      ]);
    });

    it("defines legends - with no layers specified", function () {
      expect(item.legends).toBeDefined();
      expect(item.legends?.length).toBe(1);
      expect(item.legends[0].items.length).toBe(30);
      expect(item.legends[0].items[0].imageUrl).toBe(
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAAANQTFRF/v//pgZx/wAAAAF0Uk5TAEDm2GYAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAAPSURBVCiRY2AYBaNgqAIAAr4AAU6byIwAAAAASUVORK5CYII="
      );
    });

    it("defines legends - with single layer specified - with duplicate legends", function () {
      item.setTrait(CommonStrata.definition, "layers", "61");

      expect(item.legends).toBeDefined();

      expect(item.legends?.length).toBe(1);
      expect(item.legends[0].items.length).toBe(2); // Note we expect 2 legends here instead of 3 because there are two legends with the same imageUrl
      expect(item.legends[0].items[0].imageUrl).toBe(
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAAAlQTFRF/v//dLP/z9roPw4QXgAAAAN0Uk5TAP//RFDWIQAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABxJREFUKJFjYCATMGIFECkmLGBUalQKf7IhAwAAvwYDdd8LbKYAAAAASUVORK5CYII="
      );
      expect(item.legends[0].items[1].imageUrl).toBe(
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAAAlQTFRF/v//vtL/4+XainG3SQAAAAN0Uk5TAP//RFDWIQAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABxJREFUKJFjYCATMGIFECkmLGBUalQKf7IhAwAAvwYDdd8LbKYAAAAASUVORK5CYII="
      );
    });

    it("defines legends - with single layer specified - with unique legends", function () {
      item.setTrait(CommonStrata.definition, "layers", "67");

      expect(item.legends).toBeDefined();

      expect(item.legends?.length).toBe(1);
      expect(item.legends[0].items.length).toBe(2);
      expect(item.legends[0].items[0].imageUrl).toBe(
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAAAZQTFRF/v//a5HBXiVtZwAAAAJ0Uk5TAP9bkSK1AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAFklEQVQokWNgGAVUAIxYASGpUUAhAAA/EgAtc3XmGwAAAABJRU5ErkJggg=="
      );
      expect(item.legends[0].items[1].imageUrl).toBe(
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAAAZQTFRF/v//a5HBXiVtZwAAAAJ0Uk5TAP9bkSK1AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAFUlEQVQokWNgGAW0BYxYwUC7angAAB+/ABeuicGgAAAAAElFTkSuQmCC"
      );
    });

    it("defines legends - with multiple layers specified", function () {
      item.setTrait(
        CommonStrata.definition,
        "layers",
        "58,59,60,61,62,63,64,65,66,67"
      );

      expect(item.legends).toBeDefined();
      expect(item.legends?.length).toBe(1);
      expect(item.legends[0].items.length).toBe(6);
    });
  });

  describe("time-enabled layer", function () {
    it("can load a layer, querying time without window", async function () {
      runInAction(() => {
        item = new ArcGisMapServerCatalogItem("test", new Terria());
        item.setTrait(
          CommonStrata.definition,
          "url",
          "http://example.com/cadastre_history/MapServer"
        );
      });
      await item.loadMapItems();
      if (item.discreteTimes !== undefined) {
        expect(item.discreteTimes.length).toBe(781);
      }
      expect(item.startTime).toBe("2004-11-26T09:43:22.000000000Z");
      expect(item.stopTime).toBe("2019-11-03T14:00:00.000000000Z");
      const expectedTimeQueryString = 1572789600000; // from json file
      const imageryProvider = item.mapItems[0]
        .imageryProvider as ArcGisMapServerImageryProvider;
      expect(imageryProvider.parameters.time).toBe(expectedTimeQueryString);
    });

    it("can load a layer, querying time without window if timeWindowDuration is not defined", async function () {
      runInAction(() => {
        item = new ArcGisMapServerCatalogItem("test", new Terria());
        item.setTrait(
          CommonStrata.definition,
          "url",
          "http://example.com/cadastre_history/MapServer"
        );
        item.setTrait(CommonStrata.user, "timeWindowUnit", "year");
      });
      const defaultCurrentTime = 1572789600000; // from json file
      await item.loadMapItems();
      const expectedTimeQueryString = defaultCurrentTime;
      const imageryProvider = item.mapItems[0]
        .imageryProvider as ArcGisMapServerImageryProvider;
      expect(imageryProvider.parameters.time).toBe(expectedTimeQueryString);
    });

    it("can load a layer, querying time without window if timeWindowUnit is not defined", async function () {
      runInAction(() => {
        item = new ArcGisMapServerCatalogItem("test", new Terria());
        item.setTrait(
          CommonStrata.definition,
          "url",
          "http://example.com/cadastre_history/MapServer"
        );
        item.setTrait(CommonStrata.user, "timeWindowDuration", 2);
      });
      const defaultCurrentTime = 1572789600000; // from json file
      await item.loadMapItems();
      const expectedTimeQueryString = defaultCurrentTime;
      const imageryProvider = item.mapItems[0]
        .imageryProvider as ArcGisMapServerImageryProvider;
      expect(imageryProvider.parameters.time).toBe(expectedTimeQueryString);
    });

    it("can load a layer, querying time with default forward window", async function () {
      runInAction(() => {
        item = new ArcGisMapServerCatalogItem("test", new Terria());
        item.setTrait(
          CommonStrata.definition,
          "url",
          "http://example.com/cadastre_history/MapServer"
        );
        item.setTrait(CommonStrata.user, "timeWindowDuration", 2);
        item.setTrait(CommonStrata.user, "timeWindowUnit", "week");
      });
      const defaultCurrentTime = 1572789600000; // from json file
      const twoWeekTime = 14 * 24 * 3600 * 1000;
      const toTime = defaultCurrentTime + twoWeekTime;
      await item.loadMapItems();
      const expectedTimeQueryString = `${defaultCurrentTime},${toTime}`;
      const imageryProvider = item.mapItems[0]
        .imageryProvider as ArcGisMapServerImageryProvider;
      expect(imageryProvider.parameters.time).toBe(expectedTimeQueryString);
    });

    it("can load a layer, querying time with explicit forward window", async function () {
      runInAction(() => {
        item = new ArcGisMapServerCatalogItem("test", new Terria());
        item.setTrait(
          CommonStrata.definition,
          "url",
          "http://example.com/cadastre_history/MapServer"
        );
        item.setTrait(CommonStrata.user, "timeWindowDuration", 2);
        item.setTrait(CommonStrata.user, "timeWindowUnit", "week");
        item.setTrait(CommonStrata.user, "isForwardTimeWindow", true);
      });
      const defaultCurrentTime = 1572789600000; // from json file
      const twoWeekTime = 14 * 24 * 3600 * 1000;
      const toTime = defaultCurrentTime + twoWeekTime;
      await item.loadMapItems();
      const expectedTimeQueryString = `${defaultCurrentTime},${toTime}`;
      const imageryProvider = item.mapItems[0]
        .imageryProvider as ArcGisMapServerImageryProvider;
      expect(imageryProvider.parameters.time).toBe(expectedTimeQueryString);
    });

    it("can load a layer, querying time with backward time window", async function () {
      runInAction(() => {
        item = new ArcGisMapServerCatalogItem("test", new Terria());
        item.setTrait(
          CommonStrata.definition,
          "url",
          "http://example.com/cadastre_history/MapServer"
        );
        item.setTrait(CommonStrata.user, "timeWindowDuration", 2);
        item.setTrait(CommonStrata.user, "timeWindowUnit", "week");
        item.setTrait(CommonStrata.user, "isForwardTimeWindow", false);
      });
      const defaultCurrentTime = 1572789600000; // from json file
      const twoWeekTime = 14 * 24 * 3600 * 1000;
      const fromTime = defaultCurrentTime - twoWeekTime;
      await item.loadMapItems();
      const expectedTimeQueryString = `${fromTime},${defaultCurrentTime}`;
      const imageryProvider = item.mapItems[0]
        .imageryProvider as ArcGisMapServerImageryProvider;
      expect(imageryProvider.parameters.time).toBe(expectedTimeQueryString);
    });

    it("can load a layer, querying time without window if timeWindowDuration is 0", async function () {
      runInAction(() => {
        item = new ArcGisMapServerCatalogItem("test", new Terria());
        item.setTrait(
          CommonStrata.definition,
          "url",
          "http://example.com/cadastre_history/MapServer"
        );
        item.setTrait(CommonStrata.user, "timeWindowDuration", 0);
        item.setTrait(CommonStrata.user, "timeWindowUnit", "year");
      });
      const defaultCurrentTime = 1572789600000; // from json file
      await item.loadMapItems();
      const imageryProvider = item.mapItems[0]
        .imageryProvider as ArcGisMapServerImageryProvider;
      expect(imageryProvider.parameters.time).toBe(defaultCurrentTime);
    });

    it("can load a layer, querying time without window if timeWindowUnit is invalid", async function () {
      runInAction(() => {
        item = new ArcGisMapServerCatalogItem("test", new Terria());
        item.setTrait(
          CommonStrata.definition,
          "url",
          "http://example.com/cadastre_history/MapServer"
        );
        item.setTrait(CommonStrata.user, "timeWindowDuration", 2);
        item.setTrait(CommonStrata.user, "timeWindowUnit", "fortnight");
      });
      const defaultCurrentTime = 1572789600000; // from json file
      await item.loadMapItems();
      const imageryProvider = item.mapItems[0]
        .imageryProvider as ArcGisMapServerImageryProvider;
      expect(imageryProvider.parameters.time).toBe(defaultCurrentTime);
    });
  });

  describe("TilesOnly + single fused map cache server", function () {
    beforeEach(async () => {
      runInAction(() => {
        item = new ArcGisMapServerCatalogItem("test", new Terria());
        item.setTrait(
          CommonStrata.definition,
          "url",
          "http://www.example.com/SingleFusedMapCache/MapServer"
        );
      });
      (await item.loadMapItems()).throwIfError();
    });

    it("doesn't request specific layers", function () {
      expect(item.layers).toBeUndefined();
      expect(item.layersArray.length).toBe(0);
    });

    it("defines legends", function () {
      expect(item.legends.length).toBe(1);
      expect(item.legends[0].items.length).toBe(3);
    });

    it("defines name", function () {
      expect(item.name).toBe("Layers");
    });

    it("defines info", function () {
      expect(item.info.map(({ name, content }) => [name, content])).toEqual([
        [
          i18next.t("models.arcGisMapServerCatalogItem.serviceDescription"),
          "Some test description"
        ],
        [
          i18next.t("models.arcGisMapServerCatalogItem.copyrightText"),
          "Some copyright"
        ]
      ]);
    });

    it("defines maximum scale", function () {
      expect(item.maximumScale).toBeDefined();
      expect(item.maximumScale).toEqual(0);
    });

    it("defines a rectangle", function () {
      expect(item.rectangle).toBeDefined();
      expect(item.rectangle.west).toEqual(140.9657708472755);
      expect(item.rectangle.south).toEqual(-38.86193867467817);
      expect(item.rectangle.east).toEqual(149.47499857774622);
      expect(item.rectangle.north).toEqual(-34.124254130456116);
    });
  });

  describe("rectangle", function () {
    beforeEach(function () {
      jasmine.Ajax.install();
    });

    afterEach(function () {
      jasmine.Ajax.uninstall();
    });

    it("can generate rectangle from an extent in CRS EPSG:7844", async function () {
      mapServerJson.fullExtent.spatialReference.wkid = 7844;

      jasmine.Ajax.stubRequest(/.*?\/foo\/MapServer.*/).andReturn({
        responseJSON: mapServerJson
      });

      runInAction(() => {
        item = new ArcGisMapServerCatalogItem("test", new Terria());
        item.setTrait(
          CommonStrata.definition,
          "url",
          "http://example.com/foo/MapServer"
        );
      });

      await item.loadMapItems();

      runInAction(() => {
        expect(round4(item.rectangle.east)).toBe(169.1615);
        expect(round4(item.rectangle.west)).toBe(100.1444);
        expect(round4(item.rectangle.north)).toBe(-2.3883);
        expect(round4(item.rectangle.south)).toBe(-49.9841);
      });
    });
  });
});

const digits4 = Math.pow(10, 4);
const round4 = (num: number | undefined) =>
  num !== undefined ? Math.floor(num * digits4) / digits4 : undefined;
