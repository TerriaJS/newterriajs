import { observer } from "mobx-react";
import PropTypes from "prop-types";
import { Component } from "react";
import { withTranslation } from "react-i18next";
import styled, { withTheme } from "styled-components";
import {
  Category,
  HelpAction
} from "../../../../Core/AnalyticEvents/analyticEvents";
import { isJsonString } from "../../../../Core/Json";
import Icon, { StyledIcon } from "../../../../Styled/Icon";
import Text from "../../../../Styled/Text";
import { applyTranslationIfExists } from "../../../../Language/languageHelpers";
import HelpVideoPanel from "./HelpVideoPanel";

@observer
class HelpPanelItem extends Component {
  static displayName = "HelpPanelItem";

  static propTypes = {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    content: PropTypes.object.isRequired,
    theme: PropTypes.object,
    t: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired
  };

  render() {
    const { i18n } = this.props;

    const itemSelected =
      this.props.viewState.selectedHelpMenuItem === this.props.content.itemName;

    // `content.icon` is user defined and can possibly force the UI to lookup a
    // nonexistant icon.
    const title = isJsonString(this.props.content.title)
      ? applyTranslationIfExists(this.props.content.title, i18n)
      : "";
    const paneMode = this.props.content.paneMode;
    const opensInPanel = paneMode !== "externalLink";
    const iconGlyph = opensInPanel
      ? Icon.GLYPHS.right
      : Icon.GLYPHS.externalLink;
    return (
      <div>
        <MenuButton
          isSelected={itemSelected}
          role={paneMode === "externalLink" ? "link" : undefined}
          onClick={() => {
            this.props.terria.analytics?.logEvent(
              Category.help,
              HelpAction.itemSelected,
              title
            );
            if (opensInPanel) {
              this.props.viewState.selectHelpMenuItem(
                this.props.content.itemName
              );
            } else if (paneMode === "externalLink" && this.props.content.url) {
              window.open(this.props.content.url);
            }
          }}
        >
          <MenuItemText>{title}</MenuItemText>
          <StyledIcon
            styledWidth={"12px"}
            fillColor={this.props.theme.textLightDimmed}
            glyph={iconGlyph}
          />
        </MenuButton>
        {opensInPanel && (
          <HelpVideoPanel
            terria={this.props.terria}
            viewState={this.props.viewState}
            content={this.props.content}
            itemString={this.props.content.itemName}
            paneMode={this.props.content.paneMode}
            markdownContent={this.props.content.markdownText}
            videoUrl={
              isJsonString(this.props.content.videoUrl)
                ? applyTranslationIfExists(this.props.content.videoUrl, i18n)
                : undefined
            }
            placeholderImage={
              isJsonString(this.props.content.placeholderImage)
                ? applyTranslationIfExists(
                    this.props.content.placeholderImage,
                    i18n
                  )
                : undefined
            }
            videoCoverImageOpacity={this.props.content.videoCoverImageOpacity}
          />
        )}
      </div>
    );
  }
}

const MenuButton = styled.button`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 16px 0;
  border: 0;
  border-bottom: 1px solid #ddd;
  background: transparent;

  &:hover {
    color: ${(p) => p.theme.textBlack};
    & ${StyledIcon} {
      fill: ${(p) => p.theme.textBlack};
    }
  }

  color: ${(p) => (p.isSelected ? p.theme.textBlack : p.theme.textDark)};
  & ${StyledIcon} {
    fill: ${(p) => (p.isSelected ? p.theme.textBlack : p.theme.textDark)};
  }
`;

const MenuItemText = styled(Text).attrs({
  semiBold: true,
  large: true
})`
  padding-right: 25px;
  padding-left: 5px;
  text-align: left;
`;

export default withTranslation()(withTheme(HelpPanelItem));
