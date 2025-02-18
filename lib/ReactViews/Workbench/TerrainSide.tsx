import { runInAction } from "mobx";
import { observer } from "mobx-react";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";
import SplitDirection from "terriajs-cesium/Source/Scene/SplitDirection";
import Terria from "../../Models/Terria";
import ViewerMode from "../../Models/ViewerMode";
import Box from "../../Styled/Box";
import Checkbox from "../../Styled/Checkbox/Checkbox";
import { TextSpan } from "../../Styled/Text";
import { RawButton } from "../../Styled/Button";
import { Spacing } from "../../Styled/Spacing";

const sides = {
  left: "settingPanel.terrain.left",
  both: "settingPanel.terrain.both",
  right: "settingPanel.terrain.right"
};

interface ITerrainSideProps {
  terria: Terria;
  spaced?: boolean;
  buttonProps: any;
  activeColor: string;
}

const TerrainSide: FC<React.PropsWithChildren<ITerrainSideProps>> = observer(
  (props: ITerrainSideProps) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const { terria } = props;

    const showTerrainOnSide = (side: string, event: any) => {
      if (event) {
        event.stopPropagation();
      }
      runInAction(() => {
        switch (side) {
          case sides.left:
            terria.terrainSplitDirection = SplitDirection.LEFT;
            terria.showSplitter = true;
            break;
          case sides.right:
            terria.terrainSplitDirection = SplitDirection.RIGHT;
            terria.showSplitter = true;
            break;
          case sides.both:
            terria.terrainSplitDirection = SplitDirection.NONE;
            break;
        }

        terria.currentViewer.notifyRepaintRequired();
      });
    };

    const toggleDepthTestAgainstTerrainEnabled = (event: any) => {
      event.stopPropagation();
      runInAction(() => {
        terria.depthTestAgainstTerrainEnabled =
          !terria.depthTestAgainstTerrainEnabled;
      });
      terria.currentViewer.notifyRepaintRequired();
    };

    const isCesiumWithTerrain =
      terria.mainViewer.viewerMode === ViewerMode.Cesium &&
      terria.mainViewer.viewerOptions.useTerrain &&
      (terria.currentViewer as any)?.scene?.globe;

    const supportsDepthTestAgainstTerrain = isCesiumWithTerrain;
    const depthTestAgainstTerrainEnabled =
      supportsDepthTestAgainstTerrain && terria.depthTestAgainstTerrainEnabled;

    const depthTestAgainstTerrainLabel = depthTestAgainstTerrainEnabled
      ? t("settingPanel.terrain.showUndergroundFeatures")
      : t("settingPanel.terrain.hideUndergroundFeatures");

    let currentSide = sides.both;
    if (isCesiumWithTerrain) {
      switch (terria.terrainSplitDirection) {
        case SplitDirection.LEFT:
          currentSide = sides.left;
          break;
        case SplitDirection.RIGHT:
          currentSide = sides.right;
          break;
      }
    }

    if (!isCesiumWithTerrain) return null;

    return (
      <Box padded column fullWidth>
        <TextSpan>{t("settingPanel.terrain.sideLabel")}</TextSpan>
        <Spacing bottom={1} />
        <Box
          css={`
            ${props.spaced && `gap: 6px;`}
          `}
        >
          {Object.values(sides).map((side) => (
            <RawButton
              key={side}
              onClick={(evt: any) => showTerrainOnSide(side, evt)}
              css={`
                background: ${theme.overlay};
                padding: 14px 0;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                border: 1px solid
                  ${side === currentSide
                    ? `rgba(255, 255, 255, 0.5)`
                    : `transparent`};
                ${props.buttonProps && props.buttonProps.css}
                ${props.activeColor &&
                side === currentSide &&
                `background-color: ${props.activeColor}`}
              `}
              {...props.buttonProps}
            >
              <TextSpan textLight small>
                {t(side)}
              </TextSpan>
            </RawButton>
          ))}
        </Box>
        <Spacing bottom={1} />

        {supportsDepthTestAgainstTerrain && (
          <Checkbox
            id="depthTestAgainstTerrain"
            isChecked={depthTestAgainstTerrainEnabled}
            title={depthTestAgainstTerrainLabel}
            onChange={toggleDepthTestAgainstTerrainEnabled}
          >
            <TextSpan>{t("settingPanel.terrain.hideUnderground")}</TextSpan>
          </Checkbox>
        )}
      </Box>
    );
  }
);

TerrainSide.defaultProps = {
  spaced: true
};

export default TerrainSide;
