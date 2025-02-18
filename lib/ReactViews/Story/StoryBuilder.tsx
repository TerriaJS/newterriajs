import { action, makeObservable, toJS } from "mobx";
import { observer } from "mobx-react";
import {
  RefObject,
  ComponentPropsWithoutRef,
  FC,
  ReactNode,
  ReactElement,
  createRef,
  Component
} from "react";
import Sortable from "react-anything-sortable";
import {
  Trans,
  WithTranslation,
  useTranslation,
  withTranslation
} from "react-i18next";
import styled, { DefaultTheme, withTheme } from "styled-components";
import combine from "terriajs-cesium/Source/Core/combine";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import dataStoriesImg from "../../../wwwroot/images/data-stories-getting-started.jpg";
import {
  Category,
  StoryAction
} from "../../Core/AnalyticEvents/analyticEvents";
import triggerResize from "../../Core/triggerResize";
import ViewState from "../../ReactViewModels/ViewState";
import Box from "../../Styled/Box";
import Button, { RawButton } from "../../Styled/Button";
import Icon, { StyledIcon } from "../../Styled/Icon";
import Spacing from "../../Styled/Spacing";
import Text, { TextSpan } from "../../Styled/Text";
import BadgeBar from "../BadgeBar";
import { WithViewState, withViewState } from "../Context";
import measureElement, { MeasureElementProps } from "../HOCs/measureElement";
import VideoGuide from "../Map/Panels/HelpPanel/VideoGuide";
import { getShareData } from "../Map/Panels/SharePanel/BuildShareLink";
import SharePanel from "../Map/Panels/SharePanel/SharePanel";
import Story from "./Story";
import StoryEditor from "./StoryEditor";
import Styles from "./story-builder.scss";

const STORY_VIDEO = "storyVideo";

export type StoryData = ViewState["terria"]["stories"][number];

interface IProps {
  isVisible?: boolean;
  animationDuration?: number;
  theme: DefaultTheme;
}

interface IState {
  editingMode: boolean;
  currentStory: StoryData | undefined;
  recaptureSuccessId: StoryData["id"] | undefined;
  clearRecaptureSuccessTimeout: (() => void) | undefined;
  showVideoGuide: boolean;
  isRemoving: boolean;
  isSharing: boolean;
  storyToRemove: StoryData | undefined;
  storyRemoveIndex: number | undefined;
  storyWithOpenMenuId: StoryData["id"] | undefined;
}

@observer
class StoryBuilder extends Component<
  IProps & MeasureElementProps & WithTranslation & WithViewState,
  IState
