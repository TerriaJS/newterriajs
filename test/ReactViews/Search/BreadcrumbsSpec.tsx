import { create } from "react-test-renderer";
import { act } from "react-dom/test-utils";
import Terria from "../../../lib/Models/Terria";
import CatalogGroup from "../../../lib/Models/Catalog/CatalogGroup";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import Breadcrumbs from "../../../lib/ReactViews/Search/Breadcrumbs";
import DataCatalogTab from "../../../lib/ReactViews/ExplorerWindow/Tabs/DataCatalogTab";
import Icon from "../../../lib/Styled/Icon";
import { ThemeProvider } from "styled-components";
import { terriaTheme } from "../../../lib/ReactViews/StandardUserInterface";
import { runInAction } from "mobx";

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
        testRenderer = create(
          <ThemeProvider theme={terriaTheme}>
            <DataCatalogTab terria={terria} viewState={viewState} />
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
        testRenderer = create(
          <ThemeProvider theme={terriaTheme}>
            <DataCatalogTab terria={terria} viewState={viewState} />
          </ThemeProvider>
        );
      });

      expect(() => {
        testRenderer.root.findByType(Breadcrumbs);
      }).toThrow();
    });
  });
});
