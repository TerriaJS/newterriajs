import {
  convertEsriLineStyleToCesiumDashNumber,
  convertCesiumDashNumberToDashArray
} from "../../../../lib/Models/Catalog/Esri/esriStyleToTableStyle";

describe("esriLineStyle", function () {
  describe("corect cesium values", function () {
    it("esriSLSDot", function () {
      const value = convertEsriLineStyleToCesiumDashNumber("esriSLSDot");
      expect(value).toEqual(7);
    });

    it("esriSLSDashDot", function () {
      const value = convertEsriLineStyleToCesiumDashNumber("esriSLSDashDot");
      expect(value).toEqual(2017);
    });

    it("esriSLSDashDotDot", function () {
      const value = convertEsriLineStyleToCesiumDashNumber("esriSLSDashDotDot");
      expect(value).toEqual(16273);
    });

    it("esriSLSLongDash", function () {
      const value = convertEsriLineStyleToCesiumDashNumber("esriSLSLongDash");
      expect(value).toEqual(2047);
    });

    it("esriSLSLongDashDot", function () {
      const value =
        convertEsriLineStyleToCesiumDashNumber("esriSLSLongDashDot");
      expect(value).toEqual(4081);
    });

    it("esriSLSShortDash", function () {
      const value = convertEsriLineStyleToCesiumDashNumber("esriSLSShortDash");
      expect(value).toEqual(4095);
    });

    it("esriSLSShortDot", function () {
      const value = convertEsriLineStyleToCesiumDashNumber("esriSLSShortDot");
      expect(value).toEqual(13107);
    });

    it("esriSLSShortDashDot", function () {
      const value = convertEsriLineStyleToCesiumDashNumber(
        "esriSLSShortDashDot"
      );
      expect(value).toEqual(8179);
    });

    it("esriSLSShortDashDotDot", function () {
      const value = convertEsriLineStyleToCesiumDashNumber(
        "esriSLSShortDashDotDot"
      );
      expect(value).toEqual(16281);
    });

    it("esriSLSNull", function () {
      const value = convertEsriLineStyleToCesiumDashNumber("esriSLSNull");
      expect(value).toBe(0);
    });

    it("esriSLSSolid", function () {
      const value = convertEsriLineStyleToCesiumDashNumber("esriSLSSolid");
      expect(value).toBe(255);
    });

    it("unknown", function () {
      const value = convertEsriLineStyleToCesiumDashNumber("unknown");
      expect(value).toBeUndefined();
    });
  });

  describe("corect leaflet values", function () {
    it("esriSLSDot", function () {
      const value = convertCesiumDashNumberToDashArray(7);
      expect(value).toEqual([1, 3]);
    });

    it("esriSLSDashDot", function () {
      const value = convertCesiumDashNumberToDashArray(2017);
      expect(value).toEqual([4, 3, 1, 3]);
    });

    it("esriSLSDashDotDot", function () {
      const value = convertCesiumDashNumberToDashArray(16273);
      expect(value).toEqual([8, 3, 1, 3, 1, 3]);
    });

    it("esriSLSLongDash", function () {
      const value = convertCesiumDashNumberToDashArray(2047);
      expect(value).toEqual([8, 3]);
    });

    it("esriSLSLongDashDot", function () {
      const value = convertCesiumDashNumberToDashArray(4081);
      expect(value).toEqual([8, 3, 1, 3]);
    });

    it("esriSLSShortDash", function () {
      const value = convertCesiumDashNumberToDashArray(4095);
      expect(value).toEqual([4, 1]);
    });

    it("esriSLSShortDot", function () {
      const value = convertCesiumDashNumberToDashArray(13107);
      expect(value).toEqual([1, 1]);
    });

    it("esriSLSShortDashDot", function () {
      const value = convertCesiumDashNumberToDashArray(8179);
      expect(value).toEqual([4, 1, 1, 1]);
    });

    it("esriSLSShortDashDotDot", function () {
      const value = convertCesiumDashNumberToDashArray(16281);
      expect(value).toEqual([4, 1, 1, 1, 1, 1]);
    });

    it("return default", function () {
      const value = convertCesiumDashNumberToDashArray(16547);
      expect(value).toEqual([4, 3]);
    });
  });
});
