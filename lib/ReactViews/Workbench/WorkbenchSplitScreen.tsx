// import React, { useState } from "react";
// import styled from "styled-components";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";
import Terria from "../../Models/Terria";
import ViewerMode from "../../Models/ViewerMode";
import Box from "../../Styled/Box";
import { RawButton } from "../../Styled/Button";
import { GLYPHS, StyledIcon } from "../../Styled/Icon";
import Spacing from "../../Styled/Spacing";
import TerrainSide from "./TerrainSide";

interface IWorkbenchSplitScreenProps {
  terria: Terria;
}
const WorkbenchSplitScreen: React.FC<IWorkbenchSplitScreenProps> = observer(
  (props: IWorkbenchSplitScreenProps) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const { terria } = props;
    const isCesiumWithTerrain =
      terria.mainViewer.viewerMode === ViewerMode.Cesium &&
      terria.mainViewer.viewerOptions.useTerrain &&
      (terria.currentViewer as any)?.scene?.globe;

    if (!isCesiumWithTerrain) return null;

    return (
      <>
        <Box
          fullWidth
          column
          css={`
            background: ${theme.darkWithOverlay};
            color: ${theme.textLight};
            border-radius: 2px;
            flex-basis: 145px;
          `}
        >
          <Box
            fullWidth
            centered
            justifySpaceBetween
            css={`
              background: ${theme.colorSecondary};
              border-radius: 2px 2px 0 0;
              padding: 0 10px;
              font-weight: bold;
              font-size: 14px;
              color: ${theme.textLight};
              line-height: 34px;
            `}
          >
            <Box>{t("workbench.splitScreenMode")}</Box>
            <RawButton
              onClick={() => {
                runInAction(() => (terria.showSplitter = !terria.showSplitter));
              }}
              css={`
                display: flex;
                align-items: center;
              `}
            >
              <StyledIcon glyph={GLYPHS.close} light styledWidth={"1em"} />
            </RawButton>
          </Box>

          <Box fullWidth paddedRatio={3}>
            <TerrainSide
              terria={terria}
              spaced={false}
              buttonProps={{
                css: `border: 0;
                padding: 8px 0;
                border-radius: 3px;
                &:nth-of-type(even) {
                  border-radius: 0;
                }
              `
              }}
              activeColor={theme.colorSecondary}
            />
          </Box>
        </Box>
        <Spacing bottom={1} />
      </>
    );
  }
);

export default WorkbenchSplitScreen;
