import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
// if we must use a placeholder image,
// do not bundle in the full res `wwwroot/images/bing-aerial-labels-wide.png`
// image as it's a 1.4mb png
// import bingAerialBackground from "../../wwwroot/images/bing-aerial-labels-wide-low-quality.jpg";
import styled, { withTheme } from "styled-components";
import Box from "../Styled/Box";
import Button from "../Styled/Button";
import Spacing from "../Styled/Spacing";
// eslint-disable-next-line no-redeclare
import Text from "../Styled/Text";
import parseCustomMarkdownToReact from "./Custom/parseCustomMarkdownToReact";
import { withViewState } from "./Context";
import FadeIn from "./Transitions/FadeIn/FadeIn";

const TopElementBox = styled(Box)`
  z-index: 99999;
  top: 0;
  right: 0;
`;

// background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
//   url(${bingAerialBackground});
const BackgroundImage = styled(Box)`
  background: rgba(0, 0, 0, 0.75);
  // background-size: cover;
  // background-repeat: no-repeat;
  // background-position: center;
  // filter: blur(10px);
  z-index: 0;
`;

const DisclaimerButton = styled(Button).attrs({
  textProps: {
    semiBold: true
  },
  rounded: true
})`
  width: ${(props) => (props.fullWidth ? "100%" : "280px")};
`;

@observer
class Disclaimer extends React.Component {
  static displayName = "Disclaimer";

  static propTypes = {
    viewState: PropTypes.object,
    theme: PropTypes.object,
    t: PropTypes.func.isRequired
  };

  confirm(confirmCallbackFn) {
    if (confirmCallbackFn) {
      confirmCallbackFn();
    }

    this.props.viewState.hideDisclaimer();
  }

  deny(denyCallbackFn) {
    if (denyCallbackFn) {
      denyCallbackFn();
    }
    // Otherwise, do nothing for now?
  }

  render() {
    const disclaimer = this.props.viewState.disclaimerSettings;
    const disclaimerTitle = disclaimer?.title || "Disclaimer";
    const disclaimerConfirm = disclaimer?.confirmText || "Ok";
    const disclaimerDeny = disclaimer?.denyText || "Cancel";
    const disclaimerMessage =
      disclaimer?.message || "Disclaimer text goes here";
    const useSmallScreenInterface =
      this.props.viewState.useSmallScreenInterface;
    const renderDenyButton = !!disclaimer?.denyAction;
    return disclaimer ? (
      <FadeIn isVisible={this.props.viewState.disclaimerVisible}>
        <TopElementBox position="absolute" fullWidth fullHeight centered>
          <BackgroundImage
            // // Make the image slightly larger to deal with
            // // image shrinking a tad bit when blurred
            // styledWidth={"110%"}
            // styledHeight={"110%"}

            fullWidth
            fullHeight
            position="absolute"
          />
          <Box
            displayInlineBlock
            left
            styledWidth={useSmallScreenInterface ? "100%" : "613px"}
            paddedRatio={4}
            scroll
            css={`
              max-height: 100%;
              overflow: auto;
            `}
          >
            <Text
              styledFontSize={"18px"}
              styledLineHeight={"24px"}
              bold
              textLight
            >
              {disclaimerTitle}
            </Text>
            <Spacing bottom={4} />
            <Text
              styledLineHeight={"18px"}
              textLight
              css={(props) =>
                `
                // not sure of the ideal way to deal with this
                a {
                  font-weight: 600;
                  color: ${props.theme.colorPrimary};
                  text-decoration: none;
                }
              `
              }
            >
              {parseCustomMarkdownToReact(disclaimerMessage)}
            </Text>
            <Spacing bottom={5} />
            <Box
              fullWidth
              centered
              displayInlineBlock={useSmallScreenInterface}
            >
              {renderDenyButton && (
                <DisclaimerButton
                  denyButton
                  onClick={() => this.deny(disclaimer.denyAction)}
                  fullWidth={useSmallScreenInterface}
                >
                  {disclaimerDeny}
                </DisclaimerButton>
              )}
              {useSmallScreenInterface ? (
                <Spacing bottom={3} />
              ) : (
                <Spacing right={3} />
              )}
              <DisclaimerButton
                onClick={() => this.confirm(disclaimer.confirmAction)}
                fullWidth={useSmallScreenInterface || !renderDenyButton}
                primary
              >
                {disclaimerConfirm}
              </DisclaimerButton>
            </Box>
          </Box>
        </TopElementBox>
      </FadeIn>
    ) : null;
  }
}

export default withTranslation()(withViewState(withTheme(Disclaimer)));
