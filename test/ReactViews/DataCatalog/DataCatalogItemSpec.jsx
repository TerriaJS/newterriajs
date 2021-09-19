import { findAllWithType } from "react-shallow-testutils";
import { USER_ADDED_CATEGORY_ID } from "../../../lib/Core/addedByUser";
import CatalogGroup from "../../../lib/Models/CatalogGroup";
import CatalogItem from "../../../lib/Models/CatalogItem";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import CatalogItemComponent from "../../../lib/ReactViews/DataCatalog/CatalogItem";
import { DataCatalogItem } from "../../../lib/ReactViews/DataCatalog/DataCatalogItem";
import { getShallowRenderedOutput } from "../MoreShallowTools";

function makeItemUserAdded(item, terria) {
  item.parent = new CatalogGroup(terria);
  item.parent.name = USER_ADDED_CATEGORY_ID;
}

describe("DataCatalogItem", () => {
  let terria, viewState, item, removable;

  beforeEach(() => {
    terria = new Terria({ baseUrl: "./" });

    viewState = new ViewState({ terria });
    viewState.explorerPanelIsVisible = true;
    viewState.mobileView = viewState.mobileViewOptions.data;

    item = new CatalogItem(terria);
    item.isEnabled = false;

    removable = false;

    spyOn(viewState, "viewCatalogMember");
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
        item.isUserSupplied = false;
        clickAddButton({});
      });
      assertPreviewed();
      assertAdded();
    });

    describe("when on mobile and not user supplied", () => {
      beforeEach(() => {
        viewState.useSmallScreenInterface = true;
        item.isUserSupplied = false;
        clickAddButton({});
      });

      assertPreviewed();
      assertNotAdded();
    });

    describe("when user supplied but added within a group", () => {
      beforeEach(() => {
        item.isUserSupplied = true;
        item.parent = new CatalogItem(terria);
        item.invoke = () => {};
        clickAddButton({});
      });

      assertPreviewed();
      assertNotAdded();
    });

    describe("when with an invokeable layer", () => {
      beforeEach(() => {
        item.isUserSupplied = false;
        item.invoke = () => {};
        clickAddButton({});
      });

      assertPreviewed();
      assertNotAdded();
    });

    describe("close modal after added data when not user supplied", () => {
      beforeEach(() => {
        item.isUserSupplied = false;
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

    function clickAddButton(event) {
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
        item.isEnabled = true;
        item.isLoading = true;
        item.isUserSupplied = false;
        viewState.useSmallScreenInterface = true;
        expect(getRenderedProp("btnState")).toBe("loading");
      });

      it('"preview" if on mobile and not loading', () => {
        item.isEnabled = true;
        item.isLoading = false;
        viewState.useSmallScreenInterface = true;
        expect(getRenderedProp("btnState")).toBe("preview");
      });

      it('"remove" if item is enabled and not loading and not on mobile', () => {
        item.isEnabled = true;
        item.isLoading = false;
        // user supplied data does not have add/remove button, regardless
        // if they have trash button
        item.isUserSupplied = false;
        expect(getRenderedProp("btnState")).toBe("remove");
      });

      it('"add" if item removable but NOT enabled', () => {
        // If removable, btnstate should still be add or remove
        item.isLoading = false;
        removable = true;
        item.parent = new CatalogItem(terria);
        makeItemUserAdded(item.parent, terria);
        expect(getRenderedProp("btnState")).toBe("add");
        expect(getRenderedProp("trashable")).toBe(true);
      });
      it('"remove" if item removable but enabled', () => {
        // If removable, btnstate should still be add or remove
        item.isEnabled = true;
        item.isLoading = false;
        removable = true;
        item.parent = new CatalogItem(terria);
        makeItemUserAdded(item.parent, terria);
        expect(getRenderedProp("btnState")).toBe("remove");
        expect(getRenderedProp("trashable")).toBe(true);
      });

      it("add if item is added by user but within a group and not loading and not on mobile", () => {
        item.isLoading = false;
        // User data is always "removable"
        removable = true;
        item.parent = new CatalogItem(terria);
        makeItemUserAdded(item.parent, terria);
        expect(getRenderedProp("btnState")).toBe("add");
      });

      it('"add" if item is not invokeable, not enabled and not loading and not on mobile', () => {
        expect(getRenderedProp("btnState")).toBe("add");
      });

      it('"stats" if item is invokeable, not user-supplied, not enabled and not loading and not on mobile', () => {
        item.invoke = () => {};
        expect(getRenderedProp("btnState")).toBe("stats");
      });
    });

    describe("isSelected prop as", () => {
      describe("true when", () => {
        it("item is added by user and the current user data previewed item", () => {
          makeItemUserAdded(item, terria);
          viewState.userDataPreviewedItem = item;
        });

        it("item is NOT added by user and IS the currently previewed data item", async () => {
          await viewState.viewCatalogMember(item);
        });

        afterEach(() => {
          expect(getRenderedProp("selected")).toBe(true);
        });
      });

      describe("false when", () => {
        it("item is NOT added by user and NOT the current previewed item", () => {
          // Assertion is done in afterEach so ¯\_(ツ)_/¯
        });

        it("item is added by user and NOT the current user data previewed item", () => {
          makeItemUserAdded(item, terria);
        });

        afterEach(() => {
          expect(getRenderedProp("selected")).toBe(false);
        });
      });
    });

    it("sets the CatalogItem text as the item name", () => {
      item.name = "TEST!!!";
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
    it("enables item", () => {
      expect(item.isEnabled).toBe(true);
    });
  }

  function assertNotAdded() {
    it("doesn't enable item", () => {
      expect(item.isEnabled).toBe(false);
    });
  }

  function getRenderedProp(propName) {
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
        t={() => {}}
      />
    );
  }
});
