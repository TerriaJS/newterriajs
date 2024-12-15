import { action, runInAction, toJS, when } from "mobx";
import buildModuleUrl from "terriajs-cesium/Source/Core/buildModuleUrl";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import RequestScheduler from "terriajs-cesium/Source/Core/RequestScheduler";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import SplitDirection from "terriajs-cesium/Source/Scene/SplitDirection";
import hashEntity from "../../lib/Core/hashEntity";
import _loadWithXhr from "../../lib/Core/loadWithXhr";
import Result from "../../lib/Core/Result";
import TerriaError from "../../lib/Core/TerriaError";
import PickedFeatures from "../../lib/Map/PickedFeatures/PickedFeatures";
import CameraView from "../../lib/Models/CameraView";
import CsvCatalogItem from "../../lib/Models/Catalog/CatalogItems/CsvCatalogItem";
import MagdaReference from "../../lib/Models/Catalog/CatalogReferences/MagdaReference";
import UrlReference, {
  UrlToCatalogMemberMapping
} from "../../lib/Models/Catalog/CatalogReferences/UrlReference";
import ArcGisFeatureServerCatalogItem from "../../lib/Models/Catalog/Esri/ArcGisFeatureServerCatalogItem";
import ArcGisMapServerCatalogItem from "../../lib/Models/Catalog/Esri/ArcGisMapServerCatalogItem";
import WebMapServiceCatalogGroup from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogGroup";
import WebMapServiceCatalogItem from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import { BaseModel } from "../../lib/Models/Definition/Model";
import TerriaFeature from "../../lib/Models/Feature/Feature";
import {
  isInitFromData,
  isInitFromDataPromise,
  isInitFromOptions,
  isInitFromUrl
} from "../../lib/Models/InitSource";
import Terria from "../../lib/Models/Terria";
import ViewerMode from "../../lib/Models/ViewerMode";
import ViewState from "../../lib/ReactViewModels/ViewState";
import { buildShareLink } from "../../lib/ReactViews/Map/Panels/SharePanel/BuildShareLink";
import SimpleCatalogItem from "../Helpers/SimpleCatalogItem";
import { defaultBaseMaps } from "../../lib/Models/BaseMaps/defaultBaseMaps";

const mapConfigBasicJson = require("../../wwwroot/test/Magda/map-config-basic.json");
const mapConfigBasicString = JSON.stringify(mapConfigBasicJson);

const mapConfigV7Json = require("../../wwwroot/test/Magda/map-config-v7.json");
const mapConfigV7String = JSON.stringify(mapConfigV7Json);

const mapConfigInlineInitJson = require("../../wwwroot/test/Magda/map-config-inline-init.json");
const mapConfigInlineInitString = JSON.stringify(mapConfigInlineInitJson);

const mapConfigDereferencedJson = require("../../wwwroot/test/Magda/map-config-dereferenced.json");
const mapConfigDereferencedString = JSON.stringify(mapConfigDereferencedJson);

const mapConfigDereferencedNewJson = require("../../wwwroot/test/Magda/map-config-dereferenced-new.json");
const mapConfigDereferencedNewString = JSON.stringify(
  mapConfigDereferencedNewJson
);

// i18nOptions for CI
const i18nOptions = {
  // Skip calling i18next.init in specs
  skipInit: true
};