> {
  storiesWrapperRef = createRef<HTMLElement>();

  refToMeasure: any;

  clearRecaptureSuccessTimeout?: () => void;

  constructor(
    props: IProps & MeasureElementProps & WithTranslation & WithViewState
  ) {
    super(props);
    makeObservable(this);
    this.state = {
      editingMode: false,
      currentStory: undefined,
      recaptureSuccessId: undefined,
      clearRecaptureSuccessTimeout: undefined,
      showVideoGuide: false,
      isRemoving: false,
      isSharing: false,
      storyToRemove: undefined,
      storyRemoveIndex: undefined,
      storyWithOpenMenuId: undefined
    };
  }
  removeStory = (index: number, story?: StoryData) => {
    this.setState({
      isSharing: false,
      isRemoving: true,
      storyToRemove: story,
      storyRemoveIndex: index
    });
  };

  @action.bound
  removeAction() {
    if (this.state.storyToRemove && this.state.storyRemoveIndex !== undefined) {
      this.props.viewState.terria.stories =
        this.props.viewState.terria.stories.filter(
          (st) => st.id !== this.state.storyToRemove!.id
        );
      if (this.state.storyRemoveIndex < this.props.viewState.currentStoryId) {
        this.props.viewState.currentStoryId -= 1;
      }
    } else {
      this.removeAllStories();
    }
    this.setState({
      storyToRemove: undefined,
      storyRemoveIndex: undefined
    });
  }

  toggleRemoveDialog = () => {
    this.setState({
      isSharing: false,
      isRemoving: !this.state.isRemoving,
      storyToRemove: undefined,
      storyRemoveIndex: undefined
    });
  };

  @action.bound
  removeAllStories() {
    this.props.viewState.terria.stories = [];
  }

  @action.bound
  onSave(_story: StoryData) {
    const story = {
      title: _story.title,
      text: _story.text,
      id: _story.id ? _story.id : createGuid()
    };

    this.props.viewState.terria.analytics?.logEvent(
      Category.story,
      StoryAction.saveStory,
      JSON.stringify(story)
    );

    const storyIndex = (this.props.viewState.terria.stories || []).findIndex(
      (story) => story.id === _story.id
    );

    if (storyIndex >= 0) {
      const oldStory = this.props.viewState.terria.stories[storyIndex];
      // replace the old story, we need to replace the stories array so that
      // it is observable
      this.props.viewState.terria.stories = [
        ...this.props.viewState.terria.stories.slice(0, storyIndex),
        combine(story, oldStory),
        ...this.props.viewState.terria.stories.slice(storyIndex + 1)
      ];
    } else {
      this.captureStory(story);
    }

    this.setState({
      editingMode: false
    });
  }

  @action
  captureStory(
    story: Omit<StoryData, "shareData"> & { shareData?: StoryData["shareData"] }
  ) {
    const shareData = toJS(
      getShareData(this.props.viewState.terria, this.props.viewState, {
        includeStories: false
      })
    );
    this.props.viewState.terria.stories.push({ ...story, shareData });
  }

  @action
  recaptureScene(story: StoryData) {
    const { t } = this.props;
    this.closeShareRemoving();
    this.clearRecaptureSuccessTimeout?.();
    const storyIndex = (this.props.viewState.terria.stories || []).findIndex(
      (st) => st.id === story.id
    );
    if (storyIndex >= 0) {
      story.shareData = JSON.parse(
        JSON.stringify(
          getShareData(this.props.viewState.terria, this.props.viewState, {
            includeStories: false
          })
        )
      );
      this.props.viewState.terria.stories = [
        ...this.props.viewState.terria.stories.slice(0, storyIndex),
        story,
        ...this.props.viewState.terria.stories.slice(storyIndex + 1)
      ];
      this.setState({
        recaptureSuccessId: story.id
      });

      const timeout = setTimeout(this.resetReCaptureStatus, 2000);
      this.clearRecaptureSuccessTimeout = () => clearTimeout(timeout);
    } else {
      throw new Error(t("story.doesNotExist"));
    }
  }

  resetReCaptureStatus = () => {
    this.setState({
      recaptureSuccessId: undefined
    });
  };

  closeShareRemoving = () => {
    this.setState({
      isRemoving: false,
      isSharing: false
    });
  };

  runStories = () => {
    this.closeShareRemoving();
    this.props.viewState.runStories();
  };

  @action
  editStory(story: StoryData) {
    this.closeShareRemoving();
    this.props.viewState.storyShown = false;
    this.setState({
      editingMode: true,
      currentStory: story
    });
  }

  @action
  viewStory(index: number) {
    this.closeShareRemoving();
    this.props.viewState.currentStoryId = index;
    this.runStories();
  }

  @action.bound
  onSort(
    sortedArray: StoryData[],
    _currentDraggingSortData: any,
    _currentDraggingIndex: any
  ) {
    this.props.viewState.terria.stories = sortedArray;
  }

  componentWillUnmount() {
    this.clearRecaptureSuccessTimeout?.();
  }

  renderIntro() {
    const { t } = this.props;
    return (
      <Box column>
        <VideoGuide
          viewState={this.props.viewState}
          videoLink={
            this.props.viewState.terria.configParameters.storyVideo?.videoUrl ||
            "https://www.youtube-nocookie.com/embed/fbiQawV8IYY"
          }
          background={dataStoriesImg}
          videoName={STORY_VIDEO}
        />
        <StoryButton
          title={t("story.gettingStartedTitle")}
          btnText={t("story.gettingStarted")}
          onClick={() => {
            this.props.viewState.setVideoGuideVisible(STORY_VIDEO);
          }}
        >
          <StyledIcon glyph={Icon.GLYPHS.play} light styledWidth={"20px"} />
        </StoryButton>
        <Spacing bottom={2} />
        <CaptureScene
          disabled={this.state.isRemoving}
          onClickCapture={this.onClickCapture}
        />
      </Box>
    );
  }

  toggleSharePanel = () => {
    this.setState({
      isRemoving: false,
      isSharing: !this.state.isSharing
    });
  };

  renderPlayShare() {
    const { t } = this.props;
    return (
      <Box justifySpaceBetween>
        <StoryButton
          fullWidth
          disabled={this.state.editingMode}
          title={t("story.preview")}
          btnText={t("story.play")}
          onClick={this.runStories}
        >
          <StyledIcon
            glyph={Icon.GLYPHS.playStory}
            light
            styledWidth={"20px"}
          />
        </StoryButton>
        <Spacing right={1} />
        <SharePanel
          storyShare
          btnDisabled={this.state.editingMode}
          terria={this.props.viewState.terria}
          viewState={this.props.viewState}
          modalWidth={(this.props.widthFromMeasureElementHOC ?? 100) - 22}
          onUserClick={this.toggleSharePanel}
        />
      </Box>
    );
  }

  openMenu(storyId: StoryData["id"] | undefined) {
    this.setState({
      storyWithOpenMenuId: storyId
    });
  }

  renderStories() {
    const { t, i18n } = this.props;
    const stories = this.props.viewState.terria.stories || [];
    const storyName = this.state.storyToRemove
      ? this.state.storyToRemove.title.length
        ? this.state.storyToRemove.title
        : t("story.untitledScene")
      : "";
    return (
      <>
        <BadgeBar
          label={t("story.badgeBarLabel")}
          badge={this.props.viewState.terria.stories.length}
        >
          <RawButton
            type="button"
            onClick={this.toggleRemoveDialog}
            textLight
            className={Styles.removeButton}
          >
            <Icon glyph={Icon.GLYPHS.remove} /> {t("story.removeAllStories")}
          </RawButton>
        </BadgeBar>
        <Spacing bottom={2} />
        <Box column paddedHorizontally={2} flex={1} styledMinHeight="0">
          {this.state.isRemoving && (
            <RemoveDialog
              theme={this.props.theme}
              text={
                this.state.storyToRemove ? (
                  <Text textLight large>
                    <Trans i18nKey="story.removeStoryDialog" i18n={i18n}>
                      Are you sure you wish to delete
                      <TextSpan textLight large bold>
                        {{ storyName }}
                      </TextSpan>
                      ?
                    </Trans>
                  </Text>
                ) : (
                  <Text textLight large>
                    {t("story.removeAllStoriesDialog", {
                      count: this.props.viewState.terria.stories.length
                    })}
                  </Text>
                )
              }
              onConfirm={this.removeAction}
              closeDialog={this.toggleRemoveDialog}
            />
          )}
          <Box
            column
            styledHeight="100%"
            css={`
              ${(this.state.isRemoving || this.state.isSharing) &&
              `opacity: 0.3`}
            `}
          >
            <Box
              column
              scroll
              overflowY={"auto"}
              styledMaxHeight="100%"
              ref={this.storiesWrapperRef as RefObject<HTMLDivElement>}
              css={`
                margin-right: -10px;
              `}
            >
              <Sortable
                onSort={this.onSort}
                direction="vertical"
                dynamic
                css={`
                  margin-right: 10px;
                `}
              >
                {stories.map((story, index) => (
                  <Story
                    key={`${story.id}`}
                    story={story}
                    sortData={story}
                    deleteStory={() => this.removeStory(index, story)}
                    recaptureStory={() => this.recaptureScene(story)}
                    recaptureStorySuccessful={Boolean(
                      story.id === this.state.recaptureSuccessId
                    )}
                    viewStory={() => this.viewStory(index)}
                    menuOpen={this.state.storyWithOpenMenuId === story.id}
                    openMenu={() => this.openMenu(story.id)}
                    closeMenu={() => this.openMenu(undefined)}
                    editStory={() => this.editStory(story)}
                    parentRef={this.storiesWrapperRef}
                  />
                ))}
              </Sortable>
            </Box>
            <Spacing bottom={2} />
            <CaptureScene
              disabled={this.state.isRemoving}
              onClickCapture={this.onClickCapture}
            />
            <Spacing bottom={2} />
          </Box>
        </Box>
      </>
    );
  }

  onClickCapture = () => {
    this.setState({
      editingMode: true,
      currentStory: undefined
    });
  };

  hideStoryBuilder = () => {
    this.props.viewState.toggleStoryBuilder();
    this.props.viewState.terria.currentViewer.notifyRepaintRequired();
    // Allow any animations to finish, then trigger a resize.
    setTimeout(function () {
      triggerResize();
    }, this.props.animationDuration || 1);
    this.props.viewState.toggleFeaturePrompt("story", false, true);
  };

  render() {
    const { t } = this.props;
    const hasStories = this.props.viewState.terria.stories.length > 0;
    return (
      <Panel
        ref={(component: HTMLElement) => (this.refToMeasure = component)}
        isVisible={this.props.isVisible}
        isHidden={!this.props.isVisible}
        charcoalGreyBg
        column
      >
        <Box right>
          <RawButton
            css={`
              padding: 15px;
            `}
            onClick={this.hideStoryBuilder}
          >
            <StyledIcon
              styledWidth={"16px"}
              fillColor={this.props.theme.textLightDimmed}
              opacity={0.5}
              glyph={Icon.GLYPHS.closeLight}
            />
          </RawButton>
        </Box>
        <Box centered paddedHorizontally={2} displayInlineBlock>
          <Text bold extraExtraLarge textLight>
            {t("story.panelTitle")}
          </Text>
          <Spacing bottom={2} />
          <Text medium color={this.props.theme.textLightDimmed} highlightLinks>
            {t("story.panelBody")}
          </Text>
          <Spacing bottom={3} />
          {!hasStories && this.renderIntro()}
          {hasStories && this.renderPlayShare()}
        </Box>
        <Spacing bottom={2} />
        {hasStories && this.renderStories()}
        {this.state.editingMode && (
          <StoryEditor
            removeStory={this.removeStory}
            exitEditingMode={() => this.setState({ editingMode: false })}
            story={this.state.currentStory}
            saveStory={this.onSave}
            terria={this.props.viewState.terria}
          />
        )}
      </Panel>
    );
  }
}

