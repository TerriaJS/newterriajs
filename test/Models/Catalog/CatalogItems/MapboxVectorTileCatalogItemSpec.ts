import { action } from "mobx";
import {
  Filter,
  GeomType,
  LineSymbolizer,
  PolygonSymbolizer
} from "protomaps-leaflet";
import ProtomapsImageryProvider from "../../../../lib/Map/ImageryProvider/ProtomapsImageryProvider";
import {
  filterFn,
  getFont,
  numberFn,
  numberOrFn
} from "../../../../lib/Map/Vector/Protomaps/mapboxStyleJsonToProtomaps";
import { ImageryParts } from "../../../../lib/ModelMixins/MappableMixin";
import MapboxVectorTileCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/MapboxVectorTileCatalogItem";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import updateModelFromJson from "../../../../lib/Models/Definition/updateModelFromJson";
import Terria from "../../../../lib/Models/Terria";

describe("MapboxVectorTileCatalogItem", function () {
  let mvt: MapboxVectorTileCatalogItem;

  beforeEach(function () {
    mvt = new MapboxVectorTileCatalogItem("test", new Terria());
  });

  it("has a type", function () {
    expect(MapboxVectorTileCatalogItem.type).toBe("mvt");
    expect(mvt.type).toBe("mvt");
  });

  describe("imageryProvider", function () {
    let imageryProvider: ProtomapsImageryProvider;

    beforeEach(function () {
      mvt.setTrait(CommonStrata.user, "url", "http://test");
      mvt.setTrait(CommonStrata.user, "layer", "test-layer");
    });

    it("is an instance of ProtomapsImageryProvider", async function () {
      await mvt.loadMapItems();
      if (!ImageryParts.is(mvt.mapItems[0]))
        throw new Error("Expected MapItem to be an ImageryParts");

      imageryProvider = mvt.mapItems[0]
        .imageryProvider as ProtomapsImageryProvider;

      expect(imageryProvider instanceof ProtomapsImageryProvider).toBeTruthy();
    });

    it("sets min/max/native zoom properties", async function () {
      mvt.setTrait(CommonStrata.user, "minimumZoom", 1);
      mvt.setTrait(CommonStrata.user, "maximumZoom", 20);
      mvt.setTrait(CommonStrata.user, "maximumNativeZoom", 10);

      await mvt.loadMapItems();
      if (!ImageryParts.is(mvt.mapItems[0]))
        throw new Error("Expected MapItem to be an ImageryParts");

      imageryProvider = mvt.mapItems[0]
        .imageryProvider as ProtomapsImageryProvider;

      // Note: ProtomapsImageryProvider uses softMinimumLevel instead of minimumLevel
      expect(imageryProvider.minimumLevel).toBe(0);
      expect(imageryProvider.softMinimumLevel).toBe(1);
      expect(imageryProvider.maximumLevel).toBe(20);
      expect(imageryProvider.maximumNativeZoom).toBe(10);
    });

    it("sets idProperty", async function () {
      mvt.setTrait(CommonStrata.user, "idProperty", "id");

      await mvt.loadMapItems();
      if (!ImageryParts.is(mvt.mapItems[0]))
        throw new Error("Expected MapItem to be an ImageryParts");

      imageryProvider = mvt.mapItems[0]
        .imageryProvider as ProtomapsImageryProvider;

      expect(imageryProvider.idProperty).toBe("id");
    });
  });

  describe("legends", function () {
    it(
      "constructs a default legend from the definition",
      action(async function () {
        mvt.setTrait(CommonStrata.user, "fillColor", "red");
        mvt.setTrait(CommonStrata.user, "lineColor", "yellow");
        mvt.setTrait(CommonStrata.user, "name", "Test");
        await mvt.loadMapItems();
        const legendItem = mvt.legends[0].items[0];
        expect(legendItem.color).toBe("red");
        expect(legendItem.outlineColor).toBe("yellow");
        expect(legendItem.outlineWidth).toBe(1);
        expect(legendItem.title).toBe("Test");
      })
    );
  });

  describe("paint rules", function () {
    it(
      "creates paint rules from simple styles",
      action(function () {
        mvt.setTrait(CommonStrata.user, "fillColor", "red");
        mvt.setTrait(CommonStrata.user, "lineColor", "yellow");
        mvt.setTrait(CommonStrata.user, "layer", "Test");
        expect(mvt.paintRules.length).toBe(2);
        expect(mvt.paintRules[0].dataLayer).toBe("Test");
        expect(mvt.paintRules[1].dataLayer).toBe("Test");
        expect(
          mvt.paintRules[0].symbolizer instanceof PolygonSymbolizer
        ).toBeTruthy();
        expect(
          mvt.paintRules[1].symbolizer instanceof LineSymbolizer
        ).toBeTruthy();
      })
    );
  });

  describe("highlight features", function () {
    let imageryProvider: ProtomapsImageryProvider;

    beforeEach(async () => {
      updateModelFromJson(mvt, CommonStrata.definition, {
        name: "Mapbox vector tiles Test",
        type: "mvt",
        url: "/test/mvt/nsw-lga-mvt/{z}/{x}/{y}.pbf",
        fillColor: "#ff0000",
        lineColor: "#ffff00",
        minimumZoom: 0,
        maximumNativeZoom: 11,
        maximumZoom: 28,
        idProperty: "LGA_CODE13",
        layer: "FID_LGA_2013_AUST"
      });

      await mvt.loadMapItems();

      if (!ImageryParts.is(mvt.mapItems[0]))
        throw new Error("Expected MapItem to be an ImageryParts");

      imageryProvider = mvt.mapItems[0]
        .imageryProvider as ProtomapsImageryProvider;
    });

    it("correctly picks features", async function () {
      // Get polygon
      const polygon = await imageryProvider.pickFeatures(
        1881,
        1229,
        11,
        2.630470869072516,
        -0.5932730847619763
      );
      expect(polygon.length).toBe(1);
      expect(polygon[0]?.properties?.LGA_CODE13).toBe("11450");

      // Select nothing
      const nothingToSelect = await imageryProvider.pickFeatures(
        1884,
        1230,
        11,
        2.6387404164527286,
        -0.5945282912087255
      );
      expect(nothingToSelect.length).toBe(0);
    });
  });

  /** Mapbox style json tests are adapted from from https://github.com/protomaps/protomaps-leaflet/blob/a08304417ef36fef03679976cd3e5a971fec19a2/test/json_style.test.ts
   * License: BSD-3-Clause
   * Copyright 2021-2024 Protomaps LLC
   * Full license https://github.com/protomaps/protomaps-leaflet/blob/main/LICENSE
   */
  describe("mapbox style json", function () {
    const emptyFeature = {
      props: {},
      geomType: GeomType.Point,
      numVertices: 0,
      geom: [],
      bbox: { minX: 0, minY: 0, maxX: 0, maxY: 0 }
    };

    let f: Filter | undefined;

    it("==", async () => {
      f = filterFn(["==", "building", "yes"]);
      expect(f(0, { ...emptyFeature, props: { building: "yes" } })).toBe(true);
    });
    it("!=", async () => {
      f = filterFn(["!=", "building", "yes"]);
      expect(!f(0, { ...emptyFeature, props: { building: "yes" } })).toBe(true);
      expect(f(0, { ...emptyFeature, props: { building: "no" } })).toBe(true);
    });
    it("<", async () => {
      f = filterFn(["<", "level", 3]);
      expect(f(0, { ...emptyFeature, props: { level: 2 } })).toBe(true);
      expect(!f(0, { ...emptyFeature, props: { level: 3 } })).toBe(true);
    });
    it("<=", async () => {
      f = filterFn(["<=", "level", 3]);
      expect(f(0, { ...emptyFeature, props: { level: 2 } })).toBe(true);
      expect(f(0, { ...emptyFeature, props: { level: 3 } })).toBe(true);
    });
    it(">", async () => {
      f = filterFn([">", "level", 3]);
      expect(f(0, { ...emptyFeature, props: { level: 4 } })).toBe(true);
      expect(!f(0, { ...emptyFeature, props: { level: 3 } })).toBe(true);
    });
    it(">=", async () => {
      f = filterFn([">=", "level", 3]);
      expect(f(0, { ...emptyFeature, props: { level: 4 } })).toBe(true);
      expect(f(0, { ...emptyFeature, props: { level: 3 } })).toBe(true);
    });
    it("in", async () => {
      f = filterFn(["in", "type", "foo", "bar"]);
      expect(f(0, { ...emptyFeature, props: { type: "foo" } })).toBe(true);
      expect(f(0, { ...emptyFeature, props: { type: "bar" } })).toBe(true);
      expect(!f(0, { ...emptyFeature, props: { type: "baz" } })).toBe(true);
    });
    it("!in", async () => {
      f = filterFn(["!in", "type", "foo", "bar"]);
      expect(!f(0, { ...emptyFeature, props: { type: "bar" } })).toBe(true);
      expect(f(0, { ...emptyFeature, props: { type: "baz" } })).toBe(true);
    });
    it("has", async () => {
      f = filterFn(["has", "type"]);
      expect(f(0, { ...emptyFeature, props: { type: "foo" } })).toBe(true);
      expect(!f(0, { ...emptyFeature, props: {} })).toBe(true);
    });
    it("!has", async () => {
      f = filterFn(["!has", "type"]);
      expect(!f(0, { ...emptyFeature, props: { type: "foo" } })).toBe(true);
      expect(f(0, { ...emptyFeature, props: {} })).toBe(true);
    });
    it("!", async () => {
      f = filterFn(["!", ["has", "type"]]);
      expect(!f(0, { ...emptyFeature, props: { type: "foo" } })).toBe(true);
      expect(f(0, { ...emptyFeature, props: {} })).toBe(true);
    });
    it("all", async () => {
      f = filterFn(["all", ["==", "building", "yes"], ["==", "type", "foo"]]);
      expect(!f(0, { ...emptyFeature, props: { building: "yes" } })).toBe(true);
      expect(!f(0, { ...emptyFeature, props: { type: "foo" } })).toBe(true);
      expect(
        f(0, { ...emptyFeature, props: { building: "yes", type: "foo" } })
      ).toBe(true);
    });
    it("any", async () => {
      f = filterFn(["any", ["==", "building", "yes"], ["==", "type", "foo"]]);
      expect(!f(0, { ...emptyFeature, props: {} })).toBe(true);
      expect(f(0, { ...emptyFeature, props: { building: "yes" } })).toBe(true);
      expect(f(0, { ...emptyFeature, props: { type: "foo" } })).toBe(true);
      expect(
        f(0, { ...emptyFeature, props: { building: "yes", type: "foo" } })
      ).toBe(true);
    });

    it("numberFn constant", async () => {
      let n = numberOrFn(5);
      expect(n).toEqual(5);
      n = numberOrFn(undefined);
      expect(n).toEqual(0);
    });

    it("numberFn function", async () => {
      const n = numberFn({
        base: 1,
        stops: [
          [14, 0],
          [16, 2]
        ]
      });
      expect(n.length).toEqual(1);
      expect(n(15)).toEqual(0);
      expect(n(16)).toEqual(1);
      expect(n(17)).toEqual(2);
    });

    it("numberFn interpolate", async () => {
      const n = numberFn([
        "interpolate",
        ["exponential", 1],
        ["zoom"],
        14,
        0,
        16,
        2
      ]);
      expect(n.length).toEqual(1);
      expect(n(15)).toEqual(0);
      expect(n(16)).toEqual(1);
      expect(n(17)).toEqual(2);
    });

    it("numberFn properties", async () => {
      const n = numberFn(["step", ["get", "scalerank"], 0, 1, 2, 3, 4]);
      expect(n.length).toEqual(2);
      expect(n(14, { ...emptyFeature, props: { scalerank: 0 } })).toEqual(0);
      expect(n(14, { ...emptyFeature, props: { scalerank: 1 } })).toEqual(2);
      expect(n(14, { ...emptyFeature, props: { scalerank: 3 } })).toEqual(4);
      expect(n(14, { ...emptyFeature, props: { scalerank: 4 } })).toEqual(4);
    });

    it("font", async () => {
      let n = getFont({ "text-font": ["Noto"], "text-size": 14 }, {});
      expect(n(1)).toEqual("14px sans-serif");

      n = getFont({ "text-font": ["Noto"], "text-size": 15 }, {});
      expect(n(1)).toEqual("15px sans-serif");

      n = getFont(
        { "text-font": ["Noto"], "text-size": 15 },
        { Noto: { face: "serif" } }
      );
      expect(n(1)).toEqual("15px serif");

      n = getFont(
        { "text-font": ["Boto", "Noto"], "text-size": 15 },
        { Noto: { face: "serif" }, Boto: { face: "Comic Sans" } }
      );
      expect(n(1)).toEqual("15px Comic Sans, serif");
    });

    it("font weight and style", async () => {
      let n = getFont(
        { "text-font": ["Noto"], "text-size": 15 },
        { Noto: { face: "serif", weight: 100 } }
      );
      expect(n(1)).toEqual("100 15px serif");
      n = getFont(
        { "text-font": ["Noto"], "text-size": 15 },
        { Noto: { face: "serif", style: "italic" } }
      );
      expect(n(1)).toEqual("italic 15px serif");
    });

    it("font size fn zoom", async () => {
      const n = getFont(
        {
          "text-font": ["Noto"],
          "text-size": {
            base: 1,
            stops: [
              [14, 1],
              [16, 3]
            ]
          }
        },
        {}
      );
      expect(n(15)).toEqual("1px sans-serif");
      expect(n(16)).toEqual("2px sans-serif");
      expect(n(17)).toEqual("3px sans-serif");
    });

    it("font size fn zoom props", async () => {
      const n = getFont(
        {
          "text-font": ["Noto"],
          "text-size": ["step", ["get", "scalerank"], 0, 1, 12, 2, 10]
        },
        {}
      );
      expect(n(14, { ...emptyFeature, props: { scalerank: 0 } })).toEqual(
        "0px sans-serif"
      );
      expect(n(14, { ...emptyFeature, props: { scalerank: 1 } })).toEqual(
        "12px sans-serif"
      );
      expect(n(14, { ...emptyFeature, props: { scalerank: 2 } })).toEqual(
        "10px sans-serif"
      );
    });
  });
});