describe("Terria", function () {
  let terria: Terria;

  beforeEach(function () {
    terria = new Terria({
      appBaseHref: "/",
      baseUrl: "./"
    });
  });

  describe("cesiumBaseUrl", function () {
    it("is set when passed as an option when constructing Terria", function () {
      terria = new Terria({
        appBaseHref: "/",
        baseUrl: "./",
        cesiumBaseUrl: "some/path/to/cesium"
      });
      const path = new URL(terria.cesiumBaseUrl).pathname;
      expect(path).toBe("/some/path/to/cesium/");
    });

    it("should default to a path relative to `baseUrl`", function () {
      terria = new Terria({
        appBaseHref: "/",
        baseUrl: "some/path/to/terria"
      });
      const path = new URL(terria.cesiumBaseUrl).pathname;
      expect(path).toBe("/some/path/to/terria/build/Cesium/build/");
    });

    it("should update the baseUrl setting in the cesium module", function () {
      expect(
        buildModuleUrl("Assets/some/image.png").endsWith(
          "/build/Cesium/build/Assets/some/image.png"
        )
      ).toBe(true);

      terria = new Terria({
        appBaseHref: "/",
        baseUrl: "some/path/to/terria"
      });
      expect(
        buildModuleUrl("Assets/some/image.png").endsWith(
          "/some/path/to/terria/build/Cesium/build/Assets/some/image.png"
        )
      ).toBe(true);
    });
  });

  describe("terria refresh catalog members from magda", function () {
    it("refreshes group aspect with given URL", async function () {
      function verifyGroups(groupAspect: any, groupNum: number) {
        const ids = groupAspect.members.map((member: any) => member.id);
        expect(terria.catalog.group.uniqueId).toEqual("/");
        // ensure user added data co-exists with dereferenced magda members
        expect(terria.catalog.group.members.length).toEqual(groupNum);
        expect(terria.catalog.userAddedDataGroup).toBeDefined();
        ids.forEach((id: string) => {
          const model = terria.getModelById(MagdaReference, id);
          if (!model) {
            throw new Error(`no record id. ID = ${id}`);
          }
          expect(terria.modelIds).toContain(id);
          expect(model.recordId).toEqual(id);
        });
      }

      await terria.start({
        configUrl: "test/Magda/map-config-dereferenced.json",
        i18nOptions
      });
      verifyGroups(mapConfigDereferencedJson.aspects["group"], 3);

      await terria.refreshCatalogMembersFromMagda(
        "test/Magda/map-config-dereferenced-new.json"
      );
      verifyGroups(mapConfigDereferencedNewJson.aspects["group"], 2);
    });
  });

  describe("terria start", function () {
    beforeEach(function () {
      jasmine.Ajax.install();
      // Fail all requests by default.
      jasmine.Ajax.stubRequest(/.*/).andError({});

      jasmine.Ajax.stubRequest(/.*(serverconfig|proxyabledomains).*/).andReturn(
        {
          responseText: JSON.stringify({ foo: "bar" })
        }
      );

      // from `terria.start()`
      jasmine.Ajax.stubRequest("test/Magda/map-config-basic.json").andReturn({
        responseText: mapConfigBasicString
      });

      jasmine.Ajax.stubRequest("test/Magda/map-config-v7.json").andReturn({
        responseText: mapConfigV7String
      });

      // terria's "Magda derived url"
      jasmine.Ajax.stubRequest(
        /.*api\/v0\/registry\/records\/map-config-basic.*/
      ).andReturn({ responseText: mapConfigBasicString });

      // inline init
      jasmine.Ajax.stubRequest(/.*map-config-inline-init.*/).andReturn({
        responseText: mapConfigInlineInitString
      });
      // inline init
      jasmine.Ajax.stubRequest(/.*map-config-dereferenced.*/).andReturn({
        responseText: mapConfigDereferencedString
      });
      jasmine.Ajax.stubRequest(/.*map-config-dereferenced-new.*/).andReturn({
        responseText: mapConfigDereferencedNewString
      });
    });

    afterEach(function () {
      jasmine.Ajax.uninstall();
    });

    it("applies initSources in correct order", async function () {
      expect(terria.initSources.length).toEqual(0);
      jasmine.Ajax.stubRequest("config.json").andReturn({
        responseText: JSON.stringify({
          initializationUrls: ["something"]
        })
      });

      jasmine.Ajax.stubRequest("init/something.json").andReturn({
        responseText: JSON.stringify({
          workbench: ["test"],
          catalog: [
            { id: "test", type: "czml", url: "test.czml" },
            { id: "test-2", type: "czml", url: "test-2.czml" }
          ],
          showSplitter: false,
          splitPosition: 0.5
        })
      });

      jasmine.Ajax.stubRequest(
        "https://application.url/init/hash-init.json"
      ).andReturn({
        responseText: JSON.stringify({
          // Override workbench in "init/something.json"
          workbench: ["test-2"],
          showSplitter: true
        })
      });

      // This model is added to the workbench in "init/something.json" - which is loaded before "https://application.url/init/hash-init.json"
      // So we add a long delay to make sure that `workbench` is overridden by `hash-init.json`
      jasmine.Ajax.stubRequest("test.czml").andCallFunction((req) => {
        setTimeout(
          () =>
            req.respondWith({
              contentType: "text/json",
              responseText: JSON.stringify([{ id: "document", version: "1.0" }])
            }),
          500
        );
      });

      // Note: no delay for "test-2.czml" - which is added to `workbench` by `hash-init.json
      jasmine.Ajax.stubRequest("test-2.czml").andReturn({
        responseText: JSON.stringify([{ id: "document", version: "1.0" }])
      });

      await terria.start({
        configUrl: `config.json`,
        i18nOptions
      });

      await terria.updateApplicationUrl("https://application.url/#hash-init");

      expect(terria.initSources.length).toEqual(2);

      expect(terria.showSplitter).toBe(true);
      expect(terria.splitPosition).toBe(0.5);
      expect(terria.workbench.items.length).toBe(1);
      expect(terria.workbench.items[0].uniqueId).toBe("test-2");
    });

    it("works with initializationUrls and initFragmentPaths", async function () {
      expect(terria.initSources.length).toEqual(0);

      jasmine.Ajax.stubRequest("path/to/config/configUrl.json").andReturn({
        responseText: JSON.stringify({
          initializationUrls: ["something"],
          parameters: {
            applicationUrl: "https://application.url/",
            initFragmentPaths: [
              "path/to/init/",
              "https://hostname.com/some/other/path/"
            ]
          }
        })
      });

      await terria.start({
        configUrl: `path/to/config/configUrl.json`,
        i18nOptions
      });

      expect(terria.initSources.length).toEqual(1);

      const initSource = terria.initSources[0];
      expect(isInitFromOptions(initSource)).toBeTruthy();

      if (!isInitFromOptions(initSource))
        throw "Init source is not from options";

      // Note: initFragmentPaths in `initializationUrls` are resolved to the base URL of configURL
      // - which is path/to/config/
      expect(
        initSource.options.map((source) =>
          isInitFromUrl(source) ? source.initUrl : ""
        )
      ).toEqual([
        "path/to/config/path/to/init/something.json",
        "https://hostname.com/some/other/path/something.json"
      ]);
    });

    describe("via loadMagdaConfig", function () {
      it("should dereference uniqueId to `/`", function (done) {
        expect(terria.catalog.group.uniqueId).toEqual("/");

        jasmine.Ajax.stubRequest(/.*api\/v0\/registry.*/).andReturn({
          // terria's "Magda derived url"
          responseText: mapConfigBasicString
        });
        // no init sources before starting
        expect(terria.initSources.length).toEqual(0);

        terria
          .start({
            configUrl: "test/Magda/map-config-basic.json",
            i18nOptions
          })
          .then(function () {
            expect(terria.catalog.group.uniqueId).toEqual("/");
            done();
          })
          .catch((error) => {
            done.fail(error);
          });
      });

      it("works with basic initializationUrls", function (done) {
        jasmine.Ajax.stubRequest(/.*api\/v0\/registry.*/).andReturn({
          // terria's "Magda derived url"
          responseText: mapConfigBasicString
        });
        // no init sources before starting
        expect(terria.initSources.length).toEqual(0);

        terria
          .start({
            configUrl: "test/Magda/map-config-basic.json",
            i18nOptions
          })
          .then(function () {
            expect(terria.initSources.length).toEqual(1);
            expect(isInitFromUrl(terria.initSources[0])).toEqual(true);
            if (isInitFromUrl(terria.initSources[0])) {
              expect(terria.initSources[0].initUrl).toEqual(
                mapConfigBasicJson.aspects["terria-config"]
                  .initializationUrls[0]
              );
            } else {
              throw "not init source";
            }
            done();
          })
          .catch((error) => {
            done.fail(error);
          });
      });

      it("works with v7initializationUrls", async function () {
        jasmine.Ajax.stubRequest(/.*api\/v0\/registry.*/).andReturn({
          // terria's "Magda derived url"
          responseText: mapConfigBasicString
        });
        const groupName = "Simple converter test";
        jasmine.Ajax.stubRequest(
          "https://example.foo.bar/initv7.json"
        ).andReturn({
          // terria's "Magda derived url"
          responseText: JSON.stringify({
            catalog: [{ name: groupName, type: "group", items: [] }]
          })
        });
        // no init sources before starting
        expect(terria.initSources.length).toBe(0);

        await terria.start({
          configUrl: "test/Magda/map-config-v7.json",
          i18nOptions
        });

        expect(terria.initSources.length).toBe(1);
        expect(isInitFromDataPromise(terria.initSources[0])).toBeTruthy(
          "Expected initSources[0] to be an InitDataPromise"
        );
        if (isInitFromDataPromise(terria.initSources[0])) {
          const data = await terria.initSources[0].data;
          // JSON parse & stringify to avoid a problem where I think catalog-converter
          //  can return {"id": undefined} instead of no "id"
          expect(
            JSON.parse(JSON.stringify(data.ignoreError()?.data.catalog))
          ).toEqual([
            {
              name: groupName,
              type: "group",
              members: [],
              shareKeys: [`Root Group/${groupName}`]
            }
          ]);
        }
      });
      it("works with inline init", async function () {
        // inline init
        jasmine.Ajax.stubRequest(/.*api\/v0\/registry.*/).andReturn({
          responseText: mapConfigInlineInitString
        });
        // no init sources before starting
        expect(terria.initSources.length).toEqual(0);
        await terria.start({
          configUrl: "test/Magda/map-config-inline-init.json",
          i18nOptions
        });

        const inlineInit = mapConfigInlineInitJson.aspects["terria-init"];
        /** Check cors domains */
        expect(terria.corsProxy.corsDomains).toEqual(inlineInit.corsDomains);
        /** Camera setting */
        expect(terria.mainViewer.homeCamera).toEqual(
          CameraView.fromJson(inlineInit.homeCamera)
        );

        /** Ensure inlined data catalog from init sources */
        expect(terria.initSources.length).toEqual(1);
        if (isInitFromData(terria.initSources[0])) {
          expect(terria.initSources[0].data.catalog).toEqual(
            inlineInit.catalog
          );
        } else {
          throw "not init source";
        }
      });
      it("parses dereferenced group aspect", async function (done) {
        expect(terria.catalog.group.uniqueId).toEqual("/");
        // dereferenced res
        jasmine.Ajax.stubRequest(/.*api\/v0\/registry.*/).andReturn({
          responseText: mapConfigDereferencedString
        });
        await terria
          .start({
            configUrl: "test/Magda/map-config-dereferenced.json",
            i18nOptions
          })
          .then(function () {
            const groupAspect = mapConfigDereferencedJson.aspects["group"];
            const ids = groupAspect.members.map((member: any) => member.id);
            expect(terria.catalog.group.uniqueId).toEqual("/");
            // ensure user added data co-exists with dereferenced magda members
            expect(terria.catalog.group.members.length).toEqual(3);
            expect(terria.catalog.userAddedDataGroup).toBeDefined();
            ids.forEach((id: string) => {
              const model = terria.getModelById(MagdaReference, id);
              if (!model) {
                throw "no record id.";
              }
              expect(terria.modelIds).toContain(id);
              expect(model.recordId).toEqual(id);
            });
            done();
          })
          .catch((error) => {
            done.fail(error);
          });
      });
    });

    it("calls `beforeRestoreAppState` before restoring app state from share data", async function () {
      terria = new Terria({
        appBaseHref: "/",
        baseUrl: "./"
      });

      const restoreAppState = spyOn(
        terria,
        "restoreAppState" as any
      ).and.callThrough();

      const beforeRestoreAppState = jasmine
        .createSpy("beforeRestoreAppState")
        // It should also handle errors when calling beforeRestoreAppState
        .and.returnValue(Promise.reject("some error"));

      expect(terria.mainViewer.viewerMode).toBe(ViewerMode.Cesium);
      await terria.start({
        configUrl: "",
        applicationUrl: {
          href: "http://test.com/#map=2d"
        } as Location,
        beforeRestoreAppState
      });

      expect(terria.mainViewer.viewerMode).toBe(ViewerMode.Leaflet);
      expect(beforeRestoreAppState).toHaveBeenCalledBefore(restoreAppState);
    });
  });

  describe("updateApplicationUrl", function () {
    it("works with initializationUrls and initFragmentPaths", async function () {
      expect(terria.initSources.length).toEqual(0);

      jasmine.Ajax.install();
      // Fail all requests by default.
      jasmine.Ajax.stubRequest(/.*/).andError({});

      jasmine.Ajax.stubRequest("path/to/config/configUrl.json").andReturn({
        responseText: JSON.stringify({
          initializationUrls: ["something"],
          parameters: {
            applicationUrl: "https://application.url/",
            initFragmentPaths: [
              "path/to/init/",
              "https://hostname.com/some/other/path/"
            ]
          }
        })
      });

      await terria.start({
        configUrl: `path/to/config/configUrl.json`,
        i18nOptions
      });

      await terria.updateApplicationUrl(
        "https://application.url/#someInitHash"
      );

      expect(terria.initSources.length).toEqual(2);

      const initSource = terria.initSources[1];
      expect(isInitFromOptions(initSource)).toBeTruthy();

      if (!isInitFromOptions(initSource))
        throw "Init source is not from options";

      // Note: initFragmentPaths in hash parameters are resolved to the base URL of application URL
      // - which is https://application.url/
      expect(
        initSource.options.map((source) =>
          isInitFromUrl(source) ? source.initUrl : ""
        )
      ).toEqual([
        "https://application.url/path/to/init/someInitHash.json",
        "https://hostname.com/some/other/path/someInitHash.json"
      ]);

      jasmine.Ajax.uninstall();
    });

    it("processes #start correctly", async function () {
      expect(terria.initSources.length).toEqual(0);

      jasmine.Ajax.install();
      // Fail all requests by default.
      jasmine.Ajax.stubRequest(/.*/).andError({});

      jasmine.Ajax.stubRequest("configUrl.json").andReturn({
        responseText: JSON.stringify({})
      });

      await terria.start({
        configUrl: `configUrl.json`,
        i18nOptions
      });

      // Test #start with two init sources
      // - one initURL = "http://something/init.json"
      // - one initData which sets `splitPosition`
      await terria.updateApplicationUrl(
        "https://application.url/#start=" +
          JSON.stringify({
            version: "8.0.0",
            initSources: ["http://something/init.json", { splitPosition: 0.3 }]
          })
      );

      expect(terria.initSources.length).toEqual(2);

      const urlInitSource = terria.initSources[0];
      expect(isInitFromUrl(urlInitSource)).toBeTruthy();

      if (!isInitFromUrl(urlInitSource)) throw "Init source is not from url";

      expect(urlInitSource.initUrl).toBe("http://something/init.json");

      const jsonInitSource = terria.initSources[1];
      expect(isInitFromData(jsonInitSource)).toBeTruthy();

      if (!isInitFromData(jsonInitSource)) throw "Init source is not from data";

      expect(jsonInitSource.data.splitPosition).toBe(0.3);

      jasmine.Ajax.uninstall();
    });

    describe("test via serialise & load round-trip", function () {
      let newTerria: Terria;
      let viewState: ViewState;

      beforeEach(function () {
        newTerria = new Terria({ appBaseHref: "/", baseUrl: "./" });
        viewState = new ViewState({
          terria: terria,
          catalogSearchProvider: undefined
        });

        UrlToCatalogMemberMapping.register(
          (_s) => true,
          WebMapServiceCatalogItem.type,
          true
        );

        terria.catalog.userAddedDataGroup.addMembersFromJson(
          CommonStrata.user,
          [
            {
              id: "itemABC",
              name: "abc",
              type: "wms",
              url: "test/WMS/single_metadata_url.xml"
            },
            {
              id: "groupABC",
              name: "xyz",
              type: "wms-group",
              url: "test/WMS/single_metadata_url.xml"
            }
          ]
        );

        terria.catalog.group.addMembersFromJson(CommonStrata.user, [
          {
            id: "itemDEF",
            name: "def",
            type: "wms",
            url: "test/WMS/single_metadata_url.xml"
          }
        ]);
      });

      it("initializes user added data group with shared items", async function () {
        expect(newTerria.catalog.userAddedDataGroup.members).not.toContain(
          "itemABC"
        );
        expect(newTerria.catalog.userAddedDataGroup.members).not.toContain(
          "groupABC"
        );

        const shareLink = buildShareLink(terria, viewState);
        await newTerria.updateApplicationUrl(shareLink);
        await newTerria.loadInitSources();
        expect(newTerria.catalog.userAddedDataGroup.members).toContain(
          "itemABC"
        );
        expect(newTerria.catalog.userAddedDataGroup.members).toContain(
          "groupABC"
        );
      });

      it("initializes user added data group with shared UrlReference items", async function () {
        terria.catalog.userAddedDataGroup.addMembersFromJson(
          CommonStrata.user,
          [
            {
              id: "url_test",
              name: "foo",
              type: "url-reference",
              url: "test/WMS/single_metadata_url.xml"
            }
          ]
        );

        const shareLink = buildShareLink(terria, viewState);
        await newTerria.updateApplicationUrl(shareLink);
        await newTerria.loadInitSources();
        expect(newTerria.catalog.userAddedDataGroup.members).toContain(
          "url_test"
        );
        const urlRef = newTerria.getModelById(BaseModel, "url_test");
        expect(urlRef).toBeDefined();
        expect(urlRef instanceof UrlReference).toBe(true);

        if (urlRef instanceof UrlReference) {
          await urlRef.loadReference();
          expect(urlRef.target).toBeDefined();
        }
      });

      it("initializes workbench with shared workbench items", async function () {
        const model1 = terria.getModelById(
          BaseModel,
          "itemABC"
        ) as WebMapServiceCatalogItem;
        const model2 = terria.getModelById(
          BaseModel,
          "itemDEF"
        ) as WebMapServiceCatalogItem;
        terria.workbench.add(model1);
        terria.workbench.add(model2);
        expect(terria.workbench.itemIds).toContain("itemABC");
        expect(terria.workbench.itemIds).toContain("itemDEF");
        expect(newTerria.workbench.itemIds).toEqual([]);

        const shareLink = buildShareLink(terria, viewState);
        await newTerria.updateApplicationUrl(shareLink);
        await newTerria.loadInitSources();
        expect(newTerria.workbench.itemIds).toEqual(terria.workbench.itemIds);
      });

      it("initializes splitter correctly", async function () {
        const model1 = terria.getModelById(
          BaseModel,
          "itemABC"
        ) as WebMapServiceCatalogItem;
        terria.workbench.add(model1);

        runInAction(() => {
          terria.showSplitter = true;
          terria.splitPosition = 0.7;
          model1.setTrait(
            CommonStrata.user,
            "splitDirection",
            SplitDirection.RIGHT
          );
        });

        const shareLink = buildShareLink(terria, viewState);
        await newTerria.updateApplicationUrl(shareLink);
        await newTerria.loadInitSources();
        expect(newTerria.showSplitter).toEqual(true);
        expect(newTerria.splitPosition).toEqual(0.7);
        expect(newTerria.workbench.itemIds).toEqual(["itemABC"]);

        const newModel1 = newTerria.getModelById(
          BaseModel,
          "itemABC"
        ) as WebMapServiceCatalogItem;
        expect(newModel1).toBeDefined();
        expect(newModel1.splitDirection).toEqual(SplitDirection.RIGHT as any);
      });

      it("opens and loads members of shared open groups", async function () {
        const group = terria.getModelById(
          BaseModel,
          "groupABC"
        ) as WebMapServiceCatalogGroup;
        await viewState.viewCatalogMember(group);
        expect(group.isOpen).toBe(true);
        expect(group.members.length).toBeGreaterThan(0);
        const shareLink = buildShareLink(terria, viewState);
        await newTerria.updateApplicationUrl(shareLink);
        await newTerria.loadInitSources();
        const newGroup = newTerria.getModelById(
          BaseModel,
          "groupABC"
        ) as WebMapServiceCatalogGroup;
        expect(newGroup.isOpen).toBe(true);
        expect(newGroup.members).toEqual(group.members);
      });
    });

    describe("using story route", function () {
      beforeEach(function () {
        // These specs must run with a Terria constructed with "appBaseHref": "/"
        // to make the specs work with Karma runner
        terria.updateParameters({
          storyRouteUrlPrefix: "test/stories/TerriaJS%20App/"
        });
      });

      it("sets playStory to 1", async function () {
        await terria.updateApplicationUrl(
          new URL("story/my-story", document.baseURI).toString()
        );
        expect(terria.userProperties.get("playStory")).toBe("1");
      });
      it("correctly adds the story share as a datasource", async function () {
        await terria.updateApplicationUrl(
          new URL("story/my-story", document.baseURI).toString()
        );
        expect(terria.initSources.length).toBe(1);
        expect(terria.initSources[0].name).toMatch(/my-story/);
        if (!isInitFromData(terria.initSources[0]))
          throw new Error("Expected initSource to be InitData from my-story");

        expect(toJS(terria.initSources[0].data)).toEqual(
          (await (await fetch("test/stories/TerriaJS%20App/my-story")).json())
            .initSources[0]
        );
      });
      it("correctly adds the story share as a datasource when there's a trailing slash on story url", async function () {
        await terria.updateApplicationUrl(
          new URL("story/my-story/", document.baseURI).toString()
        );
        expect(terria.initSources.length).toBe(1);
        expect(terria.initSources[0].name).toMatch(/my-story/);
        if (!isInitFromData(terria.initSources[0]))
          throw new Error("Expected initSource to be InitData from my-story");

        expect(toJS(terria.initSources[0].data)).toEqual(
          (await (await fetch("test/stories/TerriaJS%20App/my-story")).json())
            .initSources[0]
        );
      });
    });
  });

  // Test share keys by serialising from one catalog and deserialising with a reorganised catalog
  describe("shareKeys", function () {
    describe("with a JSON catalog", function () {
      let newTerria: Terria;
      let viewState: ViewState;
      beforeEach(async function () {
        // Create a config.json in a URL to pass to Terria.start
        const configUrl = `data:application/json;base64,${btoa(
          JSON.stringify({
            initializationUrls: [],
            parameters: {
              regionMappingDefinitionsUrls: ["data/regionMapping.json"]
            }
          })
        )}`;
        newTerria = new Terria({ baseUrl: "./" });
        viewState = new ViewState({
          terria: terria,
          catalogSearchProvider: undefined
        });

        await Promise.all(
          [terria, newTerria].map((t) => t.start({ configUrl, i18nOptions }))
        );

        terria.catalog.group.addMembersFromJson(CommonStrata.definition, [
          {
            name: "Old group",
            type: "group",
            members: [
              {
                name: "Random CSV",
                type: "csv",
                url: "data:text/csv,lon%2Clat%2Cval%2Cdate%0A151%2C-31%2C15%2C2010%0A151%2C-31%2C15%2C2011"
              }
            ]
          }
        ]);

        newTerria.catalog.group.addMembersFromJson(CommonStrata.definition, [
          {
            name: "New group",
            type: "group",
            members: [
              {
                name: "Extra group",
                type: "group",
                members: [
                  {
                    name: "My random CSV",
                    type: "csv",
                    url: "data:text/csv,lon%2Clat%2Cval%2Cdate%0A151%2C-31%2C15%2C2010%0A151%2C-31%2C15%2C2011",
                    shareKeys: ["//Old group/Random CSV"]
                  }
                ]
              }
            ]
          }
        ]);
      });

      it("correctly applies user stratum changes to moved item", async function () {
        const csv = terria.getModelById(
          CsvCatalogItem,
          "//Old group/Random CSV"
        );
        expect(csv).toBeDefined("Can't find csv item in source terria");
        csv?.setTrait(CommonStrata.user, "opacity", 0.5);
        const shareLink = buildShareLink(terria, viewState);
        await newTerria.updateApplicationUrl(shareLink);
        await newTerria.loadInitSources();

        const newCsv = newTerria.getModelById(
          CsvCatalogItem,
          "//New group/Extra group/My random CSV"
        );
        expect(newCsv).toBeDefined(
          "Can't find newCsv item in destination newTerria"
        );
        expect(newCsv?.opacity).toBe(0.5);
      });

      it("correctly adds moved item to workbench and timeline", async function () {
        const csv = terria.getModelById(
          CsvCatalogItem,
          "//Old group/Random CSV"
        );
        expect(csv).toBeDefined("csv not found in source terria");
        if (csv === undefined) return;
        terria.workbench.add(csv);
        terria.timelineStack.addToTop(csv);
        const shareLink = buildShareLink(terria, viewState);
        await newTerria.updateApplicationUrl(shareLink);
        await newTerria.loadInitSources();

        const newCsv = newTerria.getModelById(
          CsvCatalogItem,
          "//New group/Extra group/My random CSV"
        );
        expect(newCsv).toBeDefined("newCsv not found in destination newTerria");
        if (newCsv === undefined) return;
        expect(newTerria.workbench.contains(newCsv)).toBeTruthy(
          "newCsv not found in destination newTerria workbench"
        );
        expect(newTerria.timelineStack.contains(newCsv)).toBeTruthy(
          "newCsv not found in destination newTerria timeline"
        );
      });
    });

    describe("with a Magda catalog", function () {
      // Simulate same as above but with Magda catalogs
      // This is really messy before a proper MagdaCatalogProvider is made
      //  that can call a (currently not yet written) Magda API to find the location of
      //  any id within a catalog

      // Could at least simulate moving an item deeper (similar to JSON catalog) and try having
      //  one of the knownContainerIds be shareKey linked to the new location?
      //  (hopefully that would trigger loading of the new group)

      let newTerria: Terria;
      let viewState: ViewState;
      beforeEach(async function () {
        // Create a config.json in a URL to pass to Terria.start
        const configUrl =
          "https://magda.example.com/api/v0/registry/records/map-config-example?optionalAspect=terria-config&optionalAspect=terria-init&optionalAspect=group&dereference=true";

        viewState = new ViewState({
          terria: terria,
          catalogSearchProvider: undefined
        });
        newTerria = new Terria({ baseUrl: "./" });

        // Simulate an update to catalog/config between terria and newTerria

        jasmine.Ajax.install();
        jasmine.Ajax.stubRequest(/.*/).andError({});
        // .andCallFunction(request =>
        //   console.error(`Request attempted: ${request.url}`)
        // );

        jasmine.Ajax.stubRequest("serverconfig/").andReturn({
          responseText: "{}"
        });

        jasmine.Ajax.stubRequest(
          "https://magda.example.com/api/v0/registry/records/6b24aa39-1aa7-48d1-b6a6-9e755aff4476?optionalAspect=terria&optionalAspect=group&optionalAspect=dcat-dataset-strings&optionalAspect=dcat-distribution-strings&optionalAspect=dataset-distributions&optionalAspect=dataset-format&dereference=true"
        ).andReturn({
          responseText: JSON.stringify(
            require("../../wwwroot/test/Magda/shareKeys/6b24aa39-1aa7-48d1-b6a6-9e755aff4476.json")
          )
        });

        jasmine.Ajax.stubRequest(
          "https://magda.example.com/api/v0/registry/records/bfc69476-1c85-4208-9046-4f736bab9b8e?optionalAspect=terria&optionalAspect=group&optionalAspect=dcat-dataset-strings&optionalAspect=dcat-distribution-strings&optionalAspect=dataset-distributions&optionalAspect=dataset-format&dereference=true"
        ).andReturn({
          responseText: JSON.stringify(
            require("../../wwwroot/test/Magda/shareKeys/bfc69476-1c85-4208-9046-4f736bab9b8e.json")
          )
        });

        jasmine.Ajax.stubRequest(
          "https://magda.example.com/api/v0/registry/records/12f26f07-f39e-4753-979d-2de01af54bd1?optionalAspect=terria&optionalAspect=group&optionalAspect=dcat-dataset-strings&optionalAspect=dcat-distribution-strings&optionalAspect=dataset-distributions&optionalAspect=dataset-format&dereference=true"
        ).andReturn({
          responseText: JSON.stringify(
            require("../../wwwroot/test/Magda/shareKeys/12f26f07-f39e-4753-979d-2de01af54bd1.json")
          )
        });

        jasmine.Ajax.stubRequest(configUrl).andReturn({
          responseText: JSON.stringify(
            require("../../wwwroot/test/Magda/shareKeys/map-config-example-old.json")
          )
        });

        await terria.start({
          configUrl,
          i18nOptions
        });
        jasmine.Ajax.stubRequest(configUrl).andReturn({
          responseText: JSON.stringify(
            require("../../wwwroot/test/Magda/shareKeys/map-config-example-new.json")
          )
        });

        await newTerria.start({
          configUrl,
          i18nOptions
        });
        // Don't allow more requests to configUrl once Terrias are set up
        jasmine.Ajax.stubRequest(configUrl).andError({});
      });

      afterEach(function () {
        jasmine.Ajax.uninstall();
      });

      it("correctly applies user stratum changes to moved item", async function () {
        const oldGroupRef = terria.getModelById(
          MagdaReference,
          "6b24aa39-1aa7-48d1-b6a6-9e755aff4476"
        );
        expect(oldGroupRef).toBeDefined(
          "Can't find Old group reference in source terria"
        );
        if (oldGroupRef === undefined) return;
        await oldGroupRef.loadReference();
        expect(oldGroupRef.target).toBeDefined(
          "Can't dereference Old group in source terria"
        );

        const csv = terria.getModelById(
          CsvCatalogItem,
          "3432284e-a111-4844-97c8-26a1767f9986"
        );
        expect(csv).toBeDefined("Can't dereference csv in source terria");
        if (csv === undefined) return;
        csv.setTrait(CommonStrata.user, "opacity", 0.5);
        const shareLink = buildShareLink(terria, viewState);

        // Hack to make below test succeed. This needs to be there until we add a magda API that can locate any
        //  item by ID or share key within a Terria catalog
        // Loads "New group" (bfc69476-1c85-4208-9046-4f736bab9b8e) which registers shareKeys for
        //  "Extra group" (12f26f07-f39e-4753-979d-2de01af54bd1). And "Extra group" has a share key
        //  that matches the ancestor of the serialised Random CSV, so loading is triggered on "Extra group"
        //  followed by 3432284e-a111-4844-97c8-26a1767f9986 which points to "My random CSV"
        //  (decfc787-0425-4175-a98c-a40db064feb3)
        const newGroupRef = newTerria.getModelById(
          MagdaReference,
          "bfc69476-1c85-4208-9046-4f736bab9b8e"
        );
        if (newGroupRef === undefined) return;
        await newGroupRef.loadReference();

        await newTerria.updateApplicationUrl(shareLink);
        await newTerria.loadInitSources();

        // Why does this return a CSV item (when above hack isn't added)? It returns a brand new csv item without data or URL
        // Does serialisation save enough attributes that upsertModelFromJson thinks it can create a new model?
        // upsertModelFromJson should really be replaced with update + insert functions
        // But is it always easy to work out when share data should use update and when it should insert?
        // E.g. user added models should be inserted when deserialised, not updated
        const newCsv = newTerria.getModelByIdOrShareKey(
          CsvCatalogItem,
          "3432284e-a111-4844-97c8-26a1767f9986"
        );
        expect(newCsv).toBeDefined(
          "Can't find newCsv item in destination newTerria"
        );

        expect(newCsv?.uniqueId).toBe(
          "decfc787-0425-4175-a98c-a40db064feb3",
          "Failed to map share key to correct model"
        );
        expect(newCsv?.opacity).toBe(0.5);
      });

      it("correctly adds moved item to workbench and timeline", async function () {
        const oldGroupRef = terria.getModelById(
          MagdaReference,
          "6b24aa39-1aa7-48d1-b6a6-9e755aff4476"
        );
        expect(oldGroupRef).toBeDefined(
          "Can't find Old group reference in source terria"
        );
        if (oldGroupRef === undefined) return;
        await oldGroupRef.loadReference();
        expect(oldGroupRef.target).toBeDefined(
          "Can't dereference Old group in source terria"
        );

        const csv = terria.getModelById(
          CsvCatalogItem,
          "3432284e-a111-4844-97c8-26a1767f9986"
        );
        expect(csv).toBeDefined("Can't dereference csv in source terria");
        if (csv === undefined) return;
        terria.workbench.add(csv);
        terria.timelineStack.addToTop(csv);

        const shareLink = buildShareLink(terria, viewState);

        // Hack to make below test succeed. Needs to be there until we add a magda API that can locate any
        //  item by ID or share key within a Terria catalog
        // Loads "New group" (bfc69476-1c85-4208-9046-4f736bab9b8e) which registers shareKeys for
        //  "Extra group" (12f26f07-f39e-4753-979d-2de01af54bd1). And "Extra group" has a share key
        //  that matches the ancestor of the serialised Random CSV, so loading is triggered on "Extra group"
        //  followed by 3432284e-a111-4844-97c8-26a1767f9986 which points to "My random CSV"
        //  (decfc787-0425-4175-a98c-a40db064feb3)
        const newGroupRef = newTerria.getModelById(
          MagdaReference,
          "bfc69476-1c85-4208-9046-4f736bab9b8e"
        );
        if (newGroupRef === undefined) return;
        await newGroupRef.loadReference();

        await newTerria.updateApplicationUrl(shareLink);
        await newTerria.loadInitSources();

        // Why does this return a CSV item (when above hack isn't added)? It returns a brand new csv item without data or URL
        // Does serialisation save enough attributes that upsertModelFromJson thinks it can create a new model?
        // upsertModelFromJson should really be replaced with update + insert functions
        // But is it always easy to work out when share data should use update and when it should insert?
        // E.g. user added models should be inserted when deserialised, not updated
        const newCsv = newTerria.getModelByIdOrShareKey(
          CsvCatalogItem,
          "3432284e-a111-4844-97c8-26a1767f9986"
        );
        expect(newCsv).toBeDefined(
          "Can't find newCsv item in destination newTerria"
        );
        if (newCsv === undefined) return;

        expect(newCsv.uniqueId).toBe(
          "decfc787-0425-4175-a98c-a40db064feb3",
          "Failed to map share key to correct model"
        );
        expect(newTerria.workbench.contains(newCsv)).toBeTruthy(
          "newCsv not found in destination newTerria workbench"
        );
        expect(newTerria.timelineStack.contains(newCsv)).toBeTruthy(
          "newCsv not found in destination newTerria timeline"
        );
      });
    });
  });

  describe("proxyConfiguration", function () {
    beforeEach(function () {
      jasmine.Ajax.install();
      jasmine.Ajax.stubRequest(/.*(test\/init\/configProxy).*/).andReturn({
        responseText: JSON.stringify(
          require("../../wwwroot/test/init/configProxy.json")
        )
      });
      jasmine.Ajax.stubRequest(/.*(serverconfig).*/).andReturn({
        responseText: JSON.stringify(
          require("../../wwwroot/test/init/serverconfig.json")
        )
      });
    });

    afterEach(function () {
      jasmine.Ajax.uninstall();
    });

    it("initializes proxy with parameters from config file", function (done) {
      terria
        .start({
          configUrl: "test/init/configProxy.json",
          i18nOptions
        })
        .then(function () {
          expect(terria.corsProxy.baseProxyUrl).toBe("/myproxy/");
          expect(terria.corsProxy.proxyDomains).toEqual([
            "example.com",
            "csiro.au"
          ]);
          done();
        })
        .catch((_error) => {
          done.fail();
        });
    });
  });

  describe("removeModelReferences", function () {
    let model: SimpleCatalogItem;
    beforeEach(function () {
      model = new SimpleCatalogItem("testId", terria);
      terria.addModel(model);
    });

    it("removes the model from workbench", function () {
      terria.workbench.add(model);
      terria.removeModelReferences(model);
      expect(terria.workbench).not.toContain(model);
    });

    it(
      "it removes picked features & selected feature for the model",
      action(function () {
        terria.pickedFeatures = new PickedFeatures();
        const feature = new TerriaFeature({});
        terria.selectedFeature = feature;
        feature._catalogItem = model;
        terria.pickedFeatures.features.push(feature);
        terria.removeModelReferences(model);
        expect(terria.pickedFeatures.features.length).toBe(0);
        expect(terria.selectedFeature).toBeUndefined();
      })
    );

    it("unregisters the model from Terria", function () {
      terria.removeModelReferences(model);
      expect(terria.getModelById(BaseModel, "testId")).toBeUndefined();
    });
  });

  //   it("tells us there's a time enabled WMS with `checkNowViewingForTimeWms()`", function(done) {
  //     terria
  //       .start({
  //         configUrl: "test/init/configProxy.json",
  //         i18nOptions
  //       })
  //       .then(function() {
  //         expect(terria.checkNowViewingForTimeWms()).toEqual(false);
  //       })
  //       .then(function() {
  //         const wmsItem = new WebMapServiceCatalogItem(terria);
  //         wmsItem.updateFromJson({
  //           url: "http://example.com",
  //           metadataUrl: "test/WMS/comma_sep_datetimes_inherited.xml",
  //           layers: "13_intervals",
  //           dataUrl: "" // to prevent a DescribeLayer request
  //         });
  //         wmsItem
  //           .load()
  //           .then(function() {
  //             terria.nowViewing.add(wmsItem);
  //             expect(terria.checkNowViewingForTimeWms()).toEqual(true);
  //           })
  //           .then(done)
  //           .catch(done.fail);
  //       })
  //       .catch(done.fail);
  //   });

  describe("applyInitData", function () {
    describe("when pickedFeatures is not present in initData", function () {
      it("unsets the feature picking state if `canUnsetFeaturePickingState` is `true`", async function () {
        terria.pickedFeatures = new PickedFeatures();
        terria.selectedFeature = new Entity({
          name: "selected"
        }) as TerriaFeature;
        await terria.applyInitData({
          initData: {},
          canUnsetFeaturePickingState: true
        });
        expect(terria.pickedFeatures).toBeUndefined();
        expect(terria.selectedFeature).toBeUndefined();
      });

      it("otherwise, should not unset feature picking state", async function () {
        terria.pickedFeatures = new PickedFeatures();
        terria.selectedFeature = new Entity({
          name: "selected"
        }) as TerriaFeature;
        await terria.applyInitData({
          initData: {}
        });
        expect(terria.pickedFeatures).toBeDefined();
        expect(terria.selectedFeature).toBeDefined();
      });
    });

    describe("Sets workbench contents correctly", function () {
      interface ExtendedLoadWithXhr {
        (): any;
        load: { (...args: any[]): any; calls?: any };
      }
      const loadWithXhr: ExtendedLoadWithXhr = _loadWithXhr as any;
      const mapServerSimpleGroupUrl =
        "http://some.service.gov.au/arcgis/rest/services/mapServerSimpleGroup/MapServer";
      const mapServerWithErrorUrl =
        "http://some.service.gov.au/arcgis/rest/services/mapServerWithError/MapServer";
      const magdaRecordFeatureServerGroupUrl =
        "http://magda.reference.group.service.gov.au";
      const magdaRecordDerefencedToWmsUrl =
        "http://magda.references.wms.gov.au";

      const mapServerGroupModel = {
        type: "esri-mapServer-group",
        name: "A simple map server group",
        url: mapServerSimpleGroupUrl,
        id: "a-test-server-group"
      };

      const magdaRecordDerefencedToFeatureServerGroup = {
        type: "magda",
        name: "A magda record derefenced to a simple feature server group",
        url: magdaRecordFeatureServerGroupUrl,
        recordId: "magda-record-id-dereferenced-to-feature-server-group",
        id: "a-test-magda-record"
      };

      const magdaRecordDerefencedToWms = {
        type: "magda",
        name: "A magda record derefenced to wms",
        url: magdaRecordDerefencedToWmsUrl,
        recordId: "magda-record-id-dereferenced-to-wms",
        id: "another-test-magda-record"
      };

      const mapServerModelWithError = {
        type: "esri-mapServer-group",
        name: "A map server with error",
        url: mapServerWithErrorUrl,
        id: "a-test-server-with-error"
      };

      const theOrderedItemsIds = [
        "a-test-server-group/0",
        "a-test-magda-record/0",
        "another-test-magda-record"
      ];

      let loadMapItemsWms: any = undefined;
      let loadMapItemsArcGisMap: any = undefined;
      let loadMapItemsArcGisFeature: any = undefined;
      beforeEach(function () {
        const realLoadWithXhr = loadWithXhr.load;
        spyOn(loadWithXhr, "load").and.callFake(function (...args: any[]) {
          const url = args[0];

          if (
            url.match("mapServerSimpleGroup") &&
            url.indexOf("MapServer?f=json") !== -1
          ) {
            args[0] =
              "test/Terria/applyInitData/MapServer/mapServerSimpleGroup.json";
          } else if (
            url.match("mapServerWithError") &&
            url.indexOf("MapServer?f=json") !== -1
          ) {
            args[0] =
              "test/Terria/applyInitData/MapServer/mapServerWithError.json";
          } else if (
            url.match("magda-record-id-dereferenced-to-feature-server-group")
          ) {
            args[0] =
              "test/Terria/applyInitData/MagdaReference/group_record.json";
          } else if (url.match("magda-record-id-dereferenced-to-wms")) {
            args[0] =
              "test/Terria/applyInitData/MagdaReference/wms_record.json";
          } else if (
            url.match("services2.arcgis.com") &&
            url.indexOf("FeatureServer?f=json") !== -1
          ) {
            args[0] =
              "test/Terria/applyInitData/FeatureServer/esri_feature_server.json";
          } else if (
            url.match("mapprod1.environment.nsw.gov.au") &&
            url.indexOf("request=GetCapabilities") !== -1
          ) {
            args[0] = "test/Terria/applyInitData/WmsServer/capabilities.xml";
          }

          const result = realLoadWithXhr(...args);
          return result;
        });

        // Do not call through.
        loadMapItemsArcGisMap = spyOn(
          ArcGisMapServerCatalogItem.prototype,
          "loadMapItems"
        ).and.returnValue(Result.none());
        loadMapItemsArcGisFeature = spyOn(
          ArcGisFeatureServerCatalogItem.prototype,
          "loadMapItems"
        ).and.returnValue(Result.none());
        loadMapItemsWms = spyOn(
          WebMapServiceCatalogItem.prototype,
          "loadMapItems"
        ).and.returnValue(Result.none());
      });

      it("when a workbench item is a simple map server group", async function () {
        await terria.applyInitData({
          initData: {
            catalog: [mapServerGroupModel],
            workbench: ["a-test-server-group"]
          }
        });
        expect(terria.workbench.itemIds).toEqual(["a-test-server-group/0"]);
        expect(loadMapItemsArcGisMap).toHaveBeenCalledTimes(1);
      });

      it("when a workbench item is a referenced map server group", async function () {
        await terria.applyInitData({
          initData: {
            catalog: [magdaRecordDerefencedToFeatureServerGroup],
            workbench: ["a-test-magda-record"]
          }
        });
        expect(terria.workbench.itemIds).toEqual(["a-test-magda-record/0"]);
        expect(loadMapItemsArcGisFeature).toHaveBeenCalledTimes(1);
      });

      it("when a workbench item is a referenced wms", async function () {
        await terria.applyInitData({
          initData: {
            catalog: [magdaRecordDerefencedToWms],
            workbench: ["another-test-magda-record"]
          }
        });
        expect(terria.workbench.itemIds).toEqual(["another-test-magda-record"]);
        expect(loadMapItemsWms).toHaveBeenCalledTimes(1);
      });

      it("when the workbench has more than one items", async function () {
        await terria.applyInitData({
          initData: {
            catalog: [
              mapServerGroupModel,
              magdaRecordDerefencedToFeatureServerGroup,
              magdaRecordDerefencedToWms
            ],
            workbench: [
              "a-test-server-group",
              "a-test-magda-record",
              "another-test-magda-record"
            ]
          }
        });

        expect(terria.workbench.itemIds).toEqual(theOrderedItemsIds);
        expect(loadMapItemsWms).toHaveBeenCalledTimes(1);
        expect(loadMapItemsArcGisMap).toHaveBeenCalledTimes(1);
        expect(loadMapItemsArcGisFeature).toHaveBeenCalledTimes(1);
      });

      it("when the workbench has an unknown item", async function () {
        await terria.applyInitData({
          initData: {
            catalog: [
              mapServerGroupModel,
              magdaRecordDerefencedToFeatureServerGroup,
              magdaRecordDerefencedToWms
            ],
            workbench: [
              "id_of_unknown_model",
              "a-test-server-group",
              "a-test-magda-record",
              "another-test-magda-record"
            ]
          }
        });

        expect(terria.workbench.itemIds).toEqual(theOrderedItemsIds);
        expect(loadMapItemsWms).toHaveBeenCalledTimes(1);
        expect(loadMapItemsArcGisMap).toHaveBeenCalledTimes(1);
        expect(loadMapItemsArcGisFeature).toHaveBeenCalledTimes(1);
      });

      it("when a workbench item has errors", async function () {
        let error: TerriaError | undefined = undefined;
        try {
          await terria.applyInitData({
            initData: {
              catalog: [
                mapServerModelWithError,
                mapServerGroupModel,
                magdaRecordDerefencedToFeatureServerGroup,
                magdaRecordDerefencedToWms
              ],
              workbench: [
                "a-test-server-with-error",
                "a-test-server-group",
                "a-test-magda-record",
                "another-test-magda-record"
              ]
            }
          });
        } catch (e) {
          error = e as TerriaError;
          expect(error.message === "models.terria.loadingInitSourceErrorTitle");
        } finally {
          expect(error).not.toEqual(undefined);
          expect(terria.workbench.itemIds).toEqual(theOrderedItemsIds);
          expect(loadMapItemsWms).toHaveBeenCalledTimes(1);
          expect(loadMapItemsArcGisMap).toHaveBeenCalledTimes(1);
          expect(loadMapItemsArcGisFeature).toHaveBeenCalledTimes(1);
        }
      });
    });

    describe("Enable/disable shorten share URL via init data", function () {
      beforeEach(function () {
        window.localStorage.clear();
      });

      it("should not change local property shortenShareUrls", async function () {
        await terria.applyInitData({
          initData: {}
        });
        expect(terria.getLocalProperty("shortenShareUrls")).toBe(null);

        terria.setLocalProperty("shortenShareUrls", true);
        await terria.applyInitData({
          initData: {}
        });
        expect(terria.getLocalProperty("shortenShareUrls")).toBeTruthy();

        terria.setLocalProperty("shortenShareUrls", false);
        await terria.applyInitData({
          initData: {}
        });
        expect(terria.getLocalProperty("shortenShareUrls")).toBeFalsy();
      });

      it("should set local property shortenShareUrls to true", async function () {
        await terria.applyInitData({
          initData: {
            settings: {
              shortenShareUrls: true
            }
          }
        });
        expect(terria.getLocalProperty("shortenShareUrls")).toBeTruthy();
      });

      it("should set local property shortenShareUrls to false", async function () {
        await terria.applyInitData({
          initData: {
            settings: {
              shortenShareUrls: false
            }
          }
        });
        expect(terria.getLocalProperty("shortenShareUrls")).toBeFalsy();

        terria.setLocalProperty("shortenShareUrls", true);
        await terria.applyInitData({
          initData: {
            settings: {
              shortenShareUrls: false
            }
          }
        });
        expect(terria.getLocalProperty("shortenShareUrls")).toBeFalsy();
      });
    });
  });

  describe("mapSettings", function () {
    it("properly interprets map hash parameter", async () => {
      const getLocalPropertySpy = spyOn(terria, "getLocalProperty");
      const location = {
        href: "http://test.com/#map=2d"
      } as Location;
      await terria.start({
        configUrl: "",
        applicationUrl: location
      });
      await terria.loadPersistedMapSettings();
      expect(terria.mainViewer.viewerMode).toBe(ViewerMode.Leaflet);
      expect(getLocalPropertySpy).not.toHaveBeenCalledWith("viewermode");
    });

    it("properly resolves persisted map viewer", async () => {
      const getLocalPropertySpy = spyOn(
        terria,
        "getLocalProperty"
      ).and.returnValue("2d");
      await terria.start({ configUrl: "" });
      await terria.loadPersistedMapSettings();
      expect(terria.mainViewer.viewerMode).toBe(ViewerMode.Leaflet);
      expect(getLocalPropertySpy).toHaveBeenCalledWith("viewermode");
    });

    it("properly interprets wrong map hash parameter and resolves persisted value", async () => {
      const getLocalPropertySpy = spyOn(
        terria,
        "getLocalProperty"
      ).and.returnValue("3dsmooth");
      const location = {
        href: "http://test.com/#map=4d"
      } as Location;
      await terria.start({
        configUrl: "",
        applicationUrl: location
      });
      await terria.loadPersistedMapSettings();
      expect(terria.mainViewer.viewerMode).toBe(ViewerMode.Cesium);
      expect(terria.mainViewer.viewerOptions.useTerrain).toBe(false);
      expect(getLocalPropertySpy).toHaveBeenCalledWith("viewermode");
    });

    it("uses `settings` in initsource", async () => {
      const setBaseMapSpy = spyOn(terria.mainViewer, "setBaseMap");

      await terria.start({ configUrl: "" });

      terria.applyInitData({
        initData: {
          settings: {
            baseMaximumScreenSpaceError: 1,
            useNativeResolution: true,
            alwaysShowTimeline: true,
            baseMapId: "basemap-natural-earth-II",
            terrainSplitDirection: -1,
            depthTestAgainstTerrainEnabled: true
          }
        }
      });

      await terria.loadInitSources();

      expect(terria.baseMaximumScreenSpaceError).toBe(1);
      expect(terria.useNativeResolution).toBeTruthy();
      expect(terria.timelineStack.alwaysShowingTimeline).toBeTruthy();
      expect(setBaseMapSpy).toHaveBeenCalledWith(
        terria.baseMapsModel.baseMapItems.find(
          (item) => item.item.uniqueId === "basemap-natural-earth-II"
        )?.item
      );

      expect(terria.terrainSplitDirection).toBe(SplitDirection.LEFT);
      expect(terria.depthTestAgainstTerrainEnabled).toBeTruthy();
    });
  });

  describe("basemaps", function () {
    it("when no base maps are specified load defaultBaseMaps", async function () {
      await terria.start({ configUrl: "" });
      terria.applyInitData({
        initData: {}
      });
      await terria.loadInitSources();
      const _defaultBaseMaps = defaultBaseMaps(terria);
      expect(terria.baseMapsModel).toBeDefined();
      expect(terria.baseMapsModel.baseMapItems.length).toBe(
        _defaultBaseMaps.length
      );
    });

    it("correctly loads the base maps", async function () {
      await terria.start({ configUrl: "" });
      terria.applyInitData({
        initData: {
          baseMaps: {
            items: [
              {
                item: {
                  id: "basemap-natural-earth-II",
                  name: "Natural Earth II",
                  type: "url-template-imagery",
                  url: "https://storage.googleapis.com/terria-datasets-public/basemaps/natural-earth-tiles/{z}/{x}/{reverseY}.png",
                  attribution:
                    "<a href='https://www.naturalearthdata.com/downloads/10m-raster-data/10m-natural-earth-2/'>Natural Earth II</a> - From Natural Earth. <a href='https://www.naturalearthdata.com/about/terms-of-use/'>Public Domain</a>.",
                  maximumLevel: 7,
                  opacity: 1.0
                },
                image: "build/TerriaJS/images/natural-earth.png",
                contrastColor: "#000000"
              },
              {
                item: {
                  id: "basemap-darkmatter1",
                  name: "Dark Matter",
                  type: "open-street-map",
                  url: "https://basemaps.cartocdn.com/dark_all/",
                  attribution:
                    "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>, © <a href='https://carto.com/about-carto/'>CARTO</a>",
                  subdomains: ["a", "b", "c", "d"],
                  opacity: 1.0
                }
              }
            ]
          }
        }
      });
      const _defaultBaseMaps = defaultBaseMaps(terria);
      expect(terria.baseMapsModel).toBeDefined();
      expect(terria.baseMapsModel.baseMapItems.length).toEqual(
        _defaultBaseMaps.length + 1
      );
    });
  });

  describe("loadPickedFeatures", function () {
    let container: HTMLElement;
    beforeEach(async function () {
      // Attach cesium viewer and wait for it to be loaded
      container = document.createElement("div");
      document.body.appendChild(container);
      terria.mainViewer.attach(container);
      return terria.mainViewer.viewerLoadPromise;
    });

    afterEach(() => {
      terria.mainViewer.destroy();
      document.body.removeChild(container);
    });

    it("sets the pickCoords", async function () {
      const Cesium = (await import("../../lib/Models/Cesium")).default;
      expect(terria.currentViewer instanceof Cesium).toBeTruthy();
      await terria.loadPickedFeatures({
        pickCoords: {
          lat: 84.93,
          lng: 77.91,
          height: -5400810.41
        },
        providerCoords: {
          "https://foo": { x: 123, y: 456, level: 7 },
          "https://bar": { x: 42, y: 42, level: 4 }
        }
      });
      const pickPosition = terria.pickedFeatures?.pickPosition;
      expect(pickPosition).toBeDefined();
      if (pickPosition) {
        const { x, y, z } = pickPosition;
        expect(x.toFixed(2)).toBe("18483.85");
        expect(y.toFixed(2)).toBe("86292.94");
        expect(z.toFixed(2)).toBe("952035.13");
      }
    });

    it("sets the selectedFeature", async function () {
      const testItem = new SimpleCatalogItem("test", terria);
      const ds = new CustomDataSource("ds");
      const entity = new Entity({ name: "foo" });
      ds.entities.add(entity);
      testItem.mapItems = [ds];
      await terria.workbench.add(testItem);
      const entityHash = hashEntity(entity, terria);
      await terria.loadPickedFeatures({
        pickCoords: {
          lat: 84.93,
          lng: 77.91,
          height: -5400810.41
        },
        providerCoords: {
          "https://foo": { x: 123, y: 456, level: 7 },
          "https://bar": { x: 42, y: 42, level: 4 }
        },
        entities: [
          {
            hash: entityHash,
            name: "foo"
          }
        ],
        current: {
          hash: entityHash,
          name: "foo"
        }
      });
      expect(terria.selectedFeature).toBeDefined();
      expect(terria.selectedFeature?.name).toBe("foo");
    });
  });

  it("customRequestSchedulerLimits sets RequestScheduler limits for domains", async function () {
    const configUrl = `data:application/json;base64,${btoa(
      JSON.stringify({
        initializationUrls: [],
        parameters: {
          customRequestSchedulerLimits: {
            "test.domain:333": 12
          }
        }
      })
    )}`;
    await terria.start({ configUrl, i18nOptions });
    expect(RequestScheduler.requestsByServer["test.domain:333"]).toBe(12);
  });

  describe("initial zoom", function () {
    describe("behaviour of `initialCamera.focusWorkbenchItems`", function () {
      let container: HTMLElement;

      beforeEach(function () {
        jasmine.Ajax.install();

        // Attach cesium viewer and wait for it to be loaded
        container = document.createElement("div");
        document.body.appendChild(container);
        terria.mainViewer.viewerOptions.useTerrain = false;
        terria.mainViewer.attach(container);

        const configJson = JSON.stringify({
          initializationUrls: ["focus-workbench-items.json"]
        });

        // An init source with a pre-loaded workbench item
        const initJson = JSON.stringify({
          initialCamera: { focusWorkbenchItems: true },
          catalog: [
            {
              id: "points",
              type: "geojson",
              name: "Points",
              geoJsonData: {
                type: "Feature",
                bbox: [-10.0, -10.0, 10.0, 10.0],
                properties: {
                  foo: "hi",
                  bar: "bye"
                },
                geometry: {
                  type: "Polygon",
                  coordinates: [
                    [
                      [100.0, 0.0],
                      [101.0, 0.0],
                      [101.0, 1.0],
                      [100.0, 1.0],
                      [100.0, 0.0]
                    ],
                    [
                      [100.2, 0.2],
                      [100.8, 0.2],
                      [100.8, 0.8],
                      [100.2, 0.8],
                      [100.2, 0.2]
                    ]
                  ]
                }
              }
            }
          ],
          workbench: ["points"]
        });
        jasmine.Ajax.stubRequest("serverconfig/").andReturn({
          responseText: "{}"
        });
        jasmine.Ajax.stubRequest("test-config.json").andReturn({
          responseText: configJson
        });
        jasmine.Ajax.stubRequest("focus-workbench-items.json").andReturn({
          responseText: initJson
        });
      });

      afterEach(() => {
        terria.mainViewer.destroy();
        document.body.removeChild(container);
        jasmine.Ajax.uninstall();
      });

      it("zooms the map to focus on the workbench items", async function () {
        await terria.start({ configUrl: "test-config.json" });
        await terria.loadInitSources();
        await when(() => terria.currentViewer.type === "Cesium");

        const cameraPos = terria.cesium?.scene.camera.positionCartographic;
        expect(cameraPos).toBeDefined();
        const { longitude, latitude, height } = cameraPos!;
        expect(CesiumMath.toDegrees(longitude)).toBeCloseTo(100.5);
        expect(CesiumMath.toDegrees(latitude)).toBeCloseTo(0.5);
        expect(height).toBeCloseTo(191276.7939);
      });

      it("works correctly even when there is a delay in a Cesium/Leaflet viewer becoming available", async function () {
        // Start with NoViewer
        runInAction(() => {
          terria.mainViewer.viewerMode = undefined;
        });
        await terria.start({ configUrl: "test-config.json" });
        await terria.loadInitSources();
        expect(terria.currentViewer.type).toEqual("none");
        // Switch to Cesium viewer
        runInAction(() => {
          terria.mainViewer.viewerMode = ViewerMode.Cesium;
        });
        // Wait for the switch to happen
        await when(() => terria.mainViewer.currentViewer.type === "Cesium");
        // Ensure that the camera position is correctly updated after the switch
        const cameraPos = terria.cesium?.scene.camera.positionCartographic;
        const { longitude, latitude, height } = cameraPos!;
        expect(CesiumMath.toDegrees(longitude)).toBeCloseTo(100.5);
        expect(CesiumMath.toDegrees(latitude)).toBeCloseTo(0.5);
        expect(height).toBeCloseTo(191276.7939);
      });

      it("is not applied if subsequent init sources override the initialCamera settings", async function () {
        await terria.start({ configUrl: "test-config.json" });
        terria.initSources.push({
          data: {
            initialCamera: {
              west: 42,
              east: 44,
              north: 44,
              south: 42,
              zoomDuration: 0
            }
          }
        });

        // Terria uses a 2 second flight duration when zooming to CameraView.
        // Here we re-define zoomTo() to ignore duration and zoom to the target
        // immediately so that we can observe the effects without delay.
        const originalZoomTo = terria.currentViewer.zoomTo.bind(
          terria.currentViewer
        );
        terria.currentViewer.zoomTo = (target, _duration) =>
          originalZoomTo(target, 0.0);

        await terria.loadInitSources();
        await when(() => terria.currentViewer.type === "Cesium");

        const cameraPos = terria.cesium?.scene.camera.positionCartographic;
        expect(cameraPos).toBeDefined();
        const { longitude, latitude, height } = cameraPos!;
        expect(CesiumMath.toDegrees(longitude)).toBeCloseTo(43);
        expect(CesiumMath.toDegrees(latitude)).toBeCloseTo(43);
        expect(height).toBeCloseTo(384989.3092);
      });

      it("is not applied when share URL specifies a different initialCamera setting", async function () {
        // Terria uses a 2 second flight duration when zooming to CameraView.
        // Here we re-define zoomTo() to ignore duration and zoom to the target
        // immediately so that we can observe the effects without delay.
        await when(() => terria.currentViewer.type === "Cesium");
        const originalZoomTo = terria.currentViewer.zoomTo.bind(
          terria.currentViewer
        );
        terria.currentViewer.zoomTo = (target, _duration) =>
          originalZoomTo(target, 0.0);

        await terria.start({
          configUrl: "test-config.json",
          applicationUrl: {
            // A share URL with a different `initialCamera` setting
            href: "http://localhost:3001/#start=%7B%22version%22%3A%228.0.0%22%2C%22initSources%22%3A%5B%7B%22stratum%22%3A%22user%22%2C%22initialCamera%22%3A%7B%22east%22%3A80.48324442836365%2C%22west%22%3A74.16912021554141%2C%22north%22%3A10.82936711956377%2C%22south%22%3A7.882086009700934%7D%2C%22workbench%22%3A%5B%22points%22%5D%7D%5D%7D"
          } as Location
        });

        await terria.loadInitSources();
        await when(() => terria.currentViewer.type === "Cesium");

        const cameraPos = terria.cesium?.scene.camera.positionCartographic;
        expect(cameraPos).toBeDefined();
        const { longitude, latitude, height } = cameraPos!;
        expect(CesiumMath.toDegrees(longitude)).toBeCloseTo(77.3261);
        expect(CesiumMath.toDegrees(latitude)).toBeCloseTo(9.3557);
        expect(height).toBeCloseTo(591140.7251);
      });
    });
  });
});
