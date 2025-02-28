import { Component } from "react";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import { addMarker } from "../../Models/LocationMarkerUtils";
import LocationSearchResults from "../Search/LocationSearchResults";
import SearchResult from "../Search/SearchResult";
import { withTranslation } from "react-i18next";
import Styles from "./mobile-search.scss";

// A Location item when doing Bing map searvh or Gazetter search
@observer
class MobileSearch extends Component {
  static propTypes = {
    viewState: PropTypes.object,
    terria: PropTypes.object,
    t: PropTypes.func.isRequired
  };

  onLocationClick(result) {
    runInAction(() => {
      result.clickAction();

      addMarker(this.props.terria, result);

      // Close modal window
      this.props.viewState.switchMobileView(null);
      this.props.viewState.searchState.showMobileLocationSearch = false;
    });
  }

  searchInDataCatalog() {
    const { searchState } = this.props.viewState;
    runInAction(() => {
      // Set text here so that it doesn't get batched up and the catalog
      // search text has a chance to set isWaitingToStartCatalogSearch
      searchState.catalogSearchText = searchState.locationSearchText;
    });
    this.props.viewState.searchInCatalog(searchState.locationSearchText);
  }

  render() {
    const theme = "light";
    return (
      <div className={Styles.mobileSearch}>
        <div>{this.renderSearchInCatalogLink(theme)}</div>
        <div className={Styles.location}>
          {this.renderLocationResult(theme)}
        </div>
      </div>
    );
  }

  renderSearchInCatalogLink(theme) {
    const { t } = this.props;
    const searchState = this.props.viewState.searchState;

    if (searchState.locationSearchText.length === 0) {
      return null;
    }

    return (
      <div className={Styles.providerResult}>
        <ul className={Styles.btnList}>
          {searchState.catalogSearchProvider && (
            <SearchResult
              clickAction={() => this.searchInDataCatalog()}
              icon={null}
              locationSearchText={searchState.locationSearchText}
              name={t("search.search", {
                searchText: searchState.locationSearchText
              })}
              searchResultTheme={theme}
            />
          )}
        </ul>
      </div>
    );
  }

  renderLocationResult(theme) {
    const searchState = this.props.viewState.searchState;
    return searchState.locationSearchResults.map((search) => (
      <LocationSearchResults
        key={search.searchProvider.name}
        terria={this.props.terria}
        viewState={this.props.viewState}
        search={search}
        locationSearchText={searchState.locationSearchText}
        onLocationClick={this.onLocationClick.bind(this)}
        isWaitingForSearchToStart={searchState.isWaitingToStartLocationSearch}
        theme={theme}
      />
    ));
  }
}

export default withTranslation()(MobileSearch);
