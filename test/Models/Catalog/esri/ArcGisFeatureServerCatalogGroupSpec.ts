import { configure, runInAction } from "mobx";
import _loadWithXhr from "../../../../lib/Core/loadWithXhr";
import Terria from "../../../../lib/Models/Terria";
import ArcGisFeatureServerCatalogGroup from "../../../../lib/Models/Catalog/Esri/ArcGisFeatureServerCatalogGroup";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import i18next from "i18next";
import ArcGisFeatureServerCatalogItem from "../../../../lib/Models/Catalog/Esri/ArcGisFeatureServerCatalogItem";

configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

interface ExtendedLoadWithXhr {
  (): any;
  load: { (...args: any[]): any; calls?: any };
}

const loadWithXhr: ExtendedLoadWithXhr = _loadWithXhr as any;

describe("ArcGisFeatureServerCatalogGroup", function () {
  const featureServerUrl =
    "http://example.com/arcgis/rest/services/Redlands_Emergency_Vehicles/FeatureServer";
  let terria: Terria;
  let group: ArcGisFeatureServerCatalogGroup;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    group = new ArcGisFeatureServerCatalogGroup("test", terria);

    const realLoadWithXhr = loadWithXhr.load;
    // We replace calls to real servers with pre-captured JSON files so our testing is isolated, but reflects real data.
    spyOn(loadWithXhr, "load").and.callFake(function (...args: any[]) {
      let url = args[0];
      if (url.match("Redlands_Emergency_Vehicles/FeatureServer")) {
        url = url.replace(/^.*\/FeatureServer/, "FeatureServer");
        url = url.replace(/FeatureServer\/?\?f=json$/i, "featureServer.json");
        args[0] = "test/ArcGisFeatureServer/Redlands_Emergency_Vehicles/" + url;
      }

      return realLoadWithXhr(...args);
    });
  });

  it("has a type and typeName", function () {
    expect(group.type).toBe("esri-featureServer-group");
    expect(group.typeName).toBe(
      i18next.t("models.arcGisFeatureServerCatalogGroup.name")
    );
  });

  describe("after loading metadata", function () {
    beforeEach(async function () {
      runInAction(() => {
        group.setTrait("definition", "url", featureServerUrl);
      });
      await group.loadMetadata();
    });

    it("defines info", function () {
      const serviceDescription = i18next.t(
        "models.arcGisFeatureServerCatalogGroup.serviceDescription"
      );
      const dataDescription = i18next.t(
        "models.arcGisFeatureServerCatalogGroup.dataDescription"
      );
      const copyrightText = i18next.t(
        "models.arcGisFeatureServerCatalogGroup.copyrightText"
      );

      expect(group.info.map(({ name }) => name)).toEqual([
        serviceDescription,
        dataDescription,
        copyrightText
      ]);
      expect(group.info.map(({ content }) => content)).toEqual([
        "Vehicle Service Description",
        "Vehicle Description",
        "Vehicle Copyright"
      ]);
    });
  });

  describe("loadMembers", function () {
    it("properly creates members", async function () {
      runInAction(() => {
        group.setTrait(CommonStrata.definition, "url", featureServerUrl);
      });

      await group.loadMembers();

      expect(group.members).toBeDefined();
      expect(group.members.length).toBe(3);

      const member0 = group.memberModels[0] as ArcGisFeatureServerCatalogItem;
      const member1 = group.memberModels[1] as ArcGisFeatureServerCatalogItem;
      const member2 = group.memberModels[2] as ArcGisFeatureServerCatalogItem;

      expect(member0.name).toBe("Ambulances");
      expect(member0.url).toBe(featureServerUrl + "/0");

      expect(member1.name).toBe("Police");
      expect(member1.url).toBe(featureServerUrl + "/1");

      expect(member2.name).toBe("Fire");
      expect(member2.url).toBe(featureServerUrl + "/123");
    });
  });
});