type PanelProps = ComponentPropsWithoutRef<typeof Box> & {
  isVisible?: boolean;
  isHidden?: boolean;
};

const Panel = styled(Box)<PanelProps>`
  transition: all 0.25s;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  width: 320px;
  min-width: 320px;
  height: 100vh;
  ${(props) =>
    props.isVisible &&
    `
    visibility: visible;
    margin-right: 0;
  `}
  ${(props) =>
    props.isHidden &&
    `
    visibility: hidden;
    margin-right: -100%;
  `}
`;

interface CaptureSceneProps {
  onClickCapture: () => void;
  disabled?: boolean;
}

const CaptureScene: FC<React.PropsWithChildren<CaptureSceneProps>> = (
  props
) => {
  const { t } = useTranslation();
  return (
    <StoryButton
      title={t("story.captureSceneTitle")}
      btnText={t("story.captureScene")}
      onClick={props.onClickCapture}
      disabled={props.disabled}
      fullWidth
    >
      <StyledIcon glyph={Icon.GLYPHS.story} light styledWidth={"20px"} />
    </StoryButton>
  );
};

type StoryButtonProps = ComponentPropsWithoutRef<typeof Button> & {
  btnText: string;
  children: ReactNode;
};

export const StoryButton: FC<React.PropsWithChildren<StoryButtonProps>> = (
  props
) => {
  const { btnText, ...rest } = props;
  return (
    <Button
      primary
      renderIcon={props.children && (() => props.children)}
      textProps={{
        large: true
      }}
      {...rest}
    >
      {btnText ? btnText : ""}
    </Button>
  );
};

interface RemoveDialogProps {
  theme: DefaultTheme;
  text: ReactElement;
  onConfirm: () => void;
  closeDialog: () => void;
}

const RemoveDialog: FC<React.PropsWithChildren<RemoveDialogProps>> = (
  props
) => {
  const { t } = useTranslation();
  return (
    <Box
      backgroundColor={props.theme.darkWithOverlay}
      position="absolute"
      rounded
      paddedVertically={3}
      paddedHorizontally={2}
      column
      css={`
        width: calc(100% - 20px);
      `}
    >
      {props.text}
      <Spacing bottom={2} />
      <Box>
        <Button
          denyButton
          rounded
          fullWidth
          textProps={{
            large: true,
            semiBold: true
          }}
          onClick={props.closeDialog}
        >
          {t("general.cancel")}
        </Button>
        <Spacing right={2} />
        <Button
          primary
          fullWidth
          textProps={{
            large: true,
            semiBold: true
          }}
          onClick={() => {
            props.onConfirm();
            props.closeDialog();
          }}
        >
          {t("general.confirm")}
        </Button>
      </Box>
    </Box>
  );
};

export default withViewState(
  withTranslation()(withTheme(measureElement(StoryBuilder)))
);
