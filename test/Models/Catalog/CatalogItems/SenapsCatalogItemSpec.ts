import i18next from "i18next";
import { runInAction } from "mobx";
import _loadWithXhr from "../../../../lib/Core/loadWithXhr";
import SenapsLocationsCatalogItem, {
  SenapsFeature,
  SenapsFeatureCollection
} from "../../../../lib/Models/Catalog/CatalogItems/SenapsLocationsCatalogItem";
import Terria from "../../../../lib/Models/Terria";

interface ExtendedLoadWithXhr {
  (): any;
  load: { (...args: any[]): any; calls?: any };
}

const loadWithXhr: ExtendedLoadWithXhr = _loadWithXhr as any;

describe("SenapsLocationsCatalogItem", function () {
  let terria: Terria;
  let item: SenapsLocationsCatalogItem;
  let geoJsonItem: any;
  let geoJsonData: SenapsFeatureCollection;
  let feature: SenapsFeature;

  const altProxyUrl = "/api/v0/data/proxy/a-record-id";
  const senapsCatalogItemUrl = "https://senaps.io/api/sensor/v2";
  const altProxiedBaseUrl = `${altProxyUrl}/${senapsCatalogItemUrl}`;
  const defaultProxiedBaseUrl = `${senapsCatalogItemUrl}`;

  function getExpectedFeatureInfoTemplate(url: string) {
    const expectedFeatureInfoTemplate: string = `<h4>${i18next.t(
      "models.senaps.locationHeadingFeatureInfo"
    )}: {{id}}</h4>
      <h5 style="margin-bottom:5px;">${i18next.t(
        "models.senaps.availableStreamsHeadingFeatureInfo"
      )}</h5>
      {{#hasStreams}}
      <ul>{{#streamIds}}
      <li>{{.}}</li>
      {{/streamIds}}</ul>
      <br/>
      <chart
      identifier='{{id}}'
      title='{{id}}'
      sources='${url}/observations?streamid={{#terria.urlEncodeComponent}}{{streamIds}}{{/terria.urlEncodeComponent}}&limit=1440&media=csv&csvheader=false&sort=descending,${url}/observations?streamid={{#terria.urlEncodeComponent}}{{streamIds}}{{/terria.urlEncodeComponent}}&limit=7200&media=csv&csvheader=false&sort=descending'
      source-names='1d,5d'
      downloads='${url}/observations?streamid={{#terria.urlEncodeComponent}}{{streamIds}}{{/terria.urlEncodeComponent}}&limit=1440&media=csv&csvheader=false&sort=descending,${url}/observations?streamid={{#terria.urlEncodeComponent}}{{streamIds}}{{/terria.urlEncodeComponent}}&limit=7200&media=csv&csvheader=false&sort=descending'
      download-names='1d,5d'
      >
      </chart>
      {{/hasStreams}}
      {{^hasStreams}}
      <br/><br/>
      {{/hasStreams}}
      `
      .split(" ")
      .join("");

    return expectedFeatureInfoTemplate;
  }

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    item = new SenapsLocationsCatalogItem("test", terria);
    item.setTrait("definition", "url", senapsCatalogItemUrl);

    const realLoadWithXhr = loadWithXhr.load;
    spyOn(loadWithXhr, "load").and.callFake(function (...args: any[]) {
      const url = args[0];
      // if we have a ?id= then we've passed in a filter
      if (url.match(/locations\?id/g))
        args[0] = "test/Senaps/locations_filtered.json";
      if (url.match(/streams\?id/g))
        args[0] = "test/Senaps/streams_filtered.json";

      // non-filtered requests
      if (url.match(/locations\?count/g))
        args[0] = "test/Senaps/locations.json";
      if (url.match(/streams\?location/g)) args[0] = "test/Senaps/streams.json";
      return realLoadWithXhr(...args);
    });
  });

  it("- has a type and typename", function () {
    expect(item.type).toBe("senaps-locations");
    expect(item.typeName).toBe(i18next.t("models.senaps.name"));
  });

  it("- supports zooming to extent", function () {
    expect(item.disableZoomTo).toBeFalsy();
  });

  it("- supports show info", function () {
    expect(item.disableAboutData).toBeFalsy();
  });

  describe("Can not get any items without base url", function () {
    beforeEach(function () {
      runInAction(() => {
        item = new SenapsLocationsCatalogItem("test", new Terria());
      });
    });

    it("- fail to construct locations url", async function () {
      function foundError() {
        let errorMessage: string = "";
        try {
          item._constructLocationsUrl();
        } catch (e: any) {
          errorMessage = e.message;
        }
        return errorMessage === i18next.t("models.senaps.missingSenapsBaseUrl");
      }

      expect(await foundError()).toBe(true);
    });

    it("- fail to construct streams url", async function () {
      function foundError() {
        let errorMessage: string = "";
        try {
          item._constructStreamsUrl("123");
        } catch (e: any) {
          errorMessage = e.message;
        }
        return errorMessage === i18next.t("models.senaps.missingSenapsBaseUrl");
      }

      expect(await foundError()).toBe(true);
    });
  });

  describe("Can get all items via implicitly specified proxy", function () {
    beforeEach(async function () {
      runInAction(() => {
        item = new SenapsLocationsCatalogItem("test", new Terria());
        item.setTrait("definition", "url", altProxiedBaseUrl);
      });
      await item.loadMapItems();
      geoJsonItem = item.geoJsonItem;
      geoJsonData = geoJsonItem.geoJsonData as any as SenapsFeatureCollection;
      feature = geoJsonData.features[0];
    });

    it("- constructs correct locations url", function () {
      expect(item._constructLocationsUrl()).toBe(
        `${altProxiedBaseUrl}/locations?count=1000&expand=true`
      );
    });

    it("- constructs correct streams url", function () {
      expect(item._constructStreamsUrl("123")).toBe(
        `${altProxiedBaseUrl}/streams?locationid=123`
      );
    });

    it("- creates correct feature info template", function () {
      const actualFeatureInfoTemplate: string =
        item.featureInfoTemplate.template?.split(" ").join("") || "";
      expect(actualFeatureInfoTemplate).toBe(
        getExpectedFeatureInfoTemplate(altProxiedBaseUrl)
      );
    });

    it("- has the right number of features", function () {
      expect(item.geoJsonItem).toBeDefined();
      expect(geoJsonData).toBeDefined();
      expect(geoJsonData.features.length).toEqual(2);
    });

    it("- has a feature with the right properties", function () {
      expect(feature.geometry.coordinates).toEqual([148.699683, -34.470083]);
      expect(feature.properties).toBeDefined();
      expect(feature.properties.id).toBe("boorowa.temprh.site5a");
      expect(feature.properties.description).toBe("Boorowa TempRH Site5a");
      expect(feature.properties.hasStreams).toBe(true);
      expect(feature.properties.streamIds).toEqual([
        "tdfnode.0.323831395a368714-99.SHT31DIS_ALL.temperature",
        "tdfnode.0.323831395a368714-99.SHT31DIS_ALL.humidity"
      ]);
    });
  });

  describe("Can get all items via default proxy", function () {
    beforeEach(async function () {
      runInAction(() => {
        item = new SenapsLocationsCatalogItem("test", new Terria());
        item.setTrait("definition", "url", senapsCatalogItemUrl);
      });
      await item.loadMapItems();
      geoJsonItem = item.geoJsonItem;
      geoJsonData = geoJsonItem.geoJsonData as any as SenapsFeatureCollection;
      feature = geoJsonData.features[0];
    });

    it("- constructs correct locations url", function () {
      expect(item._constructLocationsUrl()).toBe(
        `${senapsCatalogItemUrl}/locations?count=1000&expand=true`
      );
    });

    it("- constructs correct streams url", function () {
      expect(item._constructStreamsUrl("123")).toBe(
        `${senapsCatalogItemUrl}/streams?locationid=123`
      );
    });

    it("- creates correct feature info template", function () {
      const actualFeatureInfoTemplate: string =
        item.featureInfoTemplate.template?.split(" ").join("") || "";
      expect(actualFeatureInfoTemplate).toBe(
        getExpectedFeatureInfoTemplate(defaultProxiedBaseUrl)
      );
    });

    it("- has the right number of features", function () {
      expect(item.geoJsonItem).toBeDefined();
      expect(geoJsonData).toBeDefined();
      expect(geoJsonData.features.length).toEqual(2);
    });

    it("- has a feature with the right properties", function () {
      expect(feature.geometry.coordinates).toEqual([148.699683, -34.470083]);
      expect(feature.properties).toBeDefined();
      expect(feature.properties.id).toBe("boorowa.temprh.site5a");
      expect(feature.properties.description).toBe("Boorowa TempRH Site5a");
      expect(feature.properties.hasStreams).toBe(true);
      expect(feature.properties.streamIds).toEqual([
        "tdfnode.0.323831395a368714-99.SHT31DIS_ALL.temperature",
        "tdfnode.0.323831395a368714-99.SHT31DIS_ALL.humidity"
      ]);
    });
  });

  describe("Can get filtered items via default proxy", function () {
    beforeEach(async function () {
      runInAction(() => {
        item = new SenapsLocationsCatalogItem("test", new Terria());
        item.setTrait("definition", "locationIdFilter", "boor");
        item.setTrait("definition", "streamIdFilter", "temp");
        item.setTrait("definition", "url", senapsCatalogItemUrl);
      });
      await item.loadMapItems();
      geoJsonItem = item.geoJsonItem;
      geoJsonData = geoJsonItem.geoJsonData as any as SenapsFeatureCollection;
      feature = geoJsonData.features[0];
    });

    it("- constructs correct locations url", function () {
      expect(item._constructLocationsUrl()).toBe(
        `${senapsCatalogItemUrl}/locations?id=boor&count=1000&expand=true`
      );
    });

    it("- constructs correct streams url", function () {
      expect(item._constructStreamsUrl("123")).toBe(
        `${senapsCatalogItemUrl}/streams?id=temp&locationid=123`
      );
    });

    it("- creates correct feature info template", function () {
      const actualFeatureInfoTemplate: string =
        item.featureInfoTemplate.template?.split(" ").join("") || "";
      expect(actualFeatureInfoTemplate).toBe(
        getExpectedFeatureInfoTemplate(defaultProxiedBaseUrl)
      );
    });

    it("- only retrieves matching features", function () {
      expect(item.geoJsonItem).toBeDefined();
      expect(geoJsonData.type).toEqual("FeatureCollection");
      expect(geoJsonData.features.length).toEqual(1);
    });

    it("- only retrieves matching streams", function () {
      expect(feature.properties.streamIds.length).toEqual(1);
    });
  });

  describe("Can get filtered items via implicitly specified alternative proxy", function () {
    beforeEach(async function () {
      runInAction(() => {
        item = new SenapsLocationsCatalogItem("test", new Terria());
        item.setTrait("definition", "locationIdFilter", "boor");
        item.setTrait("definition", "streamIdFilter", "temp");
        item.setTrait("definition", "url", altProxiedBaseUrl);
      });
      await item.loadMapItems();
      geoJsonItem = item.geoJsonItem;
      geoJsonData = geoJsonItem.geoJsonData as any as SenapsFeatureCollection;
      feature = geoJsonData.features[0];
    });

    it("- constructs correct locations url", function () {
      expect(item._constructLocationsUrl()).toBe(
        `${altProxiedBaseUrl}/locations?id=boor&count=1000&expand=true`
      );
    });

    it("- constructs correct streams url", function () {
      expect(item._constructStreamsUrl("123")).toBe(
        `${altProxiedBaseUrl}/streams?id=temp&locationid=123`
      );
    });

    it("- creates correct feature info template", function () {
      const actualFeatureInfoTemplate: string =
        item.featureInfoTemplate.template?.split(" ").join("") || "";
      expect(actualFeatureInfoTemplate).toBe(
        getExpectedFeatureInfoTemplate(altProxiedBaseUrl)
      );
    });

    it("- only retrieves matching features", function () {
      expect(item.geoJsonItem).toBeDefined();
      expect(geoJsonData.type).toEqual("FeatureCollection");
      expect(geoJsonData.features.length).toEqual(1);
    });

    it("- only retrieves matching streams", function () {
      expect(feature.properties.streamIds.length).toEqual(1);
    });
  });
});
