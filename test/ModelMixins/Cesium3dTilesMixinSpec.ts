import { runInAction } from "mobx";
import Terria from "../../lib/Models/Terria";
import Cesium3DTilesCatalogItem from "../../lib/Models/Catalog/CatalogItems/Cesium3DTilesCatalogItem";
import ClippingPlaneCollection from "terriajs-cesium/Source/Scene/ClippingPlaneCollection";
import ClippingPlane from "terriajs-cesium/Source/Scene/ClippingPlane";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Color from "terriajs-cesium/Source/Core/Color";
import Matrix4 from "terriajs-cesium/Source/Core/Matrix4";
import Cesium3DTileset from "terriajs-cesium/Source/Scene/Cesium3DTileset";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import Cesium3DTileFeature from "terriajs-cesium/Source/Scene/Cesium3DTileFeature";

describe("Cesium3dTilesMixin", function () {
  let terria: Terria;
  let cesium3dTiles: Cesium3DTilesCatalogItem;

  describe(" - loadClippingPlanes", function () {
    beforeEach(async function () {
      terria = new Terria({
        baseUrl: "./"
      });
      cesium3dTiles = new Cesium3DTilesCatalogItem("test", terria);

      runInAction(() => {
        cesium3dTiles.setTrait(
          "definition",
          "url",
          "test/Cesium3DTiles/tileset.json"
        );

        cesium3dTiles.setTrait("definition", "clippingPlanes", {
          enabled: true,
          unionClippingRegions: false,
          planes: [
            {
              normal: [-1, 0.0, 0.0],
              distance: 40
            }
          ],
          modelMatrix: [
            1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0
          ],
          edgeColor: "blue",
          edgeWidth: 12.0
        });
      });

      await cesium3dTiles.loadMetadata();
    });

    it(" - Property ClippingPlaneCollection to be defined", function () {
      expect(cesium3dTiles.clippingPlaneCollection).toBeDefined();
    });

    it(" - Property ClippingPlaneCollection is a ClippingPlaneCollection type", function () {
      expect(
        cesium3dTiles.clippingPlaneCollection instanceof ClippingPlaneCollection
      ).toBe(true);
    });

    it(" - ClippingPlaneCollection must contain a ClippingPlane", function () {
      const cpc = cesium3dTiles.clippingPlaneCollection;
      expect(
        cpc?.contains(
          new ClippingPlane(Cartesian3.fromArray([-1, 0.0, 0.0]), 40)
        )
      ).toBe(true);
    });

    it(" - ClippingPlaneCollection must be enabled", function () {
      const cpc = cesium3dTiles.clippingPlaneCollection;
      expect(cpc?.enabled).toBe(true);
    });

    it(" - ClippingPlaneCollection unionClippingRegions must be false", function () {
      const cpc = cesium3dTiles.clippingPlaneCollection;
      expect(cpc?.unionClippingRegions).toBe(false);
    });

    it(" - ClippingPlaneCollection edgeWidth must be 12.0", function () {
      const cpc = cesium3dTiles.clippingPlaneCollection;
      expect(cpc?.edgeWidth).toBe(12.0);
    });

    it(" - ClippingPlaneCollection edgeColor must be Blue", function () {
      const cpc = cesium3dTiles.clippingPlaneCollection;
      expect(cpc?.edgeColor.equals(Color.BLUE)).toBe(true);
    });

    it(" - ClippingPlaneCollection must content Identity Matrix as modelMatrix", function () {
      const cpc = cesium3dTiles.clippingPlaneCollection;
      expect(cpc?.modelMatrix.equals(Matrix4.IDENTITY)).toBe(true);
    });
  });

  describe("tileset style", function () {
    describe("show expression from filter", function () {
      it("casts the property to number", async function () {
        terria = new Terria({
          baseUrl: "./"
        });
        cesium3dTiles = new Cesium3DTilesCatalogItem("test", terria);
        cesium3dTiles.setTrait(
          CommonStrata.user,
          "url",
          "test/Cesium3DTiles/tileset.json"
        );
        const filter = cesium3dTiles.addObject(
          CommonStrata.user,
          "filters",
          "level-filter"
        );
        filter?.setTrait(CommonStrata.user, "name", "Level filter");
        filter?.setTrait(CommonStrata.user, "property", "level");
        filter?.setTrait(CommonStrata.user, "minimumValue", 0);
        filter?.setTrait(CommonStrata.user, "maximumValue", 42);
        filter?.setTrait(CommonStrata.user, "minimumShown", 10);
        filter?.setTrait(CommonStrata.user, "maximumShown", 20);
        await cesium3dTiles.loadMapItems();
        const tileset = cesium3dTiles.mapItems[0] as Cesium3DTileset;
        const show = tileset.style?.show;
        const expr = (show as any)?.expression as string;
        expect(expr).toBeDefined();
        if (expr) {
          const [cond1, cond2] = expr.split("&&");
          expect(cond1.trim().startsWith("Number(${feature['level']})")).toBe(
            true
          );
          expect(cond2.trim().startsWith("Number(${feature['level']})")).toBe(
            true
          );
        }
      });
    });
  });

  describe("getSelectorForFeature", function () {
    it("returns a style expression for selecting the given feature if it can be constructed", function () {
      const item = new Cesium3DTilesCatalogItem("test", terria);
      item.setTrait(CommonStrata.user, "featureIdProperties", [
        "locality",
        "building-no"
      ]);
      const fakeTileFeature = new Cesium3DTileFeature();
      spyOn(fakeTileFeature, "getProperty").and.callFake((property: string) =>
        property === "locality"
          ? "foo"
          : property === "building-no"
            ? 4242
            : undefined
      );
      const selector = item.getSelectorForFeature(fakeTileFeature);
      expect(selector).toBe('${building-no} === 4242 && ${locality} === "foo"');
    });
  });
});
