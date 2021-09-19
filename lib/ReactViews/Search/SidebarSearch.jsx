import createReactClass from "create-react-class";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";
import { addMarker } from "../../Models/LocationMarkerUtils";
import BadgeBar from "../BadgeBar";
import LocationSearchResults from "./LocationSearchResults";
import SideBarDatasetSearchResults from "./SideBarDatasetSearchResults";
import Styles from "./sidebar-search.scss";
import { runInAction } from "mobx";

// Handle any of the three kinds of search based on the props
const SidebarSearch = observer(
  createReactClass({
    displayName: "SidebarSearch",

    propTypes: {
      viewState: PropTypes.object.isRequired,
      isWaitingForSearchToStart: PropTypes.bool,
      terria: PropTypes.object.isRequired,
      t: PropTypes.func.isRequired
    },

    backToNowViewing() {
      runInAction(() => {
        this.props.viewState.searchState.showLocationSearchResults = false;
      });
    },

    onLocationClick(result) {
      addMarker(this.props.terria, result);
      result.clickAction();
    },

    render() {
      const { t } = this.props;
      return (
        <div className={Styles.search}>
          <div className={Styles.results}>
            <BadgeBar label={t("search.resultsLabel")}>
              <button
                type="button"
                onClick={this.backToNowViewing}
                className={Styles.btnDone}
              >
                {t("search.done")}
              </button>
            </BadgeBar>
            <div className={Styles.resultsContent}>
              <If
                condition={
                  this.props.viewState.searchState.locationSearchText.length > 0
                }
              >
                {/* TODO: Put this back once we add a MobX DataCatalogSearch Provider */}
                {this.props.viewState.searchState.catalogSearchProvider && (
                  <SideBarDatasetSearchResults
                    terria={this.props.terria}
                    viewState={this.props.viewState}
                  />
                )}
              </If>
              <For
                each="search"
                of={this.props.viewState.searchState.locationSearchResults}
              >
                <LocationSearchResults
                  key={search.searchProvider.name}
                  terria={this.props.terria}
                  viewState={this.props.viewState}
                  search={search}
                  onLocationClick={this.onLocationClick}
                  isWaitingForSearchToStart={
                    this.props.isWaitingForSearchToStart
                  }
                />
              </For>
            </div>
          </div>
        </div>
      );
    }
  })
);

module.exports = withTranslation()(SidebarSearch);
