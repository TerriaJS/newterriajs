import { action } from "mobx";
import { observer } from "mobx-react";
import Slider from "rc-slider";
import {
  ChangeEvent,
  ComponentProps,
  FC,
  MouseEvent,
  Ref,
  useState
} from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import SplitDirection from "terriajs-cesium/Source/Scene/SplitDirection";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import Cesium from "../../../Models/Cesium";
import { BaseModel } from "../../../Models/Definition/Model";
import ViewerMode, {
  MapViewers,
  setViewerMode
} from "../../../Models/ViewerMode";
import Box from "../../../Styled/Box";
import Button, { RawButton } from "../../../Styled/Button";
import Checkbox from "../../../Styled/Checkbox";
import { GLYPHS, StyledIcon } from "../../../Styled/Icon";
import Spacing from "../../../Styled/Spacing";
import Text, { TextSpan } from "../../../Styled/Text";
import { useViewState } from "../../Context";
import { useRefForTerria } from "../../Hooks/useRefForTerria";
import MenuPanel from "../../StandardUserInterface/customizable/MenuPanel";
import Styles from "./setting-panel.scss";

const sides = {
  left: "settingPanel.terrain.left",
  both: "settingPanel.terrain.both",
  right: "settingPanel.terrain.right"
};

const SettingPanel: FC = observer(() => {
  const { t } = useTranslation();
  const viewState = useViewState();
  const { terria } = viewState;
  const settingButtonRef: Ref<HTMLButtonElement> = useRefForTerria(
    SETTING_PANEL_NAME,
    viewState
  );
  const [hoverBaseMap, setHoverBaseMap] = useState<string | null>(null);

  const activeMapName = hoverBaseMap
    ? hoverBaseMap
    : terria.mainViewer.baseMap
    ? (terria.mainViewer.baseMap as any).name
    : "(None)";

  const selectBaseMap = (
    baseMap: BaseModel,
    event: MouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();
    if (!MappableMixin.isMixedInto(baseMap)) return;

    terria.mainViewer.setBaseMap(baseMap);

    // We store the user's chosen basemap for future use, but it's up to the instance to decide
    // whether to use that at start up.
    if (baseMap) {
      const baseMapId = baseMap.uniqueId;
      if (baseMapId) {
        terria.setLocalProperty("basemap", baseMapId);
      }
    }
  };

  const mouseEnterBaseMap = (baseMap: any) => {
    setHoverBaseMap(baseMap.item?.name);
  };

  const mouseLeaveBaseMap = () => {
    setHoverBaseMap(null);
  };

  const selectViewer = action(
    (viewer: keyof typeof MapViewers, event: MouseEvent<HTMLButtonElement>) => {
      const mainViewer = terria.mainViewer;
      event.stopPropagation();
      showTerrainOnSide(sides.both, undefined);
      setViewerMode(viewer, mainViewer);
      // We store the user's chosen viewer mode for future use.
      terria.setLocalProperty("viewermode", viewer);
      terria.currentViewer.notifyRepaintRequired();
    }
  );

  const showTerrainOnSide = action(
    (side: any, event?: MouseEvent<HTMLButtonElement>) => {
      event?.stopPropagation();

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
    }
  );

  const toggleDepthTestAgainstTerrainEnabled = action(
    (event: ChangeEvent<HTMLInputElement>) => {
      event.stopPropagation();
      terria.depthTestAgainstTerrainEnabled =
        !terria.depthTestAgainstTerrainEnabled;
      terria.currentViewer.notifyRepaintRequired();
    }
  );

  const onBaseMaximumScreenSpaceErrorChange = (bmsse: number) => {
    terria.setBaseMaximumScreenSpaceError(bmsse);
    terria.setLocalProperty("baseMaximumScreenSpaceError", bmsse.toString());
  };

  const toggleUseNativeResolution = () => {
    terria.setUseNativeResolution(!terria.useNativeResolution);
    terria.setLocalProperty("useNativeResolution", terria.useNativeResolution);
  };

  if (!terria.mainViewer) {
    return null;
  }

  const qualityLabels = {
    0: t("settingPanel.qualityLabels.maximumPerformance"),
    1: t("settingPanel.qualityLabels.balancedPerformance"),
    2: t("settingPanel.qualityLabels.lowerPerformance")
  };

  const currentViewer =
    terria.mainViewer.viewerMode === ViewerMode.Cesium
      ? terria.mainViewer.viewerOptions.useTerrain
        ? "3d"
        : "3dsmooth"
      : "2d";

  const useNativeResolution = terria.useNativeResolution;
  const nativeResolutionLabel = t("settingPanel.nativeResolutionLabel", {
    resolution1: useNativeResolution
      ? t("settingPanel.native")
      : t("settingPanel.screen"),
    resolution2: useNativeResolution
      ? t("settingPanel.screen")
      : t("settingPanel.native")
  });

  const dropdownTheme = {
    inner: Styles.dropdownInner,
    icon: "map"
  };

  const isCesiumWithTerrain =
    terria.mainViewer.viewerMode === ViewerMode.Cesium &&
    terria.mainViewer.viewerOptions.useTerrain &&
    terria.currentViewer &&
    terria.currentViewer instanceof Cesium &&
    terria.currentViewer.scene &&
    terria.currentViewer.scene.globe;

  const supportsDepthTestAgainstTerrain = isCesiumWithTerrain;
  const depthTestAgainstTerrainEnabled =
    supportsDepthTestAgainstTerrain && terria.depthTestAgainstTerrainEnabled;

  const depthTestAgainstTerrainLabel = depthTestAgainstTerrainEnabled
    ? t("settingPanel.terrain.showUndergroundFeatures")
    : t("settingPanel.terrain.hideUndergroundFeatures");

  if (
    terria.configParameters.useCesiumIonTerrain ||
    terria.configParameters.cesiumTerrainUrl
  ) {
    MapViewers["3d"].available = true;
  }

  const supportsSide = isCesiumWithTerrain;

  let currentSide = sides.both;
  if (supportsSide) {
    switch (terria.terrainSplitDirection) {
      case SplitDirection.LEFT:
        currentSide = sides.left;
        break;
      case SplitDirection.RIGHT:
        currentSide = sides.right;
        break;
    }
  }

  const timelineStack = terria.timelineStack;

  const alwaysShowTimelineLabel = timelineStack.alwaysShowingTimeline
    ? t("settingPanel.timeline.alwaysShowLabel")
    : t("settingPanel.timeline.hideLabel");

  return (
    <MenuPanel
      //@ts-expect-error - not yet ready to tackle tsfying MenuPanel
      theme={dropdownTheme}
      btnRef={settingButtonRef}
      btnTitle={t("settingPanel.btnTitle")}
      btnText={t("settingPanel.btnText")}
      viewState={viewState}
      smallScreen={viewState.useSmallScreenInterface}
    >
      <Box padded column>
        <Box paddedVertically={1}>
          <Text as="label">{t("settingPanel.mapView")}</Text>
        </Box>
        <FlexGrid gap={1} elementsNo={3}>
          {Object.entries(MapViewers).map(([key, viewerMode]) => (
            <SettingsButton
              key={key}
              isActive={key === currentViewer}
              onClick={(event: any) => selectViewer(key as any, event)}
            >
              <Text mini>{t(viewerMode.label)}</Text>
            </SettingsButton>
          ))}
        </FlexGrid>
        {!!supportsSide && (
          <>
            <Spacing bottom={2} />
            <Box column>
              <Box paddedVertically={1}>
                <Text as="label">{t("settingPanel.terrain.sideLabel")}</Text>
              </Box>
              <FlexGrid gap={1} elementsNo={3}>
                {Object.values(sides).map((side: any) => (
                  <SettingsButton
                    key={side}
                    isActive={side === currentSide}
                    onClick={(event: any) => showTerrainOnSide(side, event)}
                  >
                    <Text mini>{t(side)}</Text>
                  </SettingsButton>
                ))}
              </FlexGrid>
            </Box>
            {!!supportsDepthTestAgainstTerrain && (
              <>
                <Spacing bottom={2} />
                <Checkbox
                  textProps={{ small: true }}
                  id="depthTestAgainstTerrain"
                  title={depthTestAgainstTerrainLabel}
                  isChecked={depthTestAgainstTerrainEnabled}
                  onChange={toggleDepthTestAgainstTerrainEnabled}
                >
                  <TextSpan>
                    {t("settingPanel.terrain.hideUnderground")}
                  </TextSpan>
                </Checkbox>
              </>
            )}
          </>
        )}
        <>
          <Spacing bottom={2} />
          <Box column>
            <Box paddedVertically={1}>
              <Text as="label">{t("settingPanel.baseMap")}</Text>
            </Box>
            <Box paddedVertically={1}>
              <Text as="label" mini>
                {activeMapName}
              </Text>
            </Box>
            <FlexGrid gap={1} elementsNo={4}>
              {terria.baseMapsModel.baseMapItems.map((baseMap) => (
                <StyledBasemapButton
                  key={baseMap.item?.uniqueId}
                  isActive={baseMap.item === terria.mainViewer.baseMap}
                  onClick={(event) => selectBaseMap(baseMap.item, event)}
                  onMouseEnter={() => mouseEnterBaseMap(baseMap)}
                  onMouseLeave={mouseLeaveBaseMap}
                  onFocus={() => mouseEnterBaseMap(baseMap)}
                >
                  {baseMap.item === terria.mainViewer.baseMap ? (
                    <Box position="absolute" topRight>
                      <StyledIcon
                        light
                        glyph={GLYPHS.selected}
                        styledWidth={"22px"}
                      />
                    </Box>
                  ) : null}
                  <StyledImage
                    fullWidth
                    alt={baseMap.item ? (baseMap.item as any).name : ""}
                    src={baseMap.image}
                  />
                </StyledBasemapButton>
              ))}
            </FlexGrid>
          </Box>
        </>
        <>
          <Spacing bottom={2} />
          <Box column>
            <Box paddedVertically={1}>
              <Text as="label">{t("settingPanel.timeline.title")}</Text>
            </Box>
            <Checkbox
              textProps={{ small: true }}
              id="alwaysShowTimeline"
              isChecked={timelineStack.alwaysShowingTimeline}
              title={alwaysShowTimelineLabel}
              onChange={() => {
                timelineStack.setAlwaysShowTimeline(
                  !timelineStack.alwaysShowingTimeline
                );
              }}
            >
              <TextSpan>{t("settingPanel.timeline.alwaysShow")}</TextSpan>
            </Checkbox>
          </Box>
        </>
        {terria.mainViewer.viewerMode !== ViewerMode.Leaflet && (
          <>
            <Spacing bottom={2} />
            <Box column>
              <Box paddedVertically={1}>
                <Text as="label">{t("settingPanel.imageOptimisation")}</Text>
              </Box>
              <Checkbox
                textProps={{ small: true }}
                id="mapUseNativeResolution"
                isChecked={useNativeResolution}
                title={nativeResolutionLabel}
                onChange={() => toggleUseNativeResolution()}
              >
                <TextSpan>{t("settingPanel.nativeResolutionHeader")}</TextSpan>
              </Checkbox>
              <Spacing bottom={2} />
              <Box paddedVertically={1}>
                <Text as="label">{t("settingPanel.mapQuality")}</Text>
              </Box>
              <Box verticalCenter>
                <Text mini>{t("settingPanel.qualityLabel")}</Text>
                <Slider
                  min={1}
                  max={3}
                  step={0.1}
                  value={terria.baseMaximumScreenSpaceError}
                  onChange={(val) => onBaseMaximumScreenSpaceErrorChange(val)}
                  marks={{ 2: "" }}
                  aria-valuetext={qualityLabels}
                  css={`
                    margin: 0 10px;
                    margin-top: 5px;
                  `}
                />
                <Text mini>{t("settingPanel.performanceLabel")}</Text>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </MenuPanel>
  );
});

export const SETTING_PANEL_NAME = "MenuBarMapSettingsButton";
export default SettingPanel;

type IFlexGrid = {
  gap: number;
  elementsNo: number;
};

const FlexGrid = styled(Box).attrs({ flexWrap: true })<IFlexGrid>`
  gap: ${(props) => props.gap * 5}px;
  > * {
    flex: ${(props) => `1 0 ${getCalcWidth(props.elementsNo, props.gap)}`};
    max-width: ${(props) => getCalcWidth(props.elementsNo, props.gap)};
  }
`;
const getCalcWidth = (elementsNo: number, gap: number) =>
  `calc(${100 / elementsNo}% - ${gap * 5}px)`;

type IButtonProps = {
  isActive: boolean;
};

const SettingsButton = styled(Button)<IButtonProps>`
  background-color: ${(props) => props.theme.overlay};
  border: 1px solid
    ${(props) => (props.isActive ? "rgba(255, 255, 255, 0.5)" : "transparent")};
`;

const StyledBasemapButton = styled(RawButton)<IButtonProps>`
  border-radius: 4px;
  position: relative;
  border: 2px solid
    ${(props) =>
      props.isActive ? props.theme.turquoiseBlue : "rgba(255, 255, 255, 0.5)"};
`;

const StyledImage = styled(Box).attrs({
  as: "img"
})<ComponentProps<"img">>`
  border-radius: inherit;
`;
