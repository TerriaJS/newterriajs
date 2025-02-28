import { runInAction } from "mobx";
import React from "react";
import { act } from "react-dom/test-utils";
import { ThemeProvider } from "styled-components";
import CatalogGroup from "../../../lib/Models/Catalog/CatalogGroup";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import DataCatalogTab from "../../../lib/ReactViews/ExplorerWindow/Tabs/DataCatalogTab";
import Breadcrumbs from "../../../lib/ReactViews/Search/Breadcrumbs";
import { terriaTheme } from "../../../lib/ReactViews/StandardUserInterface";
import Icon from "../../../lib/Styled/Icon";
import { createWithContexts } from "../withContext";

describe("Breadcrumbs", function () {
  let terria: Terria;
  let viewState: ViewState;
  let catalogGroup: CatalogGroup;

  let testRenderer: any;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: undefined
    });
    catalogGroup = new CatalogGroup("group-of-geospatial-cats", terria);
    terria.addModel(catalogGroup);
  });

  describe("with a prevewied catalog item", function () {
    it("renders", async function () {
      await viewState.viewCatalogMember(catalogGroup);

      act(() => {
        testRenderer = createWithContexts(
          viewState,
          <ThemeProvider theme={terriaTheme}>
            <DataCatalogTab />
          </ThemeProvider>
        );
      });

      const breadcrumbs = testRenderer.root.findByType(Breadcrumbs);
      expect(breadcrumbs).toBeDefined();
      const icon = breadcrumbs.findByType(Icon);
      expect(icon.props.glyph.id).toBe("globe");
    });
  });

  describe("without a previewed catalog item", function () {
    it("does not render", function () {
      runInAction(() => {
        viewState.clearPreviewedItem();
      });
      // ensure it's truly undefined
      expect(viewState.previewedItem).toBeUndefined();
      expect(viewState.userDataPreviewedItem).toBeUndefined();

      act(() => {
        testRenderer = createWithContexts(
          viewState,
          <ThemeProvider theme={terriaTheme}>
            <DataCatalogTab />
          </ThemeProvider>
        );
      });

      expect(() => {
        testRenderer.root.findByType(Breadcrumbs);
      }).toThrow();
    });
  });
});
