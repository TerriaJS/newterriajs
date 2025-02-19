import { runInAction } from "mobx";
import { observer } from "mobx-react";
import { useTranslation } from "react-i18next";
import Box from "../../../Styled/Box";
import DataCatalog from "../../DataCatalog/DataCatalog";
import DataPreview from "../../Preview/DataPreview";
import Breadcrumbs from "../../Search/Breadcrumbs";
import SearchBox, { DEBOUNCE_INTERVAL } from "../../Search/SearchBox.jsx";
import Styles from "./data-catalog-tab.scss";
import { useViewState } from "../../Context";

interface DataCatalogTabProps {
  items?: unknown[];
  searchPlaceholder?: string;
  onActionButtonClicked?: () => void;
}

const DataCatalogTab = observer(function DataCatalogTab(
  props: DataCatalogTabProps
) {
  const viewState = useViewState();
  const { t } = useTranslation();

  const {
    searchState,
    previewedItem: previewed,
    breadcrumbsShown: showBreadcrumbs,
    terria
  } = viewState;

  const searchPlaceholder =
    props.searchPlaceholder || t("addData.searchPlaceholder");

  const changeSearchText = (newText: string) => {
    runInAction(() => {
      viewState.searchState.catalogSearchText = newText;
    });
  };

  const search = () => {
    viewState.searchState.searchCatalog();
  };

  return (
    <div className={Styles.root}>
      <Box fullHeight column>
        <Box fullHeight overflow="hidden">
          <Box className={Styles.dataExplorer} styledWidth="40%">
            {/* ~TODO: Put this back once we add a MobX DataCatalogSearch Provider~ */}
            {/* TODO2: Implement a more generic MobX DataCatalogSearch */}
            {searchState.catalogSearchProvider && (
              <SearchBox
                searchText={searchState.catalogSearchText}
                onSearchTextChanged={changeSearchText}
                onDoSearch={() => search()}
                placeholder={searchPlaceholder}
                debounceDuration={
                  terria.catalogReferencesLoaded &&
                  searchState.catalogSearchProvider
                    ? (searchState.catalogSearchProvider as any)
                        .debounceDurationOnceLoaded
                    : DEBOUNCE_INTERVAL
                }
              />
            )}
            <DataCatalog
              terria={terria}
              viewState={viewState}
              onActionButtonClicked={props.onActionButtonClicked}
              items={props.items}
            />
          </Box>
          <Box styledWidth="60%">
            <DataPreview
              terria={terria}
              viewState={viewState}
              previewed={previewed}
            />
          </Box>
        </Box>

        {showBreadcrumbs && (
          <Breadcrumbs
            terria={terria}
            viewState={viewState}
            previewed={previewed}
          />
        )}
      </Box>
    </div>
  );
});

export default DataCatalogTab;
