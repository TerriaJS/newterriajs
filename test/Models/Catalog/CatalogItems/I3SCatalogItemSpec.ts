import "../../../SpecMain";
import { reaction, runInAction } from "mobx";
import i18next from "i18next";
import Cesium3DTileColorBlendMode from "terriajs-cesium/Source/Scene/Cesium3DTileColorBlendMode";
import ShadowMode from "terriajs-cesium/Source/Scene/ShadowMode";
import Terria from "../../../../lib/Models/Terria";
import I3SCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/I3SCatalogItem";
import I3SDataProvider from "terriajs-cesium/Source/Scene/I3SDataProvider";
import Cesium3DTileset from "terriajs-cesium/Source/Scene/Cesium3DTileset";
import Resource from "terriajs-cesium/Source/Core/Resource";
import Cesium3DTileFeature from "terriajs-cesium/Source/Scene/Cesium3DTileFeature";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";

const mockLayerData = {
  href: "layers/0/",
  layerType: "3DObject",
  attributeStorageInfo: [],
  store: { rootNode: "mockRootNodeUrl", version: "1.6" },
  fullExtent: { xmin: 0, ymin: 1, xmax: 2, ymax: 3 },
  spatialReference: { wkid: 4326 },
  id: 0
};

const mockProviderData = {
  name: "mockProviderName",
  serviceVersion: "1.6",
  layers: [mockLayerData]
};

describe("I3SCatalogItemSpec", function () {
  let item: I3SCatalogItem;
  const testUrl = "/test/Cesium3DTiles/tileset.json";

  beforeAll(function () {
    spyOn(Resource.prototype, "fetchJson").and.callFake(function fetch() {
      return Promise.resolve(mockProviderData);
    });
    spyOn(Cesium3DTileset, "fromUrl").and.callFake(
      (_url: string, _options?: any) => {
        const tileset = new Cesium3DTileset({});
        /* @ts-expect-error Mock the root tile so that i3s property can be appended */
        tileset._root = {};
        return Promise.resolve(tileset);
      }
    );
  });

  beforeEach(function () {
    item = new I3SCatalogItem("test", new Terria());
    runInAction(() => {
      item.setTrait("definition", "url", testUrl);
      item.setTrait("definition", "allowFeaturePicking", true);
    });
  });

  it("should have a type and a typeName", function () {
    expect(I3SCatalogItem.type).toBe("i3s");
    expect(item.type).toBe("i3s");
    expect(item.typeName).toBe(i18next.t("core.dataType.i3s"));
  });

  it("supports zooming", function () {
    expect(item.disableZoomTo).toBeFalsy();
  });

  it("supports show info", function () {
    expect(item.disableAboutData).toBeFalsy();
  });

  it("is mappable", function () {
    expect(item.isMappable).toBeTruthy();
  });

  describe("after loading", function () {
    let dispose: () => void;
    beforeEach(async function () {
      try {
        await item.loadMapItems();
      } catch {}
      dispose = reaction(
        () => item.mapItems,
        () => {}
      );
    });

    afterEach(function () {
      dispose();
    });

    describe("mapItems", function () {
      it("has exactly 1 mapItem", function () {
        expect(item.mapItems.length).toBe(1);
      });

      describe("the mapItem", function () {
        it("should be a I3SDataProvider", function () {
          expect(item.mapItems[0] instanceof I3SDataProvider).toBeTruthy();
        });

        describe("the tileset", function () {
          it("sets `show`", function () {
            runInAction(() => item.setTrait("definition", "show", false));
            expect(item.mapItems[0].show).toBe(false);
          });

          it("sets the shadow mode", function () {
            runInAction(() => item.setTrait("definition", "shadows", "CAST"));
            const tileset = item.mapItems[0].layers[0].tileset;
            expect(tileset?.shadows).toBe(ShadowMode.CAST_ONLY);
          });

          it("sets the color blend mode", function () {
            runInAction(() => {
              item.setTrait("definition", "colorBlendMode", "REPLACE");
              const tileset = item.mapItems[0].layers[0].tileset;
              expect(tileset?.colorBlendMode).toBe(
                Cesium3DTileColorBlendMode.REPLACE
              );
            });
          });

          it("sets the color blend amount", function () {
            runInAction(() => {
              item.setTrait("user", "colorBlendAmount", 0.42);
              const tileset = item.mapItems[0].layers[0].tileset;
              expect(tileset?.colorBlendAmount).toBe(0.42);
            });
          });

          it("sets the shadow mode", function () {
            runInAction(() => item.setTrait("definition", "shadows", "CAST"));
            const tileset = item.mapItems[0].layers[0].tileset;
            expect(tileset?.shadows).toBe(ShadowMode.CAST_ONLY);
          });

          it("sets the style", function () {
            runInAction(() =>
              item.setTrait("definition", "style", {
                show: "${ZipCode} === '19341'"
              })
            );
            const tileset = item.mapItems[0].layers[0].tileset;
            expect(tileset?.style).toBe(item.cesiumTileStyle);
          });
        });
      });
    });
    it("correctly builds `Feature` from picked Cesium3DTileFeature", async function () {
      const picked = new Cesium3DTileFeature();
      /* @ts-expect-error - mock i3sNode */
      picked._content = {
        tile: {
          i3sNode: {
            parent: undefined,
            loadFields: () => new Promise((f) => f(null)),
            getFieldsForFeature: () => ({})
          }
        }
      };
      /* @ts-expect-error - mock featureId */
      picked._batchId = 0;

      const feature = await item.buildFeatureFromPickResult(
        Cartesian2.ZERO,
        picked
      );
      expect(feature).toBeDefined();
      if (feature) {
        expect(feature._cesium3DTileFeature).toBe(picked);
      }
    });
  });
});
