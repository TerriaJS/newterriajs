import { observer } from "mobx-react";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import defined from "terriajs-cesium/Source/Core/defined";
import type Cesium3DTilesCatalogItem from "../../../Models/Catalog/CatalogItems/Cesium3DTilesCatalogItem";
import ViewerMode from "../../../Models/ViewerMode";
import ViewState from "../../../ReactViewModels/ViewState";
import Box from "../../../Styled/Box";
import Icon from "../../../Styled/Icon";
import Text from "../../../Styled/Text";
import MapDataCount from "../../BottomDock/MapDataCount";
import { useViewState } from "../../Context";
import parseCustomHtmlToReact from "../../Custom/parseCustomHtmlToReact";
import MapIconButton from "../../MapIconButton/MapIconButton";

const BottomLeftContainer = styled(Box)`
  position: absolute;
  bottom: 40px;
  @media (max-width: ${(props) => props.theme.mobile}px) {
    bottom: 35px;
  }
  display: flex;
`;

// Use padding to avoid other UI elements
const AttributionsContainer = styled(Text)`
  text-shadow: 0 0 2px #000000;
  padding-left: 8px;
  padding-right: 56px;
  @media (max-width: ${(props) => props.theme.mobile}px) {
    padding-right: 8px;
    padding-bottom: 32px;
  }
`;

const shouldShowPlayStoryButton = (viewState: ViewState) =>
  viewState.terria.configParameters.storyEnabled &&
  defined(viewState.terria.stories) &&
  viewState.terria.stories.length > 0 &&
  viewState.useSmallScreenInterface;

const BottomLeftBar: FC = observer(() => {
  const { t } = useTranslation();
  const theme = useTheme();
  const viewState = useViewState();

  const screenDataAttributions =
    viewState.terria.cesium?.cesiumScreenDataAttributions;

  const isNotificationActive =
    viewState.terria.notificationState.currentNotification;

  const isUsingGooglePhotorealistic3dTiles =
    viewState.terria.mainViewer.viewerMode === ViewerMode.Cesium &&
    viewState.terria.workbench.items
      .filter((i): i is Cesium3DTilesCatalogItem => i.type === "3d-tiles")
      .some(
        (i) =>
          i.url?.startsWith(
            "https://tile.googleapis.com/v1/3dtiles/root.json"
          ) && i.show
      );

  return (
    <BottomLeftContainer theme={theme}>
      <MapDataCount
        terria={viewState.terria}
        viewState={viewState}
        elementConfig={viewState.terria.elements.get("map-data-count")}
      />
      {shouldShowPlayStoryButton(viewState) ? (
        <Box paddedHorizontally={2}>
          <MapIconButton
            title={t("story.playStory")}
            neverCollapse
            iconElement={() => <Icon glyph={Icon.GLYPHS.playStory} />}
            onClick={() => viewState.runStories()}
            primary={!isNotificationActive}
          >
            {t("story.playStory")}
          </MapIconButton>
        </Box>
      ) : null}
      {/* Google Logo. Needed for Google Photorealistic 3D Tiles
       */}
      {isUsingGooglePhotorealistic3dTiles && (
        <img
          height="18px"
          style={{ paddingLeft: "8px" }}
          src="build/TerriaJS/images/google_on_non_white_hdpi.png"
        />
      )}
      {/* On screen data attributions. At the moment, this supports only Cesium viewer.
          Needed for Google Photorealistic 3D Tiles
        */}
      {!!screenDataAttributions?.length && (
        <AttributionsContainer textLight mini>
          {screenDataAttributions
            .flatMap((attributionHtml, i) => [
              <span key={attributionHtml}>
                {parseCustomHtmlToReact(attributionHtml)}
              </span>,
              <span key={`delimiter-${i}`}> • </span>
            ])
            .slice(0, -1)}
        </AttributionsContainer>
      )}
    </BottomLeftContainer>
  );
});

export default BottomLeftBar;
