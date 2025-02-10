import { runInAction } from "mobx";
import Terria from "../../lib/Models/Terria";
import ViewState, {
  DATA_CATALOG_NAME
} from "../../lib/ReactViewModels/ViewState";
import SimpleCatalogItem from "../Helpers/SimpleCatalogItem";
import TerriaReference from "../../lib/Models/Catalog/CatalogReferences/TerriaReference";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import CatalogIndexReference from "../../lib/Models/Catalog/CatalogReferences/CatalogIndexReference";
import { animationDuration } from "../../lib/ReactViews/StandardUserInterface/StandardUserInterface";

describe("ViewState", function () {
  let terria: Terria;
  let viewState: ViewState;

  beforeEach(function () {
    terria = new Terria();
    viewState = new ViewState({
      terria,
      catalogSearchProvider: undefined
    });
  });

  describe("viewCatalogMember", function () {
    it("handle nested references", async function () {
      // Test nested reference
      // CatalogIndexReference -> TerriaReference -> CatalogGroup
      terria = new Terria();

      const terriaReference = new TerriaReference("test", terria);
      terriaReference.setTrait(
        CommonStrata.user,
        "url",
        "test/init/wms-v8.json"
      );
      terriaReference.setTrait(CommonStrata.user, "isGroup", true);
      terria.addModel(terriaReference);

      const catalogIndexReference = new CatalogIndexReference("test", terria);

      await viewState.viewCatalogMember(catalogIndexReference);

      expect(viewState.previewedItem).toBeDefined();
      expect(viewState.previewedItem?.type).toBe("group");
    });
  });

  describe("removeModelReferences", function () {
    it("unsets the previewedItem if it matches the model", async function () {
      const item = new SimpleCatalogItem("testId", terria);
      await viewState.viewCatalogMember(item);
      viewState.removeModelReferences(item);
      expect(viewState.previewedItem).toBeUndefined();
    });

    it("unsets the userDataPreviewedItem if it matches the model", function () {
      const item = new SimpleCatalogItem("testId", terria);
      viewState.userDataPreviewedItem = item;
      viewState.removeModelReferences(item);
      expect(viewState.userDataPreviewedItem).toBeUndefined();
    });
  });

  describe("error provider", function () {
    it("creates an empty error provider by default", function () {
      expect(viewState.errorProvider).toBeNull();
    });
  });

  describe("tourPointsWithValidRefs", function () {
    it("returns tourPoints ordered by priority", function () {
      runInAction(() => {
        viewState.setTourIndex(0);
        viewState.setShowTour(true);
        (viewState as any).updateAppRef("TestRef", { current: true });
        (viewState as any).updateAppRef("TestRef2", { current: true });
        (viewState as any).updateAppRef("TestRef3", { current: true });
        viewState.tourPoints = [
          {
            appRefName: "TestRef2",
            priority: 20,
            content: "## Motivated by food\n\nNeko loves food"
          },
          {
            appRefName: "TestRef3",
            priority: 30,
            content: "## Lazy\n\nThey like to lounge around all day"
          },
          {
            appRefName: "TestRef",
            priority: 10,
            content: "## Best friends\n\nMochi and neko are best friends"
          }
        ];
      });
      expect(viewState.tourPointsWithValidRefs).toBeDefined();
      expect(viewState.tourPointsWithValidRefs[0].priority).toEqual(10);
      expect(viewState.tourPointsWithValidRefs[1].priority).toEqual(20);
      expect(viewState.tourPointsWithValidRefs[2].priority).toEqual(30);
      expect(viewState.tourPointsWithValidRefs[0].appRefName).toEqual(
        "TestRef"
      );
    });
  });
  describe("tour and trainer interaction", function () {
    beforeEach(function () {
      jasmine.clock().install();
    });
    afterEach(function () {
      jasmine.clock().uninstall();
    });
    it("disables trainer bar if turning on tour", function () {
      runInAction(() => {
        viewState.setTrainerBarExpanded(true);
        viewState.setTrainerBarShowingAllSteps(true);
      });
      expect(viewState.trainerBarExpanded).toEqual(true);
      expect(viewState.trainerBarShowingAllSteps).toEqual(true);
      expect(viewState.showTour).toEqual(false);

      runInAction(() => {
        viewState.setShowTour(true);
      });

      jasmine.clock().tick(animationDuration); // wait for workbench animation

      expect(viewState.trainerBarExpanded).toEqual(false);
      expect(viewState.trainerBarShowingAllSteps).toEqual(false);
      expect(viewState.showTour).toEqual(true);
    });
  });

  it("opens Add Data when openAddData is set to true in config file", function () {
    terria.configParameters.openAddData = true;
    viewState.afterTerriaStarted();
    expect(viewState.explorerPanelIsVisible).toEqual(true);
    expect(viewState.activeTabCategory).toEqual(DATA_CATALOG_NAME);
  });

  it("does not open Add Data when openAddData is set to false in config file", function () {
    terria.configParameters.openAddData = false;
    viewState.afterTerriaStarted();
    expect(viewState.explorerPanelIsVisible).toEqual(false);
  });
});
