import createReactClass from "create-react-class";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import { forwardRef } from "react";
import { withTranslation } from "react-i18next";
import styled, { withTheme } from "styled-components";
import Icon, { StyledIcon } from "../../Styled/Icon";
import SearchBoxAndResults from "../Search/SearchBoxAndResults";
import Workbench from "../Workbench/Workbench";
import FullScreenButton from "./FullScreenButton";

import { useRefForTerria } from "../Hooks/useRefForTerria";

import Box from "../../Styled/Box";
import Spacing from "../../Styled/Spacing";
import Text from "../../Styled/Text";
import Button from "../../Styled/Button";

const BoxHelpfulHints = styled(Box)``;

const ResponsiveSpacing = styled(Box)`
  height: 110px;
  // Hardcoded px value, TODO: make it not hardcoded
  @media (max-height: 700px) {
    height: 3vh;
  }
`;

function EmptyWorkbench(props) {
  const t = props.t;
  const HelpfulHintsIcon = () => {
    return (
      <StyledIcon
        glyph={Icon.GLYPHS.bulb}
        styledWidth={"14px"}
        styledHeight={"14px"}
        light
        css={`
          padding: 2px 1px;
        `}
      />
    );
  };

  return (
    <Text large textLight>
      {/* Hardcoded top to 150px for now for very very small screens
          TODO: make it not hardcoded */}
      <Box
        column
        fullWidth
        justifySpaceBetween
        styledHeight={"calc(100vh - 150px)"}
      >
        <Box centered column>
          <ResponsiveSpacing />
          <Text large color={props.theme.textLightDimmed}>
            {t("emptyWorkbench.emptyArea")}
          </Text>
          <ResponsiveSpacing />
        </Box>
        <BoxHelpfulHints column paddedRatio={3} overflowY="auto" scroll>
          <Box left>
            <Text extraLarge bold>
              {t("emptyWorkbench.helpfulHints")}
            </Text>
          </Box>
          <Spacing bottom={4} />
          <Box>
            <HelpfulHintsIcon />
            <Spacing right={1} />
            <Text medium light>
              {t("emptyWorkbench.helpfulHintsOne")}
            </Text>
          </Box>
          <Spacing bottom={3} />
          <Box>
            <HelpfulHintsIcon />
            <Spacing right={1} />
            <Text medium light>
              {t("emptyWorkbench.helpfulHintsTwo")}
            </Text>
          </Box>
          <Spacing bottom={3} />
          <Box>
            <HelpfulHintsIcon />
            <Spacing right={1} />
            <Text medium light>
              {t("emptyWorkbench.helpfulHintsThree")}
            </Text>
          </Box>
          <ResponsiveSpacing />
        </BoxHelpfulHints>
      </Box>
    </Text>
  );
}
EmptyWorkbench.propTypes = {
  t: PropTypes.func.isRequired,
  theme: PropTypes.object.isRequired
};

const SidePanelButton = forwardRef((props, ref) => {
  const { btnText, ...rest } = props;
  return (
    <Button
      primary
      ref={ref}
      renderIcon={props.children && (() => props.children)}
      textProps={{
        large: true
      }}
      {...rest}
    >
      {btnText ? btnText : ""}
    </Button>
  );
});
SidePanelButton.displayName = "SidePanelButton"; // for some reasons lint doesn't like not having this
SidePanelButton.propTypes = {
  btnText: PropTypes.string,
  children: PropTypes.node
};

export const EXPLORE_MAP_DATA_NAME = "ExploreMapDataButton";
export const SIDE_PANEL_UPLOAD_BUTTON_NAME = "SidePanelUploadButton";

const SidePanel = observer(
  createReactClass({
    displayName: "SidePanel",

    propTypes: {
      terria: PropTypes.object.isRequired,
      viewState: PropTypes.object.isRequired,
      refForExploreMapData: PropTypes.object.isRequired,
      refForUploadData: PropTypes.object.isRequired,
      t: PropTypes.func.isRequired,
      theme: PropTypes.object.isRequired
    },

    onAddDataClicked(e) {
      e.stopPropagation();
      this.props.viewState.setTopElement("AddData");
      this.props.viewState.openAddData();
    },

    onAddLocalDataClicked(e) {
      e.stopPropagation();
      this.props.viewState.setTopElement("AddData");
      this.props.viewState.openUserData();
    },
    render() {
      const { t, theme } = this.props;
      const addData = t("addData.addDataBtnText");
      const uploadText = t("models.catalog.upload");
      return (
        <div>
          <div
            css={`
              padding: 0 5px;
              background: ${this.props.theme.dark};
            `}
          >
            <FullScreenButton
              terria={this.props.terria}
              viewState={this.props.viewState}
              minified={true}
              animationDuration={250}
              btnText={t("addData.btnHide")}
            />
            <SearchBoxAndResults
              viewState={this.props.viewState}
              terria={this.props.terria}
              placeholder={t("search.placeholder")}
            />
            <Spacing bottom={2} />
            <Box justifySpaceBetween>
              <SidePanelButton
                ref={this.props.refForExploreMapData}
                onClick={e => this.onAddDataClicked(e)}
                title={addData}
                btnText={addData}
                styledWidth={"200px"}
              >
                <StyledIcon
                  glyph={Icon.GLYPHS.add}
                  light
                  styledWidth={"20px"}
                />
              </SidePanelButton>
              <SidePanelButton
                ref={this.props.refForUploadData}
                onClick={e => this.onAddLocalDataClicked(e)}
                title={t("addData.load")}
                btnText={uploadText}
                styledWidth={"130px"}
              >
                <StyledIcon
                  glyph={Icon.GLYPHS.uploadThin}
                  light
                  styledWidth={"20px"}
                />
              </SidePanelButton>
            </Box>
            <Spacing bottom={1} />
          </div>
          <div
            css={`
              overflow: hidden;
            `}
          >
            <Choose>
              <When
                condition={
                  this.props.terria.workbench.items &&
                  this.props.terria.workbench.items.length > 0
                }
              >
                <Workbench
                  viewState={this.props.viewState}
                  terria={this.props.terria}
                />
              </When>
              <Otherwise>
                <EmptyWorkbench t={t} theme={theme} />
              </Otherwise>
            </Choose>
          </div>
        </div>
      );
    }
  })
);

// Used to create two refs for <SidePanel /> to consume, rather than
// using the withTerriaRef() HOC twice, designed for a single ref
const SidePanelWithRefs = props => {
  const refForExploreMapData = useRefForTerria(
    EXPLORE_MAP_DATA_NAME,
    props.viewState
  );
  const refForUploadData = useRefForTerria(
    SIDE_PANEL_UPLOAD_BUTTON_NAME,
    props.viewState
  );
  return (
    <SidePanel
      {...props}
      refForExploreMapData={refForExploreMapData}
      refForUploadData={refForUploadData}
    />
  );
};
SidePanelWithRefs.propTypes = {
  viewState: PropTypes.object.isRequired
};

module.exports = withTranslation()(withTheme(SidePanelWithRefs));
