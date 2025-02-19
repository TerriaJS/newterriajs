import { computed, runInAction, makeObservable } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { type TFunction, withTranslation } from "react-i18next";
import { type DefaultTheme, withTheme } from "styled-components";
import DataCatalog from "../../DataCatalog/DataCatalog";
import DataPreview from "../../Preview/DataPreview";
import SearchBox, { DEBOUNCE_INTERVAL } from "../../Search/SearchBox.jsx";
import Styles from "./data-catalog-tab.scss";
import Breadcrumbs from "../../Search/Breadcrumbs";
import Box from "../../../Styled/Box";
import Terria from "../../../Models/Terria";
import ViewState from "../../../ReactViewModels/ViewState";

interface DataCatalogTabProps {
  terria: Terria;
  viewState: ViewState;
  items?: object[];
  searchPlaceholder?: string;
  onActionButtonClicked?: (e: any) => void;
  theme: DefaultTheme;
  t: TFunction;
}

// The DataCatalog Tab
@observer
class DataCatalogTab extends React.Component<DataCatalogTabProps> {
  constructor(props: DataCatalogTabProps) {
    super(props);
    makeObservable(this);
  }

  @computed
  get searchPlaceholder() {
    const { t } = this.props;
    return this.props.searchPlaceholder || t("addData.searchPlaceholder");
  }

  changeSearchText(newText: string) {
    runInAction(() => {
      this.props.viewState.searchState.catalogSearchText = newText;
    });
  }

  search() {
    this.props.viewState.searchState.searchCatalog();
  }

  render() {
    const terria = this.props.terria;
    const state = this.props.viewState.searchState;
    const previewed = this.props.viewState.previewedItem;
    const showBreadcrumbs = this.props.viewState.breadcrumbsShown;
    return (
      <div className={Styles.root}>
        <Box fullHeight column>
          <Box fullHeight overflow="hidden">
            <Box className={Styles.dataExplorer} styledWidth="40%">
              {/* ~TODO: Put this back once we add a MobX DataCatalogSearch Provider~ */}
              {/* TODO2: Implement a more generic MobX DataCatalogSearch */}
              {state.catalogSearchProvider ? (
                <SearchBox
                  searchText={state.catalogSearchText}
                  onSearchTextChanged={(val: string) =>
                    this.changeSearchText(val)
                  }
                  onDoSearch={() => this.search()}
                  placeholder={this.searchPlaceholder}
                  debounceDuration={
                    terria.catalogReferencesLoaded
                      ? // @ts-expect-error Tsc says type is "Instance".
                        state.catalogSearchProvider.debounceDurationOnceLoaded
                      : DEBOUNCE_INTERVAL
                  }
                />
              ) : null}
              <DataCatalog
                terria={this.props.terria}
                viewState={this.props.viewState}
                onActionButtonClicked={this.props.onActionButtonClicked}
                items={this.props.items}
              />
            </Box>
            <Box styledWidth="60%">
              <DataPreview
                terria={terria}
                viewState={this.props.viewState}
                previewed={previewed}
              />
            </Box>
          </Box>

          {showBreadcrumbs && (
            <Breadcrumbs
              terria={this.props.terria}
              viewState={this.props.viewState}
              previewed={previewed}
            />
          )}
        </Box>
      </div>
    );
  }
}

export default withTranslation()(withTheme(DataCatalogTab));
