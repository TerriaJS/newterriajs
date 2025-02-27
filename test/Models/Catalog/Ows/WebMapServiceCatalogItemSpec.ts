import { autorun, runInAction } from "mobx";
import GeographicTilingScheme from "terriajs-cesium/Source/Core/GeographicTilingScheme";
import Resource from "terriajs-cesium/Source/Core/Resource";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import WebMapServiceImageryProvider from "terriajs-cesium/Source/Scene/WebMapServiceImageryProvider";
import { ImageryParts } from "../../../../lib/ModelMixins/MappableMixin";
import WebMapServiceCatalogItem from "../../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import Terria from "../../../../lib/Models/Terria";
import TerriaFeature from "../../../../lib/Models/Feature/Feature";

describe("WebMapServiceCatalogItem", function () {
  describe("derives getCapabilitiesUrl from url", () => {
    it("if getCapabilitiesUrl is not specified", function () {
      const terria = new Terria();
      const wms = new WebMapServiceCatalogItem("test", terria);
      wms.setTrait("definition", "url", "foo.bar.baz");
      expect(wms.getCapabilitiesUrl).toBeDefined();
      expect(wms.url).toBeDefined();
      expect(
        wms.getCapabilitiesUrl &&
          wms.getCapabilitiesUrl.indexOf(wms.url || "undefined") === 0
      ).toBe(true);

      expect(wms.useWmsVersion130).toBeTruthy();
    });

    it("for WMS 1.1.1", function () {
      const terria = new Terria();
      const wms = new WebMapServiceCatalogItem("test", terria);
      wms.setTrait(
        "definition",
        "url",
        "http://www.bom.gov.au/cgi-bin/ws/gis/ncc/cdio/wxs?service=WMS&version=1.1.1&request=GetCapabilities"
      );
      expect(wms.getCapabilitiesUrl).toBeDefined();
      expect(wms.url).toBeDefined();

      expect(wms.useWmsVersion130).toBeFalsy();
    });

    it("drops query bad parameters", function () {
      const terria = new Terria();
      const wms = new WebMapServiceCatalogItem("test", terria);
      wms.setTrait(
        "definition",
        "url",
        "http://www.bom.gov.au/cgi-bin/ws/gis/ncc/cdio/wxs?service=WMS&version=1.1.1&request=GetMap&format=something&allowed=yes"
      );
      expect(wms.getCapabilitiesUrl).toBeDefined();
      expect(wms.url).toBeDefined();

      const queryParameters = new URL(wms.getCapabilitiesUrl!).searchParams;
      expect(queryParameters.get("format")).toBeNull();
      expect(queryParameters.get("allowed")).toBe("yes");
    });
  });

  it("loads", function () {
    expect().nothing();
    const terria = new Terria();
    const wms = new WebMapServiceCatalogItem("test", terria);
    runInAction(() => {
      wms.setTrait("definition", "url", "test/WMS/single_metadata_url.xml");
      wms.setTrait("definition", "layers", "single_period");
    });
    return wms.loadMapItems();
  });

  it("loads - for WMS 1.1.1", function () {
    expect().nothing();
    const terria = new Terria();
    const wms = new WebMapServiceCatalogItem("test", terria);
    runInAction(() => {
      wms.setTrait("definition", "url", "test/WMS/wms_1_1_1.xml");
      wms.setTrait("definition", "useWmsVersion130", false);
    });
    return wms.loadMapItems();
  });

  describe("selects correct tilingScheme", () => {
    it("uses 4326 is no 3857", async function () {
      const terria = new Terria();
      const wms = new WebMapServiceCatalogItem("test", terria);
      runInAction(() => {
        wms.setTrait("definition", "url", "test/WMS/wms_crs.xml");
        wms.setTrait("definition", "layers", "ls8_nbart_geomedian_annual");
      });
      await wms.loadMapItems();

      expect(wms.crs).toBe("EPSG:4326");
      expect(wms.tilingScheme instanceof GeographicTilingScheme).toBeTruthy();
    });

    it("uses 3857 over 4326", async function () {
      const terria = new Terria();
      const wms = new WebMapServiceCatalogItem("test", terria);
      runInAction(() => {
        wms.setTrait("definition", "url", "test/WMS/wms_nested_groups.xml");
        wms.setTrait("definition", "layers", "ls8_nbart_geomedian_annual");
      });
      await wms.loadMapItems();

      expect(wms.crs).toBe("EPSG:3857");
      expect(wms.tilingScheme instanceof WebMercatorTilingScheme).toBeTruthy();
    });
  });

  it("updates description from a GetCapabilities", async function () {
    const terria = new Terria();
    const wms = new WebMapServiceCatalogItem("test", terria);
    runInAction(() => {
      wms.setTrait("definition", "url", "test/WMS/single_metadata_url.xml");
      wms.setTrait("definition", "layers", "single_period");
    });
    let description: string | undefined;
    const cleanup = autorun(() => {
      if (wms.info !== undefined) {
        const descSection = wms.info.find(
          (section) => section.name === "Web Map Service Layer Description"
        );
        if (
          descSection !== undefined &&
          descSection.content !== undefined &&
          descSection.content !== null
        ) {
          description = descSection.content;
        }
      }
    });
    try {
      await wms.loadMetadata();
      expect(description).toBe("description foo bar baz");
    } finally {
      cleanup();
    }
  });

  it("correctly constructs ImageryProvider", async function () {
    const terria = new Terria();
    const wms = new WebMapServiceCatalogItem("test", terria);
    runInAction(() => {
      wms.setTrait("definition", "url", "test/WMS/single_metadata_url.xml");
      wms.setTrait("definition", "layers", "single_period");
    });
    let mapItems: ImageryParts[] = [];
    const cleanup = autorun(() => {
      mapItems = wms.mapItems.slice();
    });
    try {
      await wms.loadMetadata();
      expect(mapItems.length).toBe(1);
      expect(mapItems[0].alpha).toBeCloseTo(0.8);
      expect(
        mapItems[0].imageryProvider instanceof WebMapServiceImageryProvider
      ).toBeTruthy();
      if (mapItems[0].imageryProvider instanceof WebMapServiceImageryProvider) {
        expect(mapItems[0].imageryProvider.url).toBe(
          "test/WMS/single_metadata_url.xml"
        );

        const tileProviderResource: Resource = (
          mapItems[0].imageryProvider as any
        )._tileProvider._resource;

        expect(tileProviderResource.queryParameters.version).toBe("1.3.0");
        expect(tileProviderResource.queryParameters.crs).toBe("EPSG:3857");
        expect(tileProviderResource.queryParameters.exceptions).toBe("XML");
        expect(tileProviderResource.queryParameters.service).toBe("WMS");
        expect(tileProviderResource.queryParameters.request).toBe("GetMap");
        expect(tileProviderResource.queryParameters.transparent).toBeTruthy();
        expect(tileProviderResource.queryParameters.format).toBe("image/png");
        expect(tileProviderResource.queryParameters.styles).toBe("");

        const getFeatureInfoResource: Resource = (
          mapItems[0].imageryProvider as any
        )._pickFeaturesResource;

        expect(getFeatureInfoResource.queryParameters.version).toBe("1.3.0");
        expect(getFeatureInfoResource.queryParameters.crs).toBe("EPSG:3857");
        expect(getFeatureInfoResource.queryParameters.exceptions).toBe("XML");
        expect(getFeatureInfoResource.queryParameters.service).toBe("WMS");
        expect(getFeatureInfoResource.queryParameters.request).toBe(
          "GetFeatureInfo"
        );
        expect(getFeatureInfoResource.queryParameters.feature_count).toBe(
          terria.configParameters.defaultMaximumShownFeatureInfos + 1
        );
        expect(getFeatureInfoResource.queryParameters.styles).toBe("");

        expect(mapItems[0].imageryProvider.tileHeight).toBe(256);
        expect(mapItems[0].imageryProvider.tileWidth).toBe(256);
      }
    } finally {
      cleanup();
    }
  });

  it("correctly constructs ImageryProvider - for WMS 1.1.1", async function () {
    expect().nothing();
    const terria = new Terria();
    const wms = new WebMapServiceCatalogItem("test", terria);
    runInAction(() => {
      wms.setTrait("definition", "url", "test/WMS/wms_1_1_1.xml");
      wms.setTrait("definition", "useWmsVersion130", false);
      wms.setTrait("definition", "layers", "IDZ10004");
    });
    let mapItems: ImageryParts[] = [];
    const cleanup = autorun(() => {
      mapItems = wms.mapItems.slice();
    });
    try {
      await wms.loadMetadata();
      expect(mapItems.length).toBe(1);
      expect(mapItems[0].alpha).toBeCloseTo(0.8);
      expect(
        mapItems[0].imageryProvider instanceof WebMapServiceImageryProvider
      ).toBeTruthy();
      if (mapItems[0].imageryProvider instanceof WebMapServiceImageryProvider) {
        expect(mapItems[0].imageryProvider.url).toBe("test/WMS/wms_1_1_1.xml");

        const tileProviderResource: Resource = (
          mapItems[0].imageryProvider as any
        )._tileProvider._resource;

        expect(tileProviderResource.queryParameters.version).toBe("1.1.1");
        expect(tileProviderResource.queryParameters.srs).toBe("EPSG:4326");
        expect(tileProviderResource.queryParameters.exceptions).toBe(
          "application/vnd.ogc.se_xml"
        );
        expect(tileProviderResource.queryParameters.service).toBe("WMS");
        expect(tileProviderResource.queryParameters.request).toBe("GetMap");
        expect(tileProviderResource.queryParameters.format).toBe("image/png");
        expect(tileProviderResource.queryParameters.tiled).toBeTruthy();
        expect(tileProviderResource.queryParameters.transparent).toBeTruthy();
        expect(tileProviderResource.queryParameters.styles).toBe("");

        const getFeatureInfoResource: Resource = (
          mapItems[0].imageryProvider as any
        )._pickFeaturesResource;

        expect(getFeatureInfoResource.queryParameters.version).toBe("1.1.1");
        expect(getFeatureInfoResource.queryParameters.srs).toBe("EPSG:4326");
        expect(getFeatureInfoResource.queryParameters.exceptions).toBe(
          "application/vnd.ogc.se_xml"
        );
        expect(getFeatureInfoResource.queryParameters.service).toBe("WMS");

        expect(getFeatureInfoResource.queryParameters.request).toBe(
          "GetFeatureInfo"
        );
        expect(getFeatureInfoResource.queryParameters.feature_count).toBe(
          terria.configParameters.defaultMaximumShownFeatureInfos + 1
        );
        expect(getFeatureInfoResource.queryParameters.styles).toBe("");

        expect(mapItems[0].imageryProvider.tileHeight).toBe(256);
        expect(mapItems[0].imageryProvider.tileWidth).toBe(256);
      }
    } finally {
      cleanup();
    }
  });

  it("supports parameters in GetMap and GetFeatureInfo requests", async function () {
    const terria = new Terria();
    const wms = new WebMapServiceCatalogItem("test", terria);
    runInAction(() => {
      wms.setTrait("definition", "url", "test/WMS/single_metadata_url.xml");
      wms.setTrait("definition", "layers", "single_period");
      wms.setTrait("definition", "styles", "jet");
      wms.setTrait("definition", "parameters", {
        some: "thing",
        another: "value"
      });
      wms.setTrait("definition", "getFeatureInfoParameters", {
        some: "thing else"
      });
      wms.setTrait("definition", "getFeatureInfoUrl", "another/url");
    });
    let mapItems: ImageryParts[] = [];
    const cleanup = autorun(() => {
      mapItems = wms.mapItems.slice();
    });
    try {
      await wms.loadMetadata();
      expect(mapItems.length).toBe(1);
      expect(mapItems[0].alpha).toBeCloseTo(0.8);
      expect(
        mapItems[0].imageryProvider instanceof WebMapServiceImageryProvider
      ).toBeTruthy();
      if (mapItems[0].imageryProvider instanceof WebMapServiceImageryProvider) {
        expect(mapItems[0].imageryProvider.url).toBe(
          "test/WMS/single_metadata_url.xml"
        );

        const tileProviderResource: Resource = (
          mapItems[0].imageryProvider as any
        )._tileProvider._resource;

        expect(tileProviderResource.queryParameters.version).toBe("1.3.0");
        expect(tileProviderResource.queryParameters.crs).toBe("EPSG:3857");
        expect(tileProviderResource.queryParameters.exceptions).toBe("XML");
        expect(tileProviderResource.queryParameters.service).toBe("WMS");
        expect(tileProviderResource.queryParameters.request).toBe("GetMap");
        expect(tileProviderResource.queryParameters.transparent).toBeTruthy();
        expect(tileProviderResource.queryParameters.format).toBe("image/png");
        expect(tileProviderResource.queryParameters.layers).toBe(
          "single_period"
        );
        expect(tileProviderResource.queryParameters.styles).toBe("jet");
        expect(tileProviderResource.queryParameters.some).toBe("thing");
        expect(tileProviderResource.queryParameters.another).toBe("value");

        const getFeatureInfoResource: Resource = (
          mapItems[0].imageryProvider as any
        )._pickFeaturesResource;

        expect(getFeatureInfoResource.queryParameters.version).toBe("1.3.0");
        expect(getFeatureInfoResource.queryParameters.crs).toBe("EPSG:3857");
        expect(getFeatureInfoResource.queryParameters.exceptions).toBe("XML");
        expect(getFeatureInfoResource.queryParameters.service).toBe("WMS");
        expect(getFeatureInfoResource.queryParameters.request).toBe(
          "GetFeatureInfo"
        );
        expect(getFeatureInfoResource.queryParameters.feature_count).toBe(
          terria.configParameters.defaultMaximumShownFeatureInfos + 1
        );
        expect(getFeatureInfoResource.queryParameters.layers).toBe(
          "single_period"
        );
        expect(getFeatureInfoResource.queryParameters.styles).toBe("jet");
        expect(getFeatureInfoResource.queryParameters.some).toBe("thing else");
        expect(getFeatureInfoResource.queryParameters.another).toBe("value");

        expect(mapItems[0].imageryProvider.tileHeight).toBe(256);
        expect(mapItems[0].imageryProvider.tileWidth).toBe(256);
      }
    } finally {
      cleanup();
    }
  });

  it("correctly sets supportsGetTimeseries and featureInfoContext", async function () {
    const terria = new Terria();
    const wms = new WebMapServiceCatalogItem("test", terria);
    runInAction(() => {
      wms.setTrait("definition", "url", "test/WMS/colorscalerange.xml");
      wms.setTrait("definition", "layers", "mylayer");
    });
    let mapItems: ImageryParts[] = [];
    const cleanup = autorun(() => {
      mapItems = wms.mapItems.slice();
    });
    try {
      await wms.loadMetadata();
      console.log(wms);
      expect(mapItems.length).toBe(1);
      expect(mapItems[0].alpha).toBeCloseTo(0.8);
      expect(
        mapItems[0].imageryProvider instanceof WebMapServiceImageryProvider
      ).toBeTruthy();
      expect(wms.supportsGetTimeseries).toBeTruthy();
      expect(wms.getFeatureInfoFormat.format).toBe("text/csv");
      expect(wms.getFeatureInfoFormat.type).toBe("text");
      expect(wms.featureInfoTemplate.template).toBe(
        "{{terria.timeSeries.chart}}"
      );

      expect(wms.featureInfoContext).toBeDefined();
      const feature = new TerriaFeature({});
      feature.data = "#some comment\nsome,csv\n1,2";
      expect(wms.featureInfoContext(feature).terria?.timeSeries?.data).toBe(
        "some,csv\n1,2"
      );
      expect(wms.featureInfoContext(feature).terria?.timeSeries?.title).toBe(
        wms.name
      );

      if (mapItems[0].imageryProvider instanceof WebMapServiceImageryProvider) {
        expect(mapItems[0].imageryProvider.url).toBe(
          "test/WMS/colorscalerange.xml"
        );

        const tileProviderResource: Resource = (
          mapItems[0].imageryProvider as any
        )._tileProvider._resource;

        expect(tileProviderResource.queryParameters.version).toBe("1.3.0");
        expect(tileProviderResource.queryParameters.crs).toBe("EPSG:4326");
        expect(tileProviderResource.queryParameters.exceptions).toBe("XML");
        expect(tileProviderResource.queryParameters.service).toBe("WMS");
        expect(tileProviderResource.queryParameters.request).toBe("GetMap");
        expect(tileProviderResource.queryParameters.transparent).toBeTruthy();
        expect(tileProviderResource.queryParameters.format).toBe("image/png");

        const getFeatureInfoResource: Resource = (
          mapItems[0].imageryProvider as any
        )._pickFeaturesResource;

        expect(getFeatureInfoResource.queryParameters.version).toBe("1.3.0");
        expect(getFeatureInfoResource.queryParameters.time).toBe("");
        expect(getFeatureInfoResource.queryParameters.crs).toBe("EPSG:4326");
        expect(getFeatureInfoResource.queryParameters.exceptions).toBe("XML");
        expect(getFeatureInfoResource.queryParameters.service).toBe("WMS");
        expect(getFeatureInfoResource.queryParameters.request).toBe(
          "GetTimeseries"
        );
        expect(getFeatureInfoResource.queryParameters.feature_count).toBe(
          terria.configParameters.defaultMaximumShownFeatureInfos + 1
        );

        expect(mapItems[0].imageryProvider.tileHeight).toBe(256);
        expect(mapItems[0].imageryProvider.tileWidth).toBe(256);
      }
    } finally {
      cleanup();
    }
  });

  it("doesn't supportGettimeseries if only a single timeslice", async function () {
    const terria = new Terria();
    const wms = new WebMapServiceCatalogItem("test", terria);
    runInAction(() => {
      wms.setTrait("definition", "url", "test/WMS/colorscalerange.xml");
      wms.setTrait("definition", "layers", "mylayer-singletime");
    });
    let mapItems: ImageryParts[] = [];
    const cleanup = autorun(() => {
      mapItems = wms.mapItems.slice();
    });
    try {
      await wms.loadMetadata();
      console.log(wms);
      expect(mapItems.length).toBe(1);
      expect(mapItems[0].alpha).toBeCloseTo(0.8);
      expect(
        mapItems[0].imageryProvider instanceof WebMapServiceImageryProvider
      ).toBeTruthy();
      expect(wms.supportsGetTimeseries).toBeFalsy();
    } finally {
      cleanup();
    }
  });

  it("constructs correct ImageryProvider when layers trait provided Title", async function () {
    const terria = new Terria();
    const wms = new WebMapServiceCatalogItem("test", terria);
    runInAction(() => {
      wms.setTrait("definition", "url", "test/WMS/wms_nested_groups.xml");
      wms.setTrait(
        "definition",
        "layers",
        "Landsat 30+ Barest Earth 25m albers (Combined Landsat)"
      );
    });
    let mapItems: ImageryParts[] = [];
    const cleanup = autorun(() => {
      mapItems = wms.mapItems.slice();
    });
    try {
      await wms.loadMetadata();
      expect(
        (mapItems[0].imageryProvider as WebMapServiceImageryProvider).layers
      ).toBe("landsat_barest_earth");
    } finally {
      cleanup();
    }
  });

  describe("rectangle", () => {
    const terria = new Terria();
    const wmsItem = new WebMapServiceCatalogItem("some-layer", terria);

    beforeEach(() => {
      runInAction(() => {
        wmsItem.setTrait(CommonStrata.definition, "url", "http://example.com");
        wmsItem.setTrait(
          CommonStrata.definition,
          "getCapabilitiesUrl",
          "test/WMS/styles_and_dimensions.xml"
        );
      });
    });

    it("single layer", async () => {
      wmsItem.setTrait(CommonStrata.definition, "layers", "A");

      (await wmsItem.loadMetadata()).throwIfError();

      expect(wmsItem.rectangle.west).toBeCloseTo(-101.73759799032979, 5);
      expect(wmsItem.rectangle.east).toBeCloseTo(-53.264449565158856, 5);
      expect(wmsItem.rectangle.south).toBeCloseTo(11.916600886761035, 5);
      expect(wmsItem.rectangle.north).toBeCloseTo(48.4370029038641, 5);
    });

    it("multiple layers", async () => {
      wmsItem.setTrait(CommonStrata.definition, "layers", "A,B");

      (await wmsItem.loadMetadata()).throwIfError();

      expect(wmsItem.rectangle.west).toBeCloseTo(-101.73759799032979, 5);
      expect(wmsItem.rectangle.east).toBeCloseTo(-53.264449565158856, 5);
      expect(wmsItem.rectangle.south).toBeCloseTo(11.898823436502258, 5);
      expect(wmsItem.rectangle.north).toBeCloseTo(48.454022604552435, 5);
    });
  });

  describe("rectangle - nested groups", () => {
    const terria = new Terria();
    const wmsItem = new WebMapServiceCatalogItem("some-layer", terria);

    beforeEach(() => {
      runInAction(() => {
        wmsItem.setTrait(CommonStrata.definition, "url", "http://example.com");
        wmsItem.setTrait(
          CommonStrata.definition,
          "getCapabilitiesUrl",
          "test/WMS/wms_nested_groups.xml"
        );
      });
    });

    it("correctly uses parent rectangle", async () => {
      wmsItem.setTrait(
        CommonStrata.definition,
        "layers",
        "landsat_barest_earth"
      );

      (await wmsItem.loadMetadata()).throwIfError();

      // This will use the top level EX_GeographicBoundingBox ("Digital Earth Australia - OGC Web Services" Layer)
      expect(wmsItem.rectangle.west).toBe(100);
      expect(wmsItem.rectangle.east).toBe(160);
      expect(wmsItem.rectangle.south).toBe(-50);
      expect(wmsItem.rectangle.north).toBe(-10);
    });
  });

  it("uses tileWidth and tileHeight", async function () {
    const terria = new Terria();
    const wms = new WebMapServiceCatalogItem("test", terria);
    runInAction(() => {
      wms.setTrait("definition", "url", "test/WMS/single_metadata_url.xml");
      wms.setTrait("definition", "layers", "single_period");
      wms.setTrait("definition", "tileWidth", 512);
      wms.setTrait("definition", "tileHeight", 512);
    });
    let mapItems: ImageryParts[] = [];
    const cleanup = autorun(() => {
      mapItems = wms.mapItems.slice();
    });
    try {
      await wms.loadMetadata();
      expect(
        mapItems[0].imageryProvider instanceof WebMapServiceImageryProvider
      ).toBeTruthy();
      if (mapItems[0].imageryProvider instanceof WebMapServiceImageryProvider) {
        expect(mapItems[0].imageryProvider.tileHeight).toBe(512);
        expect(mapItems[0].imageryProvider.tileWidth).toBe(512);
      }
    } finally {
      cleanup();
    }
  });

  it("uses query parameters from URL - no parameters", async function () {
    const terria = new Terria();
    const wms = new WebMapServiceCatalogItem("test", terria);
    runInAction(() => {
      wms.setTrait("definition", "url", "test/WMS/single_metadata_url.xml");
    });

    await wms.loadMetadata();

    expect(wms.tileHeight).toBe(256);
    expect(wms.tileWidth).toBe(256);
    expect(wms.layers).toBe("single_period");
    expect(wms.styles).toBeUndefined();
    expect(wms.useWmsVersion130).toBeTruthy();
    expect(wms.crs).toBe("EPSG:3857");
  });

  it("uses query parameters from URL - with parameters", async function () {
    const terria = new Terria();
    const wms = new WebMapServiceCatalogItem("test", terria);
    runInAction(() => {
      wms.setTrait(
        "definition",
        "url",
        "test/WMS/single_metadata_url.xml?&styles=jet&version=1.1.1&crs=EPSG%3A4326&service=WMS&request=GetCapabilities&layers=single_period&width=512&height=512"
      );
    });

    await wms.loadMetadata();

    expect(wms.tileHeight).toBe(512);
    expect(wms.tileWidth).toBe(512);
    expect(wms.layers).toBe("single_period");
    expect(wms.styles).toBe("jet");
    expect(wms.useWmsVersion130).toBeFalsy();
    expect(wms.crs).toBe("EPSG:4326");
  });

  it("invalid/valid layers", async function () {
    const terria = new Terria();
    const wms = new WebMapServiceCatalogItem("test", terria);
    runInAction(() => {
      wms.setTrait("definition", "url", "test/WMS/single_metadata_url.xml");
      wms.setTrait("definition", "layers", "invalidLayer,single_period");
    });

    await wms.loadMetadata();

    expect(wms.invalidLayers).toEqual(["invalidLayer"]);
    expect(wms.validLayers).toEqual(["single_period"]);
  });

  it("enforces the layer limit", async function () {
    const terria = new Terria();
    const wms = new WebMapServiceCatalogItem("test", terria);
    runInAction(() => {
      wms.setTrait(
        "definition",
        "url",
        "test/WMS/wms_nested_groups_layer_limited.xml"
      );
    });

    await wms.loadMetadata();

    expect(wms.validLayers).toEqual(["ls8_nbart_geomedian_annual"]);
  });

  it("uses GetFeatureInfo from GetCapabilities", async function () {
    expect().nothing();
    const terria = new Terria();
    const wms = new WebMapServiceCatalogItem("test", terria);
    runInAction(() => {
      wms.setTrait("definition", "url", "test/WMS/wms_crs.xml");
      wms.setTrait("definition", "layers", "ls8_nbart_geomedian_annual");
    });

    await wms.loadMetadata();
    expect(wms.getFeatureInfoFormat.type).toBe("json");
    expect(wms.getFeatureInfoFormat.format).toBe("application/json");
  });

  it("uses GetFeatureInfo from GetCapabilities - WMS 1.1.1", async function () {
    expect().nothing();
    const terria = new Terria();
    const wms = new WebMapServiceCatalogItem("test", terria);
    runInAction(() => {
      wms.setTrait("definition", "url", "test/WMS/wms_1_1_1.xml");
      wms.setTrait("definition", "useWmsVersion130", false);
      wms.setTrait("definition", "layers", "GA_Topo_10M");
    });

    await wms.loadMetadata();
    expect(wms.getFeatureInfoFormat.type).toBe("xml");
    expect(wms.getFeatureInfoFormat.format).toBe("application/vnd.ogc.gml");
  });

  it("uses default time", function (done) {
    const terria = new Terria();
    const wmsItem = new WebMapServiceCatalogItem("some-layer", terria);
    runInAction(() => {
      wmsItem.setTrait(CommonStrata.definition, "url", "http://example.com");
      wmsItem.setTrait(
        CommonStrata.definition,
        "getCapabilitiesUrl",
        "test/WMS/styles_and_dimensions.xml"
      );
      wmsItem.setTrait(CommonStrata.definition, "layers", "A,B");
    });

    wmsItem
      .loadMetadata()
      .then(function () {
        expect(wmsItem.currentTime).toBe("2016-09-24T00:00:00.000Z");
      })
      .then(done)
      .catch(done.fail);
  });

  it("uses default time=current", async function () {
    const terria = new Terria();
    const wmsItem = new WebMapServiceCatalogItem("some-layer", terria);
    runInAction(() => {
      wmsItem.setTrait(CommonStrata.definition, "url", "http://example.com");
      wmsItem.setTrait(
        CommonStrata.definition,
        "getCapabilitiesUrl",
        "test/WMS/styles_and_dimensions.xml"
      );
      wmsItem.setTrait(CommonStrata.definition, "layers", "C");
    });

    (await wmsItem.loadMetadata()).throwIfError();

    expect(wmsItem.initialTimeSource).toBe("now");
    expect(wmsItem.currentDiscreteJulianDate?.toString()).toBe(
      "2014-01-01T00:00:00Z"
    );
  });

  it('creates "next" imagery provider when animating', async function () {
    const terria = new Terria();
    const wmsItem = new WebMapServiceCatalogItem("some-layer", terria);
    runInAction(() => {
      wmsItem.setTrait(CommonStrata.definition, "url", "http://example.com");
      wmsItem.setTrait(
        CommonStrata.definition,
        "getCapabilitiesUrl",
        "test/WMS/styles_and_dimensions.xml"
      );
      wmsItem.setTrait(CommonStrata.definition, "layers", "C");
      wmsItem.setTrait(
        CommonStrata.definition,
        "currentTime",
        "2002-01-01T00:00:00.000Z"
      );
    });

    terria.timelineStack.addToTop(wmsItem);
    terria.timelineStack.activate();

    (await wmsItem.loadMapItems()).throwIfError();

    expect(wmsItem.mapItems.length).toBe(1);
    expect(wmsItem.isPaused).toBe(true);

    runInAction(() => {
      wmsItem.setTrait(CommonStrata.definition, "isPaused", false);
    });

    expect(wmsItem.mapItems.length).toBe(2);
    expect(wmsItem.isPaused).toBe(false);

    const currentImageryProvider = wmsItem.mapItems[0]
      .imageryProvider as WebMapServiceImageryProvider;
    expect(currentImageryProvider instanceof WebMapServiceImageryProvider).toBe(
      true
    );
    expect(currentImageryProvider.enablePickFeatures).toBe(true);

    const nextMapItem = wmsItem.mapItems[1];
    const nextImageryProvider =
      nextMapItem.imageryProvider as WebMapServiceImageryProvider;
    expect(nextImageryProvider instanceof WebMapServiceImageryProvider).toBe(
      true
    );
    expect(nextImageryProvider.enablePickFeatures).toBe(false);
    expect(nextMapItem.alpha).toBe(0);
    expect(nextMapItem.show).toBe(true);
  });

  it("sets enableFeaturePicking to false", async function () {
    const terria = new Terria();
    const wmsItem = new WebMapServiceCatalogItem("some-layer", terria);
    runInAction(() => {
      wmsItem.setTrait(CommonStrata.definition, "url", "http://example.com");
      wmsItem.setTrait(CommonStrata.definition, "allowFeaturePicking", false);
      wmsItem.setTrait(
        CommonStrata.definition,
        "getCapabilitiesUrl",
        "test/WMS/styles_and_dimensions.xml"
      );
      wmsItem.setTrait(CommonStrata.definition, "layers", "C");
    });

    (await wmsItem.loadMetadata()).throwIfError();

    expect(wmsItem.mapItems.length).toBe(1);
    expect(wmsItem.allowFeaturePicking).toBe(false);

    const imageryProvider = wmsItem.mapItems[0]
      .imageryProvider as WebMapServiceImageryProvider;
    expect(
      imageryProvider instanceof WebMapServiceImageryProvider
    ).toBeTruthy();

    expect(imageryProvider.enablePickFeatures).toBe(false);
  });

  it("dimensions and styles for a 'real' WMS layer", function (done) {
    const terria = new Terria();
    const wmsItem = new WebMapServiceCatalogItem("some-layer", terria);
    runInAction(() => {
      wmsItem.setTrait(CommonStrata.definition, "url", "http://example.com");
      wmsItem.setTrait(
        CommonStrata.definition,
        "getCapabilitiesUrl",
        "test/WMS/styles_and_dimensions.xml"
      );
      wmsItem.setTrait(CommonStrata.definition, "layers", "A,B");
      wmsItem.setTrait(CommonStrata.definition, "dimensions", {
        custom: "Another thing",
        elevation: "-0.59375"
      });
      wmsItem.setTrait(
        CommonStrata.definition,
        "styles",
        "contour/ferret,shadefill/alg2"
      );
    });

    wmsItem
      .loadMetadata()
      .then(function () {
        expect(wmsItem.styleSelectableDimensions.length).toBe(2);

        // Check Styles and dimensions
        expect(wmsItem.styleSelectableDimensions[0].selectedId).toBe(
          "contour/ferret"
        );
        expect(wmsItem.styleSelectableDimensions[0].options!.length).toBe(41);

        expect(wmsItem.styleSelectableDimensions[1].selectedId).toBe(
          "shadefill/alg2"
        );
        expect(wmsItem.styleSelectableDimensions[1].options!.length).toBe(40);

        expect(wmsItem.wmsDimensionSelectableDimensions[0].name).toBe(
          "elevation"
        );
        expect(wmsItem.wmsDimensionSelectableDimensions[0].selectedId).toBe(
          "-0.59375"
        );
        expect(
          wmsItem.wmsDimensionSelectableDimensions[0].options!.length
        ).toBe(16);

        expect(wmsItem.wmsDimensionSelectableDimensions[1].name).toBe("custom");
        expect(wmsItem.wmsDimensionSelectableDimensions[1].selectedId).toBe(
          "Another thing"
        );
        expect(
          wmsItem.wmsDimensionSelectableDimensions[1].options!.length
        ).toBe(4);

        expect(wmsItem.wmsDimensionSelectableDimensions[2].name).toBe(
          "another"
        );
        expect(wmsItem.wmsDimensionSelectableDimensions[2].selectedId).toBe(
          "Second"
        );
        expect(
          wmsItem.wmsDimensionSelectableDimensions[2].options!.length
        ).toBe(3);

        expect(wmsItem.legends.length).toBe(2);
        expect(wmsItem.legends[0].url).toBe(
          "http://geoport-dev.whoi.edu/thredds/wms/coawst_4/use/fmrc/coawst_4_use_best.ncd?REQUEST=GetLegendGraphic&LAYER=v&PALETTE=ferret"
        );
        expect(wmsItem.legends[1].url).toBe(
          "http://geoport-dev.whoi.edu/thredds/wms/coawst_4/use/fmrc/coawst_4_use_best.ncd?REQUEST=GetLegendGraphic&LAYER=wetdry_mask_u&PALETTE=alg2"
        );
      })
      .then(done)
      .catch(done.fail);
  });

  it("fetches default legend - if supportsGetLegendRequest is false", function (done) {
    const terria = new Terria();
    const wmsItem = new WebMapServiceCatalogItem("some-layer", terria);
    runInAction(() => {
      wmsItem.setTrait(CommonStrata.definition, "url", "http://example.com");
      wmsItem.setTrait(
        CommonStrata.definition,
        "getCapabilitiesUrl",
        "test/WMS/styles_and_dimensions.xml"
      );
      wmsItem.setTrait(CommonStrata.definition, "layers", "A");
    });

    wmsItem
      .loadMetadata()
      .then(function () {
        expect(wmsItem.legends.length).toBe(1);
        expect(wmsItem.legends[0].url).toBe(
          "http://geoport-dev.whoi.edu/thredds/wms/coawst_4/use/fmrc/coawst_4_use_best.ncd?REQUEST=GetLegendGraphic&LAYER=v&PALETTE=rainbow"
        );
      })
      .then(done)
      .catch(done.fail);
  });

  it("fetches default legend - if supportsGetLegendRequest is true", async () => {
    const terria = new Terria();
    const wmsItem = new WebMapServiceCatalogItem("some-layer", terria);
    runInAction(() => {
      wmsItem.setTrait(CommonStrata.definition, "url", "http://example.com");
      wmsItem.setTrait(
        CommonStrata.definition,
        "getCapabilitiesUrl",
        "test/WMS/styles_and_dimensions.xml"
      );
      wmsItem.setTrait(CommonStrata.definition, "layers", "A");
      wmsItem.setTrait(
        CommonStrata.definition,
        "supportsGetLegendGraphic",
        true
      );
    });

    await wmsItem.loadMetadata();

    expect(wmsItem.styles).toBeUndefined();

    expect(wmsItem.legends.length).toBe(1);
    expect(wmsItem.legends[0].url).toBe(
      "http://example.com/?service=WMS&version=1.3.0&request=GetLegendGraphic&format=image%2Fpng&sld_version=1.1.0&layer=A"
    );

    runInAction(() =>
      wmsItem.setTrait(CommonStrata.definition, "styles", "areafill/occam")
    );

    expect(wmsItem.styles).toBe("areafill/occam");

    expect(wmsItem.legends.length).toBe(1);
    expect(wmsItem.legends[0].url).toBe(
      "http://geoport-dev.whoi.edu/thredds/wms/coawst_4/use/fmrc/coawst_4_use_best.ncd?REQUEST=GetLegendGraphic&LAYER=v&PALETTE=occam"
    );
  });

  it("fetches geoserver legend", function (done) {
    const terria = new Terria();
    const wmsItem = new WebMapServiceCatalogItem("some-layer", terria);
    runInAction(() => {
      wmsItem.setTrait(CommonStrata.definition, "url", "http://example.com");
      wmsItem.setTrait(
        CommonStrata.definition,
        "getCapabilitiesUrl",
        "test/WMS/styles_and_dimensions.xml"
      );
      wmsItem.setTrait(CommonStrata.definition, "layers", "A");
      wmsItem.setTrait(CommonStrata.definition, "isGeoServer", true);
    });

    wmsItem
      .loadMetadata()
      .then(function () {
        expect(wmsItem.legends.length).toBe(1);

        // Match for fontColour = 0xffffff || 0xfff
        expect(
          wmsItem.legends[0].url ===
            "http://example.com/?service=WMS&version=1.3.0&request=GetLegendGraphic&format=image%2Fpng&sld_version=1.1.0&layer=A&LEGEND_OPTIONS=fontName%3ACourier%3BfontStyle%3Abold%3BfontSize%3A12%3BforceLabels%3Aon%3BfontAntiAliasing%3Atrue%3BlabelMargin%3A5%3BfontColor%3A0xffffff%3Bdpi%3A182&transparent=true" ||
            wmsItem.legends[0].url ===
              "http://example.com/?service=WMS&version=1.3.0&request=GetLegendGraphic&format=image%2Fpng&sld_version=1.1.0&layer=A&LEGEND_OPTIONS=fontName%3ACourier%3BfontStyle%3Abold%3BfontSize%3A12%3BforceLabels%3Aon%3BfontAntiAliasing%3Atrue%3BlabelMargin%3A5%3BfontColor%3A0xfff%3Bdpi%3A182&transparent=true"
        ).toBeTruthy();
      })
      .then(done)
      .catch(done.fail);
  });

  it("fetches GetLegendGraphic", function (done) {
    const terria = new Terria();
    const wmsItem = new WebMapServiceCatalogItem("some-layer", terria);
    runInAction(() => {
      wmsItem.setTrait(CommonStrata.definition, "url", "http://example.com");
      wmsItem.setTrait(
        CommonStrata.definition,
        "getCapabilitiesUrl",
        "test/WMS/styles_and_dimensions.xml"
      );
      wmsItem.setTrait(CommonStrata.definition, "layers", "A");
      wmsItem.setTrait(CommonStrata.definition, "styles", "no-legend");
      wmsItem.setTrait(
        CommonStrata.definition,
        "supportsGetLegendGraphic",
        true
      );
    });

    wmsItem
      .loadMetadata()
      .then(function () {
        expect(wmsItem.legends.length).toBe(1);
        expect(wmsItem.legends[0].url).toBe(
          "http://example.com/?service=WMS&version=1.3.0&request=GetLegendGraphic&format=image%2Fpng&sld_version=1.1.0&layer=A&style=no-legend"
        );
      })
      .then(done)
      .catch(done.fail);
  });

  it("supports parameters in a GetLegendGraphic request for a layer without a style configured", function (done) {
    const terria = new Terria();
    const wmsItem = new WebMapServiceCatalogItem("some-layer", terria);
    runInAction(() => {
      wmsItem.setTrait(
        CommonStrata.definition,
        "url",
        "http://example.com/mapserv?map=%2Fmap%2Fexample.map"
      );
      wmsItem.setTrait(
        CommonStrata.definition,
        "getCapabilitiesUrl",
        "test/WMS/styles_and_dimensions.xml"
      );
      wmsItem.setTrait(CommonStrata.definition, "layers", "A");
      wmsItem.setTrait(
        CommonStrata.definition,
        "supportsGetLegendGraphic",
        true
      );
    });

    wmsItem
      .loadMetadata()
      .then(function () {
        expect(wmsItem.legends.length).toBe(1);
        expect(wmsItem.legends[0].url).toBe(
          "http://example.com/mapserv?map=%2Fmap%2Fexample.map&service=WMS&version=1.3.0&request=GetLegendGraphic&format=image%2Fpng&sld_version=1.1.0&layer=A"
        );
      })
      .then(done)
      .catch(done.fail);
  });

  it("fetches legend with colourScaleRange", function (done) {
    const terria = new Terria();
    const wmsItem = new WebMapServiceCatalogItem("some-layer", terria);
    runInAction(() => {
      wmsItem.setTrait(
        CommonStrata.definition,
        "url",
        "http://geoport-dev.whoi.edu/thredds/wms/"
      );
      wmsItem.setTrait(
        CommonStrata.definition,
        "getCapabilitiesUrl",
        "test/WMS/styles_and_dimensions.xml"
      );
      wmsItem.setTrait(CommonStrata.definition, "layers", "A");
      wmsItem.setTrait(
        CommonStrata.definition,
        "supportsColorScaleRange",
        true
      );
      wmsItem.setTrait(CommonStrata.definition, "colorScaleMinimum", 0);
      wmsItem.setTrait(CommonStrata.definition, "colorScaleMaximum", 1);
    });

    wmsItem
      .loadMetadata()
      .then(function () {
        expect(wmsItem.isThredds).toBeTruthy();
        expect(wmsItem.legends.length).toBe(1);
        expect(wmsItem.legends[0].url).toBe(
          "http://geoport-dev.whoi.edu/thredds/wms/?service=WMS&version=1.3.0&request=GetLegendGraphic&format=image%2Fpng&sld_version=1.1.0&layer=A&colorscalerange=0%2C1"
        );
      })
      .then(done)
      .catch(done.fail);
  });

  it("`selectableDimensions` is empty if `disableDimensionSelectors` is true", function (done) {
    const terria = new Terria();
    const wmsItem = new WebMapServiceCatalogItem("some-layer", terria);
    runInAction(() => {
      wmsItem.setTrait(CommonStrata.definition, "url", "http://example.com");
      wmsItem.setTrait(
        CommonStrata.definition,
        "getCapabilitiesUrl",
        "test/WMS/styles_and_dimensions.xml"
      );
      wmsItem.setTrait(CommonStrata.definition, "layers", "A,B");
      wmsItem.setTrait(CommonStrata.definition, "dimensions", {
        styles: "contour/ferret,shadefill/alg2",
        custom: "Another thing",
        elevation: "-0.59375"
      });
      wmsItem.setTrait(
        CommonStrata.definition,
        "styles",
        "contour/ferret,shadefill/alg2"
      );
      wmsItem.setTrait(CommonStrata.user, "disableDimensionSelectors", true);
    });

    wmsItem
      .loadMetadata()
      .then(function () {
        expect(wmsItem.selectableDimensions.length).toBe(0);
      })
      .then(done)
      .catch(done.fail);
  });

  it("sets isEsri from URL", async function () {
    const terria = new Terria();
    const wms = new WebMapServiceCatalogItem("test", terria);
    runInAction(() => {
      wms.setTrait(
        CommonStrata.definition,
        "url",
        "http://gaservices.ga.gov.au/site_1/services/Geomorphology_Landform_Type_WM/MapServer/WMSServer?request=GetCapabilities&service=WMS"
      );
      wms.setTrait(
        CommonStrata.definition,
        "getCapabilitiesUrl",
        "test/WMS/wms_esri.xml"
      );
      wms.setTrait(CommonStrata.definition, "layers", "0");
    });

    await wms.loadMetadata();

    expect(wms.isEsri).toBe(true);
    expect(wms.getFeatureInfoFormat.type).toBe("json");
    expect(wms.getFeatureInfoFormat.format).toBe("application/geo+json");
  });

  it("sets isEsri from URL - and uses XML over HTML", async function () {
    const terria = new Terria();
    const wms = new WebMapServiceCatalogItem("test", terria);
    runInAction(() => {
      wms.setTrait(
        CommonStrata.definition,
        "url",
        "http://gaservices.ga.gov.au/site_1/services/Geomorphology_Landform_Type_WM/MapServer/WMSServer?request=GetCapabilities&service=WMS"
      );
      wms.setTrait(
        CommonStrata.definition,
        "getCapabilitiesUrl",
        "test/WMS/wms_esri_2.xml"
      );
      wms.setTrait(
        CommonStrata.definition,
        "layers",
        "Topographic_Maps_Index_100k"
      );
    });

    await wms.loadMetadata();

    expect(wms.isEsri).toBe(true);
    expect(wms.getFeatureInfoFormat.type).toBe("xml");
    expect(wms.getFeatureInfoFormat.format).toBe("text/xml");
  });

  describe("imageryProvider", () => {
    let item: WebMapServiceCatalogItem;
    let imageryProvider: WebMapServiceImageryProvider;
    const wmsUrl = "http://example.com";
    beforeEach(() => {
      item = new WebMapServiceCatalogItem("test", new Terria());
      runInAction(() => {
        item.setTrait(CommonStrata.definition, "url", wmsUrl);
        item.setTrait(
          CommonStrata.definition,
          "getCapabilitiesUrl",
          "test/WMS/styles_and_dimensions.xml"
        );

        item.setTrait(CommonStrata.definition, "layers", "A,B");
        item.setTrait(CommonStrata.definition, "minScaleDenominator", 1500000);
        item.setTrait(
          CommonStrata.definition,
          "hideLayerAfterMinScaleDenominator",
          true
        );
      });
      imageryProvider = item.mapItems[0]
        .imageryProvider as WebMapServiceImageryProvider;
    });

    it("should be an WebMapServiceImageryProvider", function () {
      expect(
        imageryProvider instanceof WebMapServiceImageryProvider
      ).toBeTruthy();
    });

    it("sets the URL correctly", () => {
      expect(imageryProvider.url).toBe(wmsUrl + "/");
    });

    it("sets the maximum level", () => {
      expect(imageryProvider.maximumLevel).toBe(9);
    });

    it("show scaleWorkbenchInfo when hideLayerAfterMinScaleDenominator", () => {
      runInAction(() => {
        item.setTrait(
          CommonStrata.definition,
          "hideLayerAfterMinScaleDenominator",
          true
        );
      });
      spyOn(item.terria, "raiseErrorToUser");
      imageryProvider.requestImage(0, 0, 100);
      expect(item.scaleWorkbenchInfo).toBeDefined();
    });

    it("scaleWorkbenchInfo undefined when hideLayerAfterMinScaleDenominator false", async () => {
      runInAction(() => {
        item.setTrait(
          CommonStrata.definition,
          "hideLayerAfterMinScaleDenominator",
          false
        );
      });
      await item.loadMapItems();
      spyOn(item.terria, "raiseErrorToUser");
      imageryProvider.requestImage(0, 0, 100);
      expect(item.scaleWorkbenchInfo).not.toBeDefined();
    });

    it("correctly sets the crs for WMS 1.3.0", function () {
      item.setTrait(CommonStrata.user, "crs", "EPSG:7855");
      const tileProviderResource = getTileProviderResourceForItem(item);
      const featureInfoResource = getFeatureInfoResourceForItem(item);
      expect(tileProviderResource?.queryParameters.crs).toEqual("EPSG:7855");
      expect(featureInfoResource?.queryParameters.crs).toEqual("EPSG:7855");
    });

    it("correctly sets the sr for WMS 1.1.x", function () {
      item.setTrait(CommonStrata.user, "crs", "EPSG:7855");
      item.setTrait(CommonStrata.user, "useWmsVersion130", false);
      const tileProviderResource = getTileProviderResourceForItem(item);
      const featureInfoResource = getFeatureInfoResourceForItem(item);
      expect(tileProviderResource?.queryParameters.srs).toEqual("EPSG:7855");
      expect(featureInfoResource?.queryParameters.srs).toEqual("EPSG:7855");
    });
  });
});

function getWebMapServiceImageryProvider(
  item: WebMapServiceCatalogItem
): WebMapServiceImageryProvider | undefined {
  const imageryProvider = runInAction(() => item.mapItems[0])?.imageryProvider;
  return imageryProvider instanceof WebMapServiceImageryProvider
    ? imageryProvider
    : undefined;
}

function getTileProviderResourceForItem(
  item: WebMapServiceCatalogItem
): Resource | undefined {
  return (getWebMapServiceImageryProvider(item) as any)?._tileProvider
    ._resource;
}

function getFeatureInfoResourceForItem(
  item: WebMapServiceCatalogItem
): Resource | undefined {
  return (getWebMapServiceImageryProvider(item) as any)?._pickFeaturesResource;
}
