import { observer } from "mobx-react";
import React, { FC } from "react";
import { useTranslation } from "react-i18next";
import defined from "terriajs-cesium/Source/Core/defined";
import ViewState from "../../../ReactViewModels/ViewState";
import Box from "../../../Styled/Box";
import Icon from "../../../Styled/Icon";
import { useViewState } from "../../Context";
import MapIconButton from "../../MapIconButton/MapIconButton";

const BottomLeftContainer = (props: { children: React.ReactNode }) => (
  <Box
    justifySpaceBetween
    css={`
      display: flex;
    `}
  >
    {props.children}
  </Box>
);

const shouldShowPlayStoryButton = (viewState: ViewState) =>
  viewState.terria.configParameters.storyEnabled &&
  defined(viewState.terria.stories) &&
  viewState.terria.stories.length > 0 &&
  viewState.useSmallScreenInterface;

const BottomLeftBar: FC = observer(() => {
  const { t } = useTranslation();
  const viewState = useViewState();

  const isNotificationActive =
    viewState.terria.notificationState.currentNotification;

  return (
    <BottomLeftContainer>
      {/* <MapDataCount
        terria={viewState.terria}
        viewState={viewState}
        elementConfig={viewState.terria.elements.get("map-data-count")}
      /> */}
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
    </BottomLeftContainer>
  );
});

export default BottomLeftBar;
