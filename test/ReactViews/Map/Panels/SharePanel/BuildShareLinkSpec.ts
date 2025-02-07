import { action, runInAction } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import queryToObject from "terriajs-cesium/Source/Core/queryToObject";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import SplitDirection from "terriajs-cesium/Source/Scene/SplitDirection";
import URI from "urijs";
import { USER_ADDED_CATEGORY_ID } from "../../../../../lib/Core/addedByUser";
import loadBlob from "../../../../../lib/Core/loadBlob";
import PickedFeatures from "../../../../../lib/Map/PickedFeatures/PickedFeatures";
import addUserCatalogMember from "../../../../../lib/Models/Catalog/addUserCatalogMember";
import GeoJsonCatalogItem from "../../../../../lib/Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import WebMapServiceCatalogItem from "../../../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import CommonStrata from "../../../../../lib/Models/Definition/CommonStrata";
import { BaseModel } from "../../../../../lib/Models/Definition/Model";
import TerriaFeature from "../../../../../lib/Models/Feature/Feature";
import { InitSourceData } from "../../../../../lib/Models/InitSource";
import Terria from "../../../../../lib/Models/Terria";
import { setViewerMode } from "../../../../../lib/Models/ViewerMode";
import ViewState from "../../../../../lib/ReactViewModels/ViewState";
import {
  buildShareLink,
  isShareable,
  SHARE_VERSION
} from "../../../../../lib/ReactViews/Map/Panels/SharePanel/BuildShareLink";

const decodeAndParseStartHash = (url: string) => {
  const parsed = URI.parse(url);
  if (parsed.fragment) {
    return JSON.parse(queryToObject(parsed.fragment)["start"]);
  }
};

const flattenInitSources = (initSources: InitSourceData[]): InitSourceData =>
  initSources.reduce(
    (acc: InitSourceData, initSource: InitSourceData) =>
      Object.assign(acc, initSource),
    {}
  );

