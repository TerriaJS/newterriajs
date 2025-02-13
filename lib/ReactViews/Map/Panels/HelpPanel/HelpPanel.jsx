import { runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import { Component } from "react";
import { withTranslation } from "react-i18next";
import { withTheme } from "styled-components";
import {
  Category,
  HelpAction
} from "../../../../Core/AnalyticEvents/analyticEvents";
import Box from "../../../../Styled/Box";
import Button, { RawButton } from "../../../../Styled/Button";
import Icon, { StyledIcon } from "../../../../Styled/Icon";
import Spacing from "../../../../Styled/Spacing";
import Text from "../../../../Styled/Text";
import parseCustomMarkdownToReact from "../../../Custom/parseCustomMarkdownToReact";
import { withViewState } from "../../../Context";
import HelpPanelItem from "./HelpPanelItem";

export const HELP_PANEL_ID = "help";

@observer
class HelpPanel extends Component {
  static displayName = "HelpPanel";

  static propTypes = {
    viewState: PropTypes.object.isRequired,
    theme: PropTypes.object,
    t: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      isAnimatingOpen: true
    };
  }

  componentDidMount() {
    // The animation timing is controlled in the CSS so the timeout can be 0 here.
    setTimeout(() => this.setState({ isAnimatingOpen: false }), 0);
  }

  componentWillUnmount() {
    // Make sure that retainSharePanel is set to false. This property is used to temporarily disable closing when Share Panel loses focus.
    // If the Share Panel is open underneath help panel, we now want to allow it to close normally.
    setTimeout(() => {
      this.props.viewState.setRetainSharePanel(false);
    }, 500); // We need to re-enable closing of share panel when loses focus.
  }

  render() {
    const { t } = this.props;
    const helpItems = this.props.viewState.terria.configParameters.helpContent;
    const isExpanded = this.props.viewState.helpPanelExpanded;
    const isAnimatingOpen = this.state.isAnimatingOpen;
    return (
      <Box
        displayInlineBlock
        backgroundColor={this.props.theme.textLight}
        styledWidth={"320px"}
        fullHeight
        onClick={() => this.props.viewState.setTopElement("HelpPanel")}
        css={`
          position: fixed;
          z-index: ${this.props.viewState.topElement === "HelpPanel"
            ? 99999
            : 110};
          transition: right 0.25s;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          right: ${isAnimatingOpen ? -320 : isExpanded ? 490 : 0}px;
        `}
      >
        <Box position="absolute" paddedRatio={3} topRight>
          <RawButton onClick={() => this.props.viewState.hideHelpPanel()}>
            <StyledIcon
              styledWidth={"16px"}
              fillColor={this.props.theme.textDark}
              opacity={0.5}
              glyph={Icon.GLYPHS.closeLight}
            />
          </RawButton>
        </Box>
        <Box
          centered
          paddedHorizontally={5}
          paddedVertically={17}
          displayInlineBlock
          css={`
            direction: ltr;
            min-width: 295px;
            padding-bottom: 0px;
          `}
        >
          <Text extraBold heading textDark>
            {t("helpPanel.menuPaneTitle")}
          </Text>
          <Spacing bottom={4} />
          <Text medium textDark highlightLinks>
            {parseCustomMarkdownToReact(
              t("helpPanel.menuPaneBody", {
                supportEmail: this.props.viewState.terria.supportEmail
              })
            )}
          </Text>
          <Spacing bottom={5} />
          <Box centered>
            <Button
              primary
              rounded
              styledMinWidth={"240px"}
              onClick={() => {
                this.props.viewState.terria.analytics?.logEvent(
                  Category.help,
                  HelpAction.takeTour
                );
                runInAction(() => {
                  this.props.viewState.hideHelpPanel();
                  this.props.viewState.setTourIndex(0);
                });
              }}
              renderIcon={() => (
                <StyledIcon
                  light
                  styledWidth={"18px"}
                  glyph={Icon.GLYPHS.tour}
                />
              )}
              textProps={{
                large: true
              }}
              css={`
                ${(p) => p.theme.addTerriaPrimaryBtnStyles(p)}
              `}
            >
              {t("helpPanel.takeTour")}
            </Button>
          </Box>
        </Box>
        <Spacing bottom={10} />
        <Box centered displayInlineBlock fullWidth styledPadding="0 26px">
          {helpItems &&
            helpItems.map((item, i) => (
              <HelpPanelItem
                key={i}
                terria={this.props.viewState.terria}
                viewState={this.props.viewState}
                content={item}
              />
            ))}
        </Box>
      </Box>
    );
  }
}

export default withTranslation()(withViewState(withTheme(HelpPanel)));
