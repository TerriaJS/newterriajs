import { configure, runInAction } from "mobx";
import _loadWithXhr from "../../../../lib/Core/loadWithXhr";
import Terria from "../../../../lib/Models/Terria";
import registerCatalogMembers from "../../../../lib/Models/Catalog/registerCatalogMembers";

import i18next from "i18next";
import ArcGisPortalItemReference from "../../../../lib/Models/Catalog/Esri/ArcGisPortalItemReference";
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

describe("ArcGisPortalItemReference", function () {
  let terria: Terria;
  let arcGisPortalItemReference: ArcGisPortalItemReference;
  let portalItemTarget: any;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    registerCatalogMembers();
    arcGisPortalItemReference = new ArcGisPortalItemReference(
      "portaltest",
      terria
    );

    const realLoadWithXhr = loadWithXhr.load;
    // We replace calls to real servers with pre-captured JSON files so our testing is isolated, but reflects real data.
    spyOn(loadWithXhr, "load").and.callFake(function (...args: any[]) {
      if (args[0].indexOf("/data") > -1) {
        args[0] = "test/ArcGisPortal/item-data.json";
      } else args[0] = "test/ArcGisPortal/item.json";
      return realLoadWithXhr(...args);
    });
  });

  it("has a type and typeName", function () {
    expect(arcGisPortalItemReference.type).toBe("arcgis-portal-item");
    expect(arcGisPortalItemReference.typeName).toBe(
      i18next.t("models.arcgisPortal.name")
    );
  });

  describe("Can load an item by datasetId - ", function () {
    beforeEach(async function () {
      runInAction(() => {
        arcGisPortalItemReference.setTrait(
          "definition",
          "url",
          "https://portal.spatial.nsw.gov.au/portal"
        );
        arcGisPortalItemReference.setTrait(
          "definition",
          "name",
          "Road Segments"
        );
        arcGisPortalItemReference.setTrait(
          "definition",
          "itemId",
          "66fabd8c23074ecc85883e0086419adc"
        );
      });
      await arcGisPortalItemReference.loadReference();

      portalItemTarget = arcGisPortalItemReference.target;
    });

    it("properly creates item", function () {
      // when creating a single item directly name is retained from the definition stratum
      expect(arcGisPortalItemReference.name).toBe("Road Segments");

      expect(arcGisPortalItemReference._arcgisItem).toBeDefined();
      expect(arcGisPortalItemReference._arcgisPortalCatalogGroup).toBe(
        undefined
      );

      expect(arcGisPortalItemReference).toBeDefined();
      expect(portalItemTarget instanceof ArcGisFeatureServerCatalogItem).toBe(
        true
      );
      expect(portalItemTarget.url).toBe(
        "https://portal.spatial.nsw.gov.au/server/rest/services/NSW_Transport_Theme/FeatureServer/5"
      );

      const licenceInfo = portalItemTarget.info.filter(
        (i: any) => i.name === i18next.t("models.arcgisPortal.licence")
      )[0];
      expect(licenceInfo.content).toBeDefined();

      expect(portalItemTarget.description).toBeDefined();
    });
  });
});
