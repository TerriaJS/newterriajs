import { runInAction } from "mobx";
import { act } from "react-dom/test-utils";
import { ThemeProvider } from "styled-components";
import CommonStrata from "../../../lib/Models/Definition/CommonStrata";
import CatalogSearchProvider from "../../../lib/Models/SearchProviders/CatalogSearchProvider";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import SearchBoxAndResults, {
  SearchInDataCatalog
} from "../../../lib/ReactViews/Search/SearchBoxAndResults";
import { terriaTheme } from "../../../lib/ReactViews/StandardUserInterface";
import { createWithContexts } from "../withContext";

describe("SearchBoxAndResults", function () {
  let terria: Terria;
  let viewState: ViewState;

  let testRenderer: any;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: new CatalogSearchProvider("catalog", terria)
    });
  });

  it("renders with an input(SearchBox), but no SearchInDataCatalog without showLocationSearchResults", function () {
    const searchText = "neko";
    runInAction(() => {
      viewState.searchState.locationSearchText = searchText;
      viewState.searchState.showLocationSearchResults = false;
      viewState.searchState.locationSearchResults = [];
    });
    act(() => {
      testRenderer = createWithContexts(
        viewState,
        <ThemeProvider theme={terriaTheme}>
          <SearchBoxAndResults placeholder="Search" />
        </ThemeProvider>
      );
    });

    const searchBox = testRenderer.root.findByType("input");
    expect(() => {
      testRenderer.root.findByType(SearchInDataCatalog);
    }).toThrow();
    expect(searchBox).toBeDefined();
    expect(searchBox.props.value).toEqual(searchText);
  });

  it("renders with an input & SearchInDataCatalog when showLocationSearchResults", function () {
    const searchText = "mochi";
    runInAction(() => {
      viewState.searchState.locationSearchText = searchText;
      viewState.searchState.showLocationSearchResults = true;
      viewState.searchState.locationSearchResults = [];
    });
    act(() => {
      testRenderer = createWithContexts(
        viewState,
        <ThemeProvider theme={terriaTheme}>
          <SearchBoxAndResults placeholder="Search" />
        </ThemeProvider>
      );
    });

    const searchBox = testRenderer.root.findByType("input");
    expect(searchBox).toBeDefined();
    expect(testRenderer.root.findByType(SearchInDataCatalog)).toBeDefined();
    expect(searchBox.props.value).toEqual(searchText);
  });

  it("renders with an input & no SearchInDataCatalog without catalogSearchProvider", function () {
    const searchText = "timmynook";
    runInAction(() => {
      viewState.searchState.locationSearchText = searchText;
      viewState.searchState.showLocationSearchResults = true;
      viewState.searchState.locationSearchResults = [];
      viewState.terria.searchBarModel.catalogSearchProvider = undefined;
    });
    act(() => {
      testRenderer = createWithContexts(
        viewState,
        <ThemeProvider theme={terriaTheme}>
          <SearchBoxAndResults placeholder="Search" />
        </ThemeProvider>
      );
    });

    const searchBox = testRenderer.root.findByType("input");
    expect(searchBox).toBeDefined();
    expect(() => {
      testRenderer.root.findByType(SearchInDataCatalog);
    }).toThrow();
    expect(searchBox.props.value).toEqual(searchText);
  });

  it("renders with an input & no SearchInDataCatalog when showSearchInCatalog is false", function () {
    const searchText = "timmynook";
    runInAction(() => {
      viewState.searchState.locationSearchText = searchText;
      viewState.searchState.showLocationSearchResults = true;
      viewState.searchState.locationSearchResults = [];

      viewState.terria.searchBarModel.setTrait(
        CommonStrata.user,
        "showSearchInCatalog",
        false
      );
    });
    act(() => {
      testRenderer = createWithContexts(
        viewState,
        <ThemeProvider theme={terriaTheme}>
          <SearchBoxAndResults placeholder="Search" />
        </ThemeProvider>
      );
    });

    const searchBox = testRenderer.root.findByType("input");
    expect(searchBox).toBeDefined();
    expect(() => {
      testRenderer.root.findByType(SearchInDataCatalog);
    }).toThrow();
    expect(searchBox.props.value).toEqual(searchText);
  });
});
