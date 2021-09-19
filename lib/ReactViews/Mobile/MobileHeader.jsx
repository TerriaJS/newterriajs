import classNames from "classnames";
import createReactClass from "create-react-class";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";
import { withTheme } from "styled-components";
import { removeMarker } from "../../Models/LocationMarkerUtils";
import Box from "../../Styled/Box";
import { RawButton } from "../../Styled/Button";
import Icon, { StyledIcon } from "../../Styled/Icon";
import SearchBox from "../Search/SearchBox";
import Branding from "../SidePanel/Branding";
import Styles from "./mobile-header.scss";
import MobileMenu from "./MobileMenu";
import MobileModalWindow from "./MobileModalWindow";

const MobileHeader = observer(
  createReactClass({
    displayName: "MobileHeader",

    propTypes: {
      terria: PropTypes.object,
      viewState: PropTypes.object.isRequired,
      allBaseMaps: PropTypes.array,
      version: PropTypes.string,
      menuLeftItems: PropTypes.array,
      menuItems: PropTypes.array,
      theme: PropTypes.object,
      t: PropTypes.func.isRequired
    },

    getInitialState() {
      return {};
    },

    showSearch() {
      const viewState = this.props.viewState;
      const mobileView = viewState.mobileView;
      const mobileViewOptions = viewState.mobileViewOptions;
      const searchState = viewState.searchState;
      runInAction(() => {
        if (
          mobileView === mobileViewOptions.data ||
          mobileView === mobileViewOptions.preview
        ) {
          searchState.showMobileCatalogSearch = true;
        } else {
          searchState.showMobileLocationSearch = true;
          this.showLocationSearchResults();
        }
      });
    },

    closeLocationSearch() {
      runInAction(() => {
        this.props.viewState.searchState.showMobileLocationSearch = false;
        this.props.viewState.explorerPanelIsVisible = false;
        this.props.viewState.switchMobileView(null);
      });
    },

    closeCatalogSearch() {
      runInAction(() => {
        this.props.viewState.searchState.showMobileCatalogSearch = false;
        this.props.viewState.searchState.catalogSearchText = "";
      });
    },

    onMobileDataCatalogClicked() {
      this.props.viewState.setTopElement("DataCatalog");
      this.toggleView(this.props.viewState.mobileViewOptions.data);
    },

    onMobileNowViewingClicked() {
      this.props.viewState.setTopElement("NowViewing");
      this.toggleView(this.props.viewState.mobileViewOptions.nowViewing);
    },

    changeLocationSearchText(newText) {
      runInAction(() => {
        this.props.viewState.searchState.locationSearchText = newText;
      });

      if (newText.length === 0) {
        removeMarker(this.props.terria);
      }

      this.showLocationSearchResults();
    },

    showLocationSearchResults() {
      runInAction(() => {
        const text = this.props.viewState.searchState.locationSearchText;
        if (text && text.length > 0) {
          this.props.viewState.explorerPanelIsVisible = true;
          this.props.viewState.mobileView = this.props.viewState.mobileViewOptions.locationSearchResults;
        } else {
          // TODO: return to the preview mobileView, rather than dropping back to the map
          this.props.viewState.explorerPanelIsVisible = false;
          this.props.viewState.mobileView = null;
        }
      });
    },

    changeCatalogSearchText(newText) {
      runInAction(() => {
        this.props.viewState.searchState.catalogSearchText = newText;
      });
    },

    searchLocations() {
      this.props.viewState.searchState.searchLocations();
    },

    searchCatalog() {
      this.props.viewState.searchState.searchCatalog();
    },

    toggleView(viewname) {
      runInAction(() => {
        if (this.props.viewState.mobileView !== viewname) {
          this.props.viewState.explorerPanelIsVisible = true;
          this.props.viewState.switchMobileView(viewname);
        } else {
          this.props.viewState.explorerPanelIsVisible = false;
          this.props.viewState.switchMobileView(null);
        }
      });
    },

    onClickFeedback(e) {
      e.preventDefault();
      runInAction(() => {
        this.props.viewState.feedbackFormIsVisible = true;
      });
      this.setState({
        menuIsOpen: false
      });
    },

    render() {
      const searchState = this.props.viewState.searchState;
      const { t } = this.props;
      const nowViewingLength =
        this.props.terria.workbench.items !== undefined
          ? this.props.terria.workbench.items.length
          : 0;

      return (
        <div className={Styles.ui}>
          <Box
            justifySpaceBetween
            fullWidth
            fullHeight
            paddedRatio={1}
            backgroundColor={this.props.theme.dark}
          >
            <Choose>
              <When
                condition={
                  !searchState.showMobileLocationSearch &&
                  !searchState.showMobileCatalogSearch
                }
              >
                <Box
                  position="absolute"
                  css={`
                    left: 5px;
                  `}
                >
                  <RawButton
                    type="button"
                    onClick={() => this.props.viewState.toggleMobileMenu()}
                    title={t("mobile.toggleNavigation")}
                    css={`
                      border-radius: 2px;
                      padding: 0 5px;
                      margin-right: 3px;
                      &:hover,
                      &:focus,
                      & {
                        border: 1px solid
                          ${this.props.theme.textLightTranslucent};
                      }
                    `}
                  >
                    <StyledIcon
                      light
                      glyph={Icon.GLYPHS.menu}
                      styledWidth={"37px"}
                      styledHeight={"37px"}
                    />
                  </RawButton>
                  <Branding
                    terria={this.props.terria}
                    viewState={this.props.viewState}
                    version={this.props.version}
                  />
                </Box>
                <div
                  className={Styles.groupRight}
                  css={`
                    background-color: ${p => p.theme.dark};
                  `}
                >
                  <button
                    type="button"
                    className={Styles.btnAdd}
                    onClick={this.onMobileDataCatalogClicked}
                  >
                    {t("mobile.addDataBtnText")}
                    <Icon glyph={Icon.GLYPHS.increase} />
                  </button>
                  <If condition={nowViewingLength > 0}>
                    <button
                      type="button"
                      className={Styles.btnNowViewing}
                      onClick={this.onMobileNowViewingClicked}
                    >
                      <Icon glyph={Icon.GLYPHS.eye} />
                      <span
                        className={classNames(Styles.nowViewingCount, {
                          [Styles.doubleDigit]: nowViewingLength > 9
                        })}
                      >
                        {nowViewingLength}
                      </span>
                    </button>
                  </If>
                  <button
                    className={Styles.btnSearch}
                    type="button"
                    onClick={this.showSearch}
                  >
                    <Icon glyph={Icon.GLYPHS.search} />
                  </button>
                </div>
              </When>
              <Otherwise>
                <div className={Styles.formSearchData}>
                  <Choose>
                    <When condition={searchState.showMobileLocationSearch}>
                      <SearchBox
                        searchText={searchState.locationSearchText}
                        onSearchTextChanged={this.changeLocationSearchText}
                        onDoSearch={this.searchLocations}
                        placeholder={t("search.placeholder")}
                        alwaysShowClear={true}
                        onClear={this.closeLocationSearch}
                        autoFocus={true}
                      />
                    </When>
                    <When condition={searchState.showMobileCatalogSearch}>
                      <SearchBox
                        searchText={searchState.catalogSearchText}
                        onSearchTextChanged={this.changeCatalogSearchText}
                        onDoSearch={this.searchCatalog}
                        placeholder={t("search.searchCatalogue")}
                        onClear={this.closeCatalogSearch}
                        autoFocus={true}
                      />
                    </When>
                  </Choose>
                </div>
              </Otherwise>
            </Choose>
          </Box>
          <MobileMenu
            menuItems={this.props.menuItems}
            menuLeftItems={this.props.menuLeftItems}
            viewState={this.props.viewState}
            allBaseMaps={this.props.allBaseMaps}
            terria={this.props.terria}
            showFeedback={!!this.props.terria.configParameters.feedbackUrl}
          />
          <MobileModalWindow
            terria={this.props.terria}
            viewState={this.props.viewState}
          />
        </div>
      );
    }
  })
);
module.exports = withTranslation()(withTheme(MobileHeader));
