import { runInAction } from "mobx";
import { findAllWithType } from "react-shallow-testutils";
import CatalogMemberMixin from "../../../lib/ModelMixins/CatalogMemberMixin";
import WebMapServiceCatalogItem from "../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import WebProcessingServiceCatalogFunction from "../../../lib/Models/Catalog/Ows/WebProcessingServiceCatalogFunction";
import CommonStrata from "../../../lib/Models/Definition/CommonStrata";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import CatalogItemComponent, {
  ButtonState
} from "../../../lib/ReactViews/DataCatalog/CatalogItem";
import DataCatalogItem from "../../../lib/ReactViews/DataCatalog/DataCatalogItem";
import { getShallowRenderedOutput } from "../MoreShallowTools";

describe("DataCatalogItem", () => {
  let terria: Terria;
  let viewState: ViewState;
  let item: CatalogMemberMixin.Instance;
  let wmsItem: WebMapServiceCatalogItem;
  let removable: boolean;

  beforeEach(() => {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: undefined
    });
    wmsItem = new WebMapServiceCatalogItem("test", terria);

    runInAction(() => {
      viewState.explorerPanelIsVisible = true;
      viewState.mobileView = viewState.mobileViewOptions.data;

      wmsItem.setTrait("definition", "url", "test/WMS/single_metadata_url.xml");
    });

    // Use wmsItem for most tests, except for a couple that need to use a WPS item
    item = wmsItem;

    removable = false;

    spyOn(viewState, "viewCatalogMember").and.callThrough();
    spyOn(viewState, "switchMobileView");
  });

  describe("text click", () => {
    beforeEach(() => {
      getRenderedProp("onTextClick")();
    });

    assertPreviewed();
    assertNotAdded();
  });

  describe("button click", () => {
    describe("when not on mobile and with a non-invokeable layer and not user supplied", () => {
      beforeEach(() => {
        clickAddButton({});
      });
      assertAdded();
    });

    describe("when on mobile and not user supplied", () => {
      beforeEach(() => {
        runInAction(() => {
          viewState.useSmallScreenInterface = true;
        });
        clickAddButton({});
      });

      assertPreviewed();
      assertNotAdded();
    });

    describe("when with an invokeable layer", () => {
      beforeEach(() => {
        item = new WebProcessingServiceCatalogFunction("test-wps", terria);
        clickAddButton({});
      });

      assertPreviewed();
      assertNotAdded();
    });

    describe("close modal after added data when not user supplied", () => {
      beforeEach(() => {
        clickAddButton({});
      });
      afterEach(() => {
        expect(viewState.explorerPanelIsVisible).toBe(true);
        expect(viewState.mobileView).not.toBeNull();
      });
    });

    describe("does not close modal", () => {
      it("when control key pressed", () => {
        clickAddButton({ ctrlKey: true });
      });

      it("when shift key pressed", () => {
        clickAddButton({ shiftKey: true });
      });

      afterEach(() => {
        expect(viewState.explorerPanelIsVisible).toBe(true);
        expect(viewState.mobileView).not.toBeNull();
      });
    });

    function clickAddButton(event: any) {
      getRenderedProp("onBtnClick")(event);
    }
  });

  describe("renders", () => {
    it("a single <CatalogItem />", () => {
      expect(
        findAllWithType(renderShallow(), CatalogItemComponent).length
      ).toBe(1);
    });

    describe("btnState prop as", () => {
      it('"loading" if item is loading', () => {
        runInAction(() => {
          (wmsItem as any)._metadataLoader._isLoading = true;
        });
        viewState.useSmallScreenInterface = true;
        expect(getRenderedProp("btnState")).toBe(ButtonState.Loading);
      });

      it('"preview" if on mobile and not loading', () => {
        viewState.useSmallScreenInterface = true;
        expect(getRenderedProp("btnState")).toBe(ButtonState.Preview);
      });

      it('"remove" if item is enabled and not loading and not on mobile', async () => {
        // user supplied data does not have add/remove button, regardless
        // if they have trash button
        await terria.workbench.add(wmsItem);
        expect(getRenderedProp("btnState")).toBe(ButtonState.Remove);
      });

      it('"add" if item removable but NOT enabled', () => {
        // If removable, btnstate should still be add or remove
        removable = true;
        expect(getRenderedProp("btnState")).toBe(ButtonState.Add);
        expect(getRenderedProp("trashable")).toBe(true);
      });

      it('"remove" if item removable but enabled', async () => {
        // If removable, btnstate should still be add or remove
        await terria.workbench.add(wmsItem);
        removable = true;
        expect(getRenderedProp("btnState")).toBe(ButtonState.Remove);
        expect(getRenderedProp("trashable")).toBe(true);
      });

      it('"add" if item is not invokeable, not enabled and not loading and not on mobile', () => {
        expect(getRenderedProp("btnState")).toBe(ButtonState.Add);
      });

      it('"stats" if item is invokeable, not user-supplied, not enabled and not loading and not on mobile', () => {
        item = new WebProcessingServiceCatalogFunction("test-wps", terria);
        expect(getRenderedProp("btnState")).toBe(ButtonState.Stats);
      });
    });

    describe("isSelected prop as", () => {
      describe("true when", () => {
        it("item is the currently previewed data item", async () => {
          await viewState.viewCatalogMember(wmsItem);
          expect(getRenderedProp("selected")).toBe(true);
        });
      });

      describe("false when", () => {
        it("item is NOT the current previewed item", () => {
          expect(getRenderedProp("selected")).toBe(false);
        });
      });
    });

    it("sets the CatalogItem text as the item name", () => {
      wmsItem.setTrait(CommonStrata.definition, "name", "TEST!!!");
      expect(getRenderedProp("text")).toBe("TEST!!!");
    });
  });

  function assertPreviewed() {
    it("sets preview item", () => {
      expect(viewState.viewCatalogMember).toHaveBeenCalledWith(item);
    });

    it("switches mobile view to preview", () => {
      expect(viewState.switchMobileView).toHaveBeenCalledWith(
        viewState.mobileViewOptions.preview
      );
    });
  }

  function assertAdded() {
    it("adds item to workbench", () => {
      expect(terria.workbench.contains(item)).toBe(true);
    });
  }

  function assertNotAdded() {
    it("doesn't add item to workbench", () => {
      expect(terria.workbench.contains(item)).toBe(false);
    });
  }

  function getRenderedProp(propName: string) {
    return findAllWithType(renderShallow(), CatalogItemComponent)[0].props[
      propName
    ];
  }

  function renderShallow() {
    return getShallowRenderedOutput(
      <DataCatalogItem
        viewState={viewState}
        item={item}
        removable={removable}
        terria={terria}
      />
    );
  }
});
