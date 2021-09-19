import PropTypes from "prop-types";
import styled, { withTheme } from "styled-components";
import createReactClass from "create-react-class";
import Icon, { StyledIcon } from "../../Styled/Icon";

import Box, { BoxSpan } from "../../Styled/Box";
import { RawButton } from "../../Styled/Button";
import { TextSpan } from "../../Styled/Text";
import Hr from "../../Styled/Hr";
import Spacing, { SpacingSpan } from "../../Styled/Spacing";

import highlightKeyword from "../ReactViewHelpers/highlightKeyword";

// Not sure how to generalise this or if it should be kept in stlyed/Button.jsx

// Initially had this as border bottom on the button, but need a HR given it's not a full width border
// // ${p => !p.isLastResult && `border-bottom: 1px solid ${p.theme.greyLighter};`}
const RawButtonAndHighlight = styled(RawButton)`
  ${p => `
  &:hover, &:focus {
    background-color: ${p.theme.greyLighter};
    ${StyledIcon} {
      fill-opacity: 1;
    }
  }`}
`;

// A Location item when doing Bing map searvh or Gazetter search
export const SearchResult = createReactClass({
  propTypes: {
    name: PropTypes.string.isRequired,
    clickAction: PropTypes.func.isRequired,
    isLastResult: PropTypes.bool,
    locationSearchText: PropTypes.string,
    icon: PropTypes.string,
    theme: PropTypes.object,
    searchResultTheme: PropTypes.string
  },

  getDefaultProps() {
    return {
      icon: false,
      searchResultTheme: "light"
    };
  },

  render() {
    const {
      searchResultTheme,
      theme,
      name,
      locationSearchText,
      icon
      // isLastResult
    } = this.props;
    const isDarkTheme = searchResultTheme === "dark";
    const isLightTheme = searchResultTheme === "light";
    const highlightedResultName = highlightKeyword(name, locationSearchText);
    return (
      <li>
        <Box fullWidth column>
          <RawButtonAndHighlight
            type="button"
            onClick={this.props.clickAction}
            fullWidth
          >
            {/* {!isLastResult && ( */}
            <BoxSpan>
              <SpacingSpan right={2} />
              <Hr size={1} fullWidth borderBottomColor={theme.greyLighter} />
              <SpacingSpan right={2} />
            </BoxSpan>
            {/* )} */}
            <TextSpan
              breakWord
              large
              // (You need light text on a dark theme, and vice versa)
              textLight={isDarkTheme}
              textDark={isLightTheme}
            >
              <BoxSpan
                paddedRatio={2}
                paddedVertically={3}
                centered
                justifySpaceBetween
              >
                {icon && (
                  <StyledIcon
                    // (You need light text on a dark theme, and vice versa)
                    fillColor={isLightTheme ? theme.textDarker : false}
                    light={isDarkTheme}
                    styledWidth={"16px"}
                    glyph={Icon.GLYPHS[icon]}
                  />
                )}
                <Spacing right={2} />
                <BoxSpan fullWidth>
                  <TextSpan noFontSize textAlignLeft>
                    {highlightedResultName}
                  </TextSpan>
                </BoxSpan>
                <StyledIcon
                  // (You need light text on a dark theme, and vice versa)
                  fillColor={isLightTheme ? theme.textDarker : false}
                  light={isDarkTheme}
                  styledWidth={"14px"}
                  css={"fill-opacity:0;"}
                  glyph={Icon.GLYPHS.right2}
                />
              </BoxSpan>
            </TextSpan>
          </RawButtonAndHighlight>
        </Box>
      </li>
    );
  }
});

export default withTheme(SearchResult);