describe("BuildShareLink", function () {
  let terria: Terria;
  let viewState: ViewState;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: undefined
    });
  });

  it("should generate a url with default catalog related flags missing/undefined", function () {
    const shareLink = buildShareLink(terria, viewState);
    const params = decodeAndParseStartHash(shareLink);
    const initSources = flattenInitSources(params.initSources);

    expect(params.version).toBe(SHARE_VERSION);
    expect(initSources.previewedItemId).toBeUndefined();
  });

  describe("user added model containing local data", function () {
    it("should not be serialized", function (done) {
      const modelId = "Test";
      const model = new GeoJsonCatalogItem(modelId, terria);

      loadBlob("test/GeoJSON/bike_racks.geojson", {})
        .then((blob) => {
          model.setFileInput(blob as File);
          terria.addModel(model);

          expect(terria.getModelById(BaseModel, modelId)).toBe(model);
          expect(isShareable(terria)(modelId)).toBe(false);
          return addUserCatalogMember(terria, model);
        })
        .then(() => {
          const shareLink = buildShareLink(terria, viewState);
          const params = decodeAndParseStartHash(shareLink);
          const initSources = flattenInitSources(params.initSources);

          expect(
            initSources.models?.[USER_ADDED_CATEGORY_ID].members
          ).not.toContain(model.uniqueId);

          done();
        });
    });

    it("should not be added to workbench in generated url", function (done) {
      const modelId = "Test";
      const model = new GeoJsonCatalogItem(modelId, terria);

      loadBlob("test/GeoJSON/bike_racks.geojson", {})
        .then((blob) => {
          model.setFileInput(blob as File);
          terria.addModel(model);
          return addUserCatalogMember(terria, model);
        })
        .then(() => {
          return terria.workbench.add(model);
        })
        .then(() => {
          const shareLink = buildShareLink(terria, viewState);
          const params = decodeAndParseStartHash(shareLink);
          const initSources = flattenInitSources(params.initSources);

          expect(initSources.workbench).not.toContain(model.uniqueId);

          done();
        });
    });
  });

  describe("user added model containing no local data", function () {
    let model: BaseModel;

    beforeEach(function () {
      model = new WebMapServiceCatalogItem("Test", terria);
      runInAction(() => {
        model.setTrait(
          CommonStrata.definition,
          "url",
          "test/WMS/single_metadata_url.xml"
        );
      });
      terria.addModel(model);
    });

    it("should be serialized", function (done) {
      addUserCatalogMember(terria, model).then(() => {
        const shareLink = buildShareLink(terria, viewState);
        const params = decodeAndParseStartHash(shareLink);
        const initSources = flattenInitSources(params.initSources);

        expect(model.uniqueId).toBeDefined();
        expect(isShareable(terria)(model.uniqueId ?? "")).toBe(true);
        expect(initSources.models?.[USER_ADDED_CATEGORY_ID].members).toContain(
          model.uniqueId
        );

        done();
      });
    });

    it("should be added to workbench in generated url", function (done) {
      addUserCatalogMember(terria, model)
        .then(() => {
          return terria.workbench.add(model);
        })
        .then(() => {
          const shareLink = buildShareLink(terria, viewState);
          const params = decodeAndParseStartHash(shareLink);
          const initSources = flattenInitSources(params.initSources);

          expect(initSources.workbench).toContain(model.uniqueId);

          done();
        });
    });
  });

  describe("should generate a url that opens to the catalog", function () {
    beforeEach(function () {
      terria.catalog.userAddedDataGroup.addMembersFromJson(CommonStrata.user, [
        {
          id: "ABC",
          name: "abc",
          type: "wms",
          url: "test/WMS/single_metadata_url.xml"
        }
      ]);
    });

    // sharing active tab category not implemented in mobx yet
    // it("when the explorer window is open without a previewed catalog item", function() {
    //   viewState.openAddData();
    //   const shareLink = buildShareLink(terria, viewState);
    //   const params = decodeAndParseStartHash(shareLink);
    //   const initSources = flattenInitSources(params.initSources);

    //   expect(initSources.previewedItemId).toBe(undefined);
    //   // expect(initSources.sharedFromExplorerPanel).toBe(true);
    //   // expect(viewState.activeTabCategory).toBe(DATA_CATALOG_NAME);
    // });

    describe("opening to the user added tab", function () {
      // below case is impossible with the UI at the moment, but we might want to
      // share the 'empty-user-catalog-as-drag-and-drop' state in the future
      // it("without a previewed item", function() {
      //   viewState.openUserData();
      //   const shareLink = buildShareLink(terria, viewState);
      //   const params = decodeAndParseStartHash(shareLink);
      //   const initSources = flattenInitSources(params.initSources);

      //   expect(initSources.previewedItemId).toBe(undefined);
      //   // expect(initSources.sharedFromExplorerPanel).toBe(true);
      //   // expect(viewState.activeTabCategory).toBe(USER_DATA_NAME);
      // });

      it("viewing a previewed item", async function () {
        const model = terria.catalog.userAddedDataGroup.memberModels[0];

        // preview the user added item & the share link should reflect that
        await viewState.viewCatalogMember(model);
        const shareLink = buildShareLink(terria, viewState);
        let params = decodeAndParseStartHash(shareLink);
        let initSources = flattenInitSources(params.initSources);
        expect(initSources.previewedItemId).toBe(model.uniqueId);

        // close the catalog & the share link should reflect that
        viewState.closeCatalog();
        params = decodeAndParseStartHash(buildShareLink(terria, viewState));
        initSources = flattenInitSources(params.initSources);
        expect(initSources.previewedItemId).toBeUndefined();
      });
    });
  });

  describe("sharing picked features", function () {
    it(
      "captures the picked position",
      action(function () {
        terria.pickedFeatures = new PickedFeatures();
        terria.pickedFeatures.pickPosition = new Cartesian3(
          17832.12,
          83234.52,
          952313.73
        );
        terria.pickedFeatures.features.push(new TerriaFeature({}));
        const shareLink = buildShareLink(terria, viewState);
        const params = decodeAndParseStartHash(shareLink);
        const initSources = flattenInitSources(params.initSources);
        const pickCoords = initSources.pickedFeatures?.pickCoords;
        expect(pickCoords?.lat.toFixed(2)).toEqual("84.93");
        expect(pickCoords?.lng.toFixed(2)).toEqual("77.91");
        expect(pickCoords?.height.toFixed(2)).toEqual("-5400810.41");
      })
    );

    it(
      "captures the tile coordinates of the picked imagery providers",
      action(function () {
        terria.pickedFeatures = new PickedFeatures();
        terria.pickedFeatures.pickPosition = new Cartesian3(
          17832.12,
          83234.52,
          952313.73
        );
        terria.pickedFeatures.providerCoords = {
          "https://foo": { x: 123, y: 456, level: 7 },
          "https://bar": { x: 42, y: 42, level: 4 }
        };
        terria.pickedFeatures.features.push(new TerriaFeature({}));
        const shareLink = buildShareLink(terria, viewState);
        const params = decodeAndParseStartHash(shareLink);
        const initSources = flattenInitSources(params.initSources);
        const providerCoords = initSources.pickedFeatures?.providerCoords;
        expect(providerCoords).toEqual({
          "https://foo": { x: 123, y: 456, level: 7 },
          "https://bar": { x: 42, y: 42, level: 4 }
        });
      })
    );

    it(
      "captures the selected feature",
      action(function () {
        terria.pickedFeatures = new PickedFeatures();
        terria.pickedFeatures.pickPosition = new Cartesian3(
          17832.12,
          83234.52,
          952313.73
        );
        const feature = new Entity({ name: "testFeature" }) as TerriaFeature;
        terria.pickedFeatures.features.push(feature);
        terria.selectedFeature = feature;
        const shareLink = buildShareLink(terria, viewState);
        const params = decodeAndParseStartHash(shareLink);
        const initSources = flattenInitSources(params.initSources);
        const current = initSources.pickedFeatures?.current;
        expect(current?.name).toEqual("testFeature");
        expect(current?.hash).toBeDefined();
      })
    );

    it(
      "captures all picked vector features",
      action(function () {
        terria.pickedFeatures = new PickedFeatures();
        terria.pickedFeatures.pickPosition = new Cartesian3(
          17832.12,
          83234.52,
          952313.73
        );
        terria.pickedFeatures.features.push(
          new TerriaFeature({ name: "testFeature1" })
        );
        terria.pickedFeatures.features.push(
          new TerriaFeature({ name: "testFeature2" })
        );
        const shareLink = buildShareLink(terria, viewState);
        const params = decodeAndParseStartHash(shareLink);
        const initSources = flattenInitSources(params.initSources);
        const entities = initSources.pickedFeatures?.entities;
        expect(entities?.[0].name).toEqual("testFeature1");
        expect(entities?.[0].hash).toBeDefined();
        expect(entities?.[1].name).toEqual("testFeature2");
        expect(entities?.[1].hash).toBeDefined();
      })
    );
  });

  describe("map settings", function () {
    it("serialises correctly", async function () {
      const testBaseMap = new GeoJsonCatalogItem(
        "test-basemap",
        terria,
        undefined
      );
      testBaseMap.setTrait(
        CommonStrata.definition,
        "geoJsonString",
        `{"type":"FeatureCollection","features":[{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[145.5908203125,-40.17887331434695],[143.349609375,-42.08191667830631],[146.35986328124997,-44.040218713142124],[149.08447265625,-42.859859815062784],[148.55712890625,-41.36031866306708],[145.5908203125,-40.17887331434695]]]}},{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[75.9375,51.069016659603896],[59.94140624999999,39.095962936305476],[79.453125,42.032974332441405],[80.15625,46.800059446787316],[75.673828125,51.45400691005982],[75.9375,51.069016659603896]]]}}]}`
      );

      terria.setBaseMaximumScreenSpaceError(1);
      terria.setUseNativeResolution(true);
      setViewerMode("2d", terria.mainViewer);
      terria.timelineStack.setAlwaysShowTimeline(true);
      await terria.mainViewer.setBaseMap(testBaseMap);
      terria.terrainSplitDirection = SplitDirection.LEFT;
      terria.depthTestAgainstTerrainEnabled = true;

      const shareLink = buildShareLink(terria, viewState);
      const params = decodeAndParseStartHash(shareLink);
      const initSources = flattenInitSources(params.initSources);

      expect(initSources.viewerMode).toBe("2d");

      expect(initSources.settings).toEqual({
        baseMaximumScreenSpaceError: 1,
        useNativeResolution: true,
        alwaysShowTimeline: true,
        baseMapId: "test-basemap",
        terrainSplitDirection: -1,
        depthTestAgainstTerrainEnabled: true
      });
    });
  });
});
