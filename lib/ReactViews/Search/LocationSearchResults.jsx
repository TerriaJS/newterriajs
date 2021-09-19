/**
  Initially this was written to support various location search providers in master,
  however we only have a single location provider at the moment, and how we merge
  them in the new design is yet to be resolved, see:
  https://github.com/TerriaJS/nsw-digital-twin/issues/248#issuecomment-599919318
 */

import { observer } from "mobx-react";
import createReactClass from "create-react-class";
import styled from "styled-components";
import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";
import SearchHeader from "./SearchHeader";
import SearchResult from "./SearchResult";
import classNames from "classnames";
import Styles from "./location-search-result.scss";
import isDefined from "../../Core/isDefined";

import Icon, { StyledIcon } from "../../Styled/Icon";
// import Box, { BoxSpan } from "../../Styled/Box";
import { BoxSpan } from "../../Styled/Box";
import Text, { TextSpan } from "../../Styled/Text";

import { RawButton } from "../../Styled/Button";

const RawButtonAndHighlight = styled(RawButton)`
  ${p => `
  &:hover, &:focus {
    background-color: ${p.theme.greyLighter};
    ${StyledIcon} {
      fill-opacity: 1;
    }
  }`}
`;

const MAX_RESULTS_BEFORE_TRUNCATING = 5;

const LocationSearchResults = observer(
  createReactClass({
    displayName: "LocationSearchResults",

    propTypes: {
      viewState: PropTypes.object.isRequired,
      isWaitingForSearchToStart: PropTypes.bool,
      terria: PropTypes.object.isRequired,
      search: PropTypes.object.isRequired,
      onLocationClick: PropTypes.func.isRequired,
      theme: PropTypes.string,
      locationSearchText: PropTypes.string,
      t: PropTypes.func.isRequired
    },

    getInitialState() {
      return {
        isOpen: true,
        isExpanded: false
      };
    },

    getDefaultProps() {
      return {
        theme: "light"
      };
    },

    toggleIsOpen() {
      this.setState({
        isOpen: !this.state.isOpen
      });
    },

    toggleExpand() {
      this.setState({
        isExpanded: !this.state.isExpanded
      });
    },

    renderResultsFooter() {
      const { t } = this.props;
      if (this.state.isExpanded) {
        return t("search.viewLess", {
          name: this.props.search.searchProvider.name
        });
      }
      return t("search.viewMore", {
        name: this.props.search.searchProvider.name
      });
    },

    render() {
      const search = this.props.search;
      const { isOpen, isExpanded } = this.state;
      const searchProvider = search.searchProvider;
      const locationSearchBoundingBox = this.props.terria.configParameters
        .locationSearchBoundingBox;

      const validResults = isDefined(locationSearchBoundingBox)
        ? search.results.filter(function(r) {
            return (
              r.location.longitude > locationSearchBoundingBox[0] &&
              r.location.longitude < locationSearchBoundingBox[2] &&
              r.location.latitude > locationSearchBoundingBox[1] &&
              r.location.latitude < locationSearchBoundingBox[3]
            );
          })
        : search.results;

      const results =
        validResults.length > MAX_RESULTS_BEFORE_TRUNCATING
          ? isExpanded
            ? validResults
            : validResults.slice(0, MAX_RESULTS_BEFORE_TRUNCATING)
          : validResults;

      return (
        <div
          key={searchProvider.name}
          className={classNames(Styles.providerResult, {
            [Styles.isOpen]: this.state.isOpen,
            [Styles.dark]: this.props.theme === "dark",
            [Styles.light]: this.props.theme === "light"
          })}
        >
          {/* <button onClick={this.toggleGroup} className={Styles.heading}>
            <span>{searchProvider.name}</span>
            <Icon
              glyph={
                this.state.isOpen ? Icon.GLYPHS.opened : Icon.GLYPHS.closed
              }
            />
          </button> */}
          <RawButtonAndHighlight
            type="button"
            fullWidth
            onClick={this.toggleIsOpen}
          >
            <BoxSpan
              paddedRatio={2}
              paddedVertically={3}
              centered
              justifySpaceBetween
            >
              <TextSpan
                textDarker
                uppercase
              >{`${search.searchProvider.name} (${validResults?.length})`}</TextSpan>
              <StyledIcon
                styledWidth={"9px"}
                glyph={isOpen ? Icon.GLYPHS.opened : Icon.GLYPHS.closed}
              />
            </BoxSpan>
          </RawButtonAndHighlight>
          <Text textDarker>
            <SearchHeader
              searchResults={search}
              isWaitingForSearchToStart={this.props.isWaitingForSearchToStart}
            />
            <ul className={Styles.items}>
              {results.map((result, i) => (
                <SearchResult
                  key={i}
                  clickAction={this.props.onLocationClick.bind(null, result)}
                  name={result.name}
                  icon="location2"
                  searchResultTheme={this.props.theme}
                  locationSearchText={this.props.locationSearchText}
                  isLastResult={results.length === i + 1}
                />
              ))}
            </ul>
            {isOpen && validResults.length > MAX_RESULTS_BEFORE_TRUNCATING && (
              <BoxSpan
                paddedRatio={2}
                paddedVertically={3}
                left
                justifySpaceBetween
              >
                <RawButton onClick={this.toggleExpand}>
                  <Text small isLink>
                    {this.renderResultsFooter()}
                  </Text>
                </RawButton>
              </BoxSpan>
            )}
          </Text>
        </div>
      );
    }
  })
);

module.exports = withTranslation()(LocationSearchResults);
