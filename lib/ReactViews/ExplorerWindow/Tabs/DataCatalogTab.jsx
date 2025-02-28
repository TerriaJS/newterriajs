import { computed, runInAction, makeObservable } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import { Component } from "react";
import { withTranslation } from "react-i18next";
import { withTheme } from "styled-components";
import DataCatalog from "../../DataCatalog/DataCatalog";
import DataPreview from "../../Preview/DataPreview";
import SearchBox, { DEBOUNCE_INTERVAL } from "../../Search/SearchBox.jsx";
import Styles from "./data-catalog-tab.scss";
import Breadcrumbs from "../../Search/Breadcrumbs";
import Box from "../../../Styled/Box";

// The DataCatalog Tab
@observer
class DataCatalogTab extends Component {
  static propTypes = {
    terria: PropTypes.object,
    viewState: PropTypes.object,
    items: PropTypes.array,
    searchPlaceholder: PropTypes.string,
    onActionButtonClicked: PropTypes.func,
    theme: PropTypes.object,
    t: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    makeObservable(this);
  }

  @computed
  get searchPlaceholder() {
    const { t } = this.props;
    return this.props.searchPlaceholder || t("addData.searchPlaceholder");
  }

  changeSearchText(newText) {
    runInAction(() => {
      this.props.viewState.searchState.catalogSearchText = newText;
    });
  }

  search() {
    this.props.viewState.searchState.searchCatalog();
  }

  render() {
    const terria = this.props.terria;
    const searchState = this.props.viewState.searchState;
    const previewed = this.props.viewState.previewedItem;
    const showBreadcrumbs = this.props.viewState.breadcrumbsShown;
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
                  onSearchTextChanged={(val) => this.changeSearchText(val)}
                  onDoSearch={() => this.search()}
                  placeholder={this.searchPlaceholder}
                  debounceDuration={
                    terria.catalogReferencesLoaded &&
                    searchState.catalogSearchProvider
                      ? searchState.catalogSearchProvider
                          .debounceDurationOnceLoaded
                      : DEBOUNCE_INTERVAL
                  }
                />
              )}
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
