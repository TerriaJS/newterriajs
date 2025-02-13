import { Component } from "react";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";
import defined from "terriajs-cesium/Source/Core/defined";
import SearchHeader from "../Search/SearchHeader";
import Styles from "./data-catalog.scss";
import DataCatalogMember from "./DataCatalogMember";

// Displays the data catalog.
@observer
class DataCatalog extends Component {
  static propTypes = {
    terria: PropTypes.object,
    viewState: PropTypes.object,
    items: PropTypes.array,
    onActionButtonClicked: PropTypes.func,
    removable: PropTypes.bool,
    t: PropTypes.func.isRequired
  };

  render() {
    const searchState = this.props.viewState.searchState;
    const isSearching = searchState.catalogSearchText.length > 0;
    const catalogSearchProvider = searchState.catalogSearchProvider;
    const unfilteredItems =
      isSearching &&
      catalogSearchProvider &&
      searchState.catalogSearchResults?.results
        ? searchState.catalogSearchResults.results.map(
            (result) => result.catalogItem
          )
        : this.props.items;
    const items = (unfilteredItems || []).filter(defined);
    const { t } = this.props;
    return (
      <ul className={Styles.dataCatalog}>
        {isSearching && catalogSearchProvider && (
          <>
            <label className={Styles.label}>{t("search.resultsLabel")}</label>
            <SearchHeader
              searchResults={searchState.catalogSearchResults}
              isWaitingForSearchToStart={
                searchState.isWaitingToStartCatalogSearch
              }
            />
          </>
        )}
        {items.map(
          (item) =>
            item !== this.props.terria.catalog.userAddedDataGroup && (
              <DataCatalogMember
                viewState={this.props.viewState}
                member={item}
                // manage group `isOpen` flag locally if searching through models dynamically (i.e. not using catalog index)
                // This must be false if resultsAreReferences - so group references open correctly in the search
                manageIsOpenLocally={
                  isSearching && !catalogSearchProvider.resultsAreReferences
                }
                key={item.uniqueId}
                onActionButtonClicked={this.props.onActionButtonClicked}
                removable={this.props.removable}
                terria={this.props.terria}
                isTopLevel
              />
            )
        )}
      </ul>
    );
  }
}

export default withTranslation()(DataCatalog);
