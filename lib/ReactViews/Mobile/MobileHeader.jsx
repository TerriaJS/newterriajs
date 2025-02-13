import classNames from "classnames";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import { Component } from "react";
import { withTranslation } from "react-i18next";
import styled, { withTheme } from "styled-components";
import { applyTranslationIfExists } from "../../Language/languageHelpers";
import { removeMarker } from "../../Models/LocationMarkerUtils";
import Box from "../../Styled/Box";
import { RawButton } from "../../Styled/Button";
import Icon, { StyledIcon } from "../../Styled/Icon";
import SearchBox from "../Search/SearchBox";
import Branding from "../SidePanel/Branding";
import { withViewState } from "../Context";
import Styles from "./mobile-header.scss";
import MobileMenu from "./MobileMenu";
import MobileModalWindow from "./MobileModalWindow";

@observer
class MobileHeader extends Component {
  static displayName = "MobileHeader";

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
  }

  closeLocationSearch() {
    runInAction(() => {
      this.props.viewState.searchState.showMobileLocationSearch = false;
      this.props.viewState.explorerPanelIsVisible = false;
      this.props.viewState.switchMobileView(null);
    });
  }

  closeCatalogSearch() {
    runInAction(() => {
      this.props.viewState.searchState.showMobileCatalogSearch = false;
      this.props.viewState.searchState.catalogSearchText = "";
    });
  }

  onMobileDataCatalogClicked() {
    this.props.viewState.setTopElement("DataCatalog");
    this.toggleView(this.props.viewState.mobileViewOptions.data);
  }

  onMobileNowViewingClicked() {
    this.props.viewState.setTopElement("NowViewing");
    this.toggleView(this.props.viewState.mobileViewOptions.nowViewing);
  }

  changeLocationSearchText(newText) {
    runInAction(() => {
      this.props.viewState.searchState.locationSearchText = newText;
    });

    if (newText.length === 0) {
      removeMarker(this.props.viewState.terria);
    }

    this.showLocationSearchResults();
  }

  showLocationSearchResults() {
    runInAction(() => {
      const text = this.props.viewState.searchState.locationSearchText;
      if (text && text.length > 0) {
        this.props.viewState.explorerPanelIsVisible = true;
        this.props.viewState.mobileView =
          this.props.viewState.mobileViewOptions.locationSearchResults;
      } else {
        // TODO: return to the preview mobileView, rather than dropping back to the map
        this.props.viewState.explorerPanelIsVisible = false;
        this.props.viewState.mobileView = null;
      }
    });
  }

  changeCatalogSearchText(newText) {
    runInAction(() => {
      this.props.viewState.searchState.catalogSearchText = newText;
    });
  }

  searchLocations() {
    this.props.viewState.searchState.searchLocations();
  }

  searchCatalog() {
    this.props.viewState.searchState.searchCatalog();
  }

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
  }

  onClickFeedback(e) {
    e.preventDefault();
    runInAction(() => {
      this.props.viewState.feedbackFormIsVisible = true;
    });
    this.setState({
      menuIsOpen: false
    });
  }

  renderSearch() {
    const { t, viewState } = this.props;
    const searchState = viewState.searchState;
    return (
      <div className={Styles.formSearchData}>
        {searchState.showMobileLocationSearch && (
          <SearchBox
            searchText={searchState.locationSearchText}
            onSearchTextChanged={this.changeLocationSearchText.bind(this)}
            onDoSearch={this.searchLocations.bind(this)}
            placeholder={applyTranslationIfExists(
              viewState.terria.searchBarModel.placeholder,
              this.props.i18n
            )}
            alwaysShowClear
            onClear={this.closeLocationSearch.bind(this)}
            autoFocus
          />
        )}
        {searchState.showMobileCatalogSearch && (
          <SearchBox
            searchText={searchState.catalogSearchText}
            onSearchTextChanged={this.changeCatalogSearchText.bind(this)}
            onDoSearch={this.searchCatalog.bind(this)}
            placeholder={t("search.searchCatalogue")}
            onClear={this.closeCatalogSearch.bind(this)}
            autoFocus
          />
        )}
      </div>
    );
  }

  render() {
    const searchState = this.props.viewState.searchState;
    const { t } = this.props;
    const nowViewingLength =
      this.props.viewState.terria.workbench.items !== undefined
        ? this.props.viewState.terria.workbench.items.length
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
          {!searchState.showMobileLocationSearch &&
          !searchState.showMobileCatalogSearch ? (
            <>
              <Box
                position="absolute"
                css={`
                  left: 5px;
                `}
              >
                <HamburgerButton
                  type="button"
                  onClick={this.props.viewState.toggleMobileMenu.bind(
                    this.props.viewState
                  )}
                  title={t("mobile.toggleNavigation")}
                >
                  <StyledIcon
                    light
                    glyph={Icon.GLYPHS.menu}
                    styledWidth="20px"
                    styledHeight="20px"
                  />
                </HamburgerButton>
                <Branding
                  terria={this.props.viewState.terria}
                  viewState={this.props.viewState}
                  version={this.props.version}
                />
              </Box>
              <div
                className={Styles.groupRight}
                css={`
                  background-color: ${(p) => p.theme.dark};
                `}
              >
                <button
                  type="button"
                  className={Styles.btnAdd}
                  onClick={this.onMobileDataCatalogClicked.bind(this)}
                >
                  {t("mobile.addDataBtnText")}
                  <StyledIcon
                    glyph={Icon.GLYPHS.increase}
                    styledWidth="20px"
                    styledHeight="20px"
                  />
                </button>
                {nowViewingLength > 0 && (
                  <button
                    type="button"
                    className={Styles.btnNowViewing}
                    onClick={this.onMobileNowViewingClicked.bind(this)}
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
                )}
                <button
                  className={Styles.btnSearch}
                  type="button"
                  onClick={this.showSearch.bind(this)}
                >
                  <StyledIcon
                    glyph={Icon.GLYPHS.search}
                    styledWidth="20px"
                    styledHeight="20px"
                  />
                </button>
              </div>
            </>
          ) : (
            this.renderSearch()
          )}
        </Box>
        <MobileMenu
          menuItems={this.props.menuItems}
          menuLeftItems={this.props.menuLeftItems}
          viewState={this.props.viewState}
          terria={this.props.viewState.terria}
          showFeedback={
            !!this.props.viewState.terria.configParameters.feedbackUrl
          }
        />
        {/* Don't show mobile modal window if user is currently interacting
              with map - like picking a point or drawing shapes
           */}
        {!this.props.viewState.isMapInteractionActive && (
          <MobileModalWindow
            terria={this.props.viewState.terria}
            viewState={this.props.viewState}
          />
        )}
      </div>
    );
  }
}

const HamburgerButton = styled(RawButton)`
  border-radius: 4px;
  padding: 0 5px;
  margin-right: 3px;
  background: ${(p) => p.theme.darkLighter};
  width: 50px;
  height: 38px;
  box-sizing: content-box;
  display: flex;
  justify-content: center;
  align-items: center;
  &:hover,
  &:focus,
  & {
    border: 1px solid ${(p) => p.theme.textLightTranslucent};
  }
`;

MobileHeader.propTypes = {
  viewState: PropTypes.object.isRequired,
  version: PropTypes.string,
  menuLeftItems: PropTypes.array,
  menuItems: PropTypes.array,
  theme: PropTypes.object,
  t: PropTypes.func.isRequired,
  i18n: PropTypes.object
};

export default withTranslation()(withTheme(withViewState(MobileHeader)));
