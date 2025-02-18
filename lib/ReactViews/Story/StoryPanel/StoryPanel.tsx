import classNames from "classnames";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import { Component, RefObject, createRef, type ReactNode } from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import { useSwipeable, type SwipeableProps } from "react-swipeable";
import { DefaultTheme, withTheme } from "styled-components";
import {
  Category,
  StoryAction
} from "../../../Core/AnalyticEvents/analyticEvents";
import { animateEnd } from "../../../Core/animation";
import getPath from "../../../Core/getPath";
import TerriaError from "../../../Core/TerriaError";
import Terria from "../../../Models/Terria";
import Box from "../../../Styled/Box";
import Hr from "../../../Styled/Hr";
import { WithViewState, withViewState } from "../../Context";
import { onStoryButtonClick } from "../../Map/MenuBar/StoryButton/StoryButton";
import { Story } from "../Story";
import Styles from "../story-panel.scss";
import StoryBody from "./StoryBody";
import FooterBar from "./StoryFooterBar";
import TitleBar from "./TitleBar";

/**
 *
 * @param {any} story
 * @param {Terria} terria
 */

export async function activateStory(scene: Story, terria: Terria) {
  terria.analytics?.logEvent(
    Category.story,
    StoryAction.viewScene,
    JSON.stringify(scene)
  );

  if (scene.shareData) {
    const errors: TerriaError[] = [];
    await Promise.all(
      scene.shareData.initSources.map(async (initSource: any) => {
        try {
          await terria.applyInitData({
            initData: initSource,
            replaceStratum: true,
            canUnsetFeaturePickingState: true
          });
        } catch (e) {
          errors.push(TerriaError.from(e));
        }
      })
    );
    if (errors.length > 0) {
      terria.raiseErrorToUser(
        TerriaError.combine(errors, {
          title: { key: "story.loadSceneErrorTitle" },
          message: {
            key: "story.loadSceneErrorMessage",
            parameters: { title: scene.title ?? scene.id }
          }
        })
      );
    }
  }

  terria.workbench.items.forEach((item) => {
    terria.analytics?.logEvent(
      Category.story,
      StoryAction.datasetView,
      getPath(item)
    );
  });
}

interface Props extends WithTranslation, WithViewState {
  theme: DefaultTheme;
}

interface State {
  inView: boolean;
  isCollapsed: boolean;
}

export const Swipeable = ({
  children,
  ...props
}: { children: ReactNode } & SwipeableProps) => {
  const handlers = useSwipeable(props);

  return <div {...handlers}>{children}</div>;
};

@observer
class StoryPanel extends Component<Props, State> {
  keydownListener: EventListener | undefined;
  slideRef: RefObject<HTMLElement>;

  constructor(props: Props) {
    super(props);
    this.state = {
      isCollapsed: false,
      inView: false
    };
    this.slideRef = createRef();
  }

  componentDidMount() {
    const stories = this.props.viewState.terria.stories || [];
    if (
      this.props.viewState.currentStoryId > stories.length - 1 ||
      this.props.viewState.currentStoryId < 0
    ) {
      this.props.viewState.currentStoryId = 0;
    }
    this.activateStory(stories[this.props.viewState.currentStoryId]);

    this.slideIn();

    this.keydownListener = (e: Event) => {
      // Use else if for keydown events so only first one is recognised in case of multiple key presses
      if ((e as KeyboardEvent).key === "Escape") {
        this.exitStory();
      } else if (
        (e as KeyboardEvent).key === "ArrowRight" ||
        (e as KeyboardEvent).key === "ArrowDown"
      ) {
        if (this.props.viewState.currentStoryId + 1 !== stories.length) {
          this.goToNextStory();
        }
      } else if (
        (e as KeyboardEvent).key === "ArrowLeft" ||
        (e as KeyboardEvent).key === "ArrowUp"
      ) {
        if (this.props.viewState.currentStoryId !== 0) {
          this.goToPrevStory();
        }
      }
    };

    window.addEventListener("keydown", this.keydownListener, true);
  }

  slideIn() {
    this.setState({
      inView: true
    });
  }

  slideOut() {
    this.setState({
      inView: false
    });
  }

  toggleCollapse() {
    this.setState({
      isCollapsed: !this.state.isCollapsed
    });
  }

  onClickContainer() {
    runInAction(() => {
      this.props.viewState.topElement = "StoryPanel";
    });
  }

  componentWillUnmount() {
    if (this.keydownListener) {
      window.removeEventListener("keydown", this.keydownListener, true);
    }
  }

  navigateStory(index: number) {
    if (index < 0) {
      index = this.props.viewState.terria.stories.length - 1;
    } else if (index >= this.props.viewState.terria.stories.length) {
      index = 0;
    }
    if (index !== this.props.viewState.currentStoryId) {
      runInAction(() => {
        this.props.viewState.currentStoryId = index;
      });
      if (index < (this.props.viewState.terria.stories || []).length) {
        this.activateStory(this.props.viewState.terria.stories[index]);
      }
    }
  }

  // This is in StoryPanel and StoryBuilder
  activateStory(_story: Story | any) {
    const story = _story ? _story : this.props.viewState.terria.stories[0];
    activateStory(story, this.props.viewState.terria);
  }

  onCenterScene(story: Story) {
    activateStory(story, this.props.viewState.terria);
  }

  goToPrevStory() {
    this.navigateStory(this.props.viewState.currentStoryId - 1);
  }

  goToNextStory() {
    this.navigateStory(this.props.viewState.currentStoryId + 1);
  }

  exitStory() {
    animateEnd(this.slideRef.current).finally(() => {
      runInAction(() => {
        this.props.viewState.storyShown = false;
      });
      this.props.viewState.terria.currentViewer.notifyRepaintRequired();
    });
    this.slideOut();
  }

  render() {
    const stories = this.props.viewState.terria.stories || [];
    const story = stories[this.props.viewState.currentStoryId];

    return (
      <Swipeable
        onSwipedLeft={() => this.goToNextStory()}
        onSwipedRight={() => this.goToPrevStory()}
      >
        <Box
          className={classNames(
            this.props.viewState.topElement === "StoryPanel"
              ? "top-element"
              : ""
          )}
          centered
          fullWidth
          paddedHorizontally={4}
          position="absolute"
          onClick={() => this.onClickContainer()}
          css={`
            transition: padding, 0.2s;
            bottom: 80px;
            pointer-events: none;
            ${!this.props.viewState.storyShown && "display: none;"}
            @media (min-width: 992px) {
              ${this.props.viewState.isMapFullScreen &&
              `
                transition-delay: 0.5s;
              `}
              ${!this.props.viewState.isMapFullScreen &&
              `
                padding-left: calc(30px + ${this.props.theme.workbenchWidth}px);
                padding-right: 50px;
              `}
              bottom: 90px;
            }
          `}
        >
          <Box
            column
            rounded
            className={classNames(Styles.storyContainer, {
              [Styles.isMounted]: this.state.inView
            })}
            key={story.id}
            ref={this.slideRef as RefObject<HTMLDivElement>}
            css={`
              @media (min-width: 992px) {
                max-width: 60vw;
              }
            `}
          >
            <Box paddedHorizontally={3} paddedVertically={2.4} column>
              <TitleBar
                title={story.title}
                isCollapsed={this.state.isCollapsed}
                collapseHandler={() => this.toggleCollapse()}
                closeHandler={() => this.exitStory()}
              />
              <StoryBody isCollapsed={this.state.isCollapsed} story={story} />
            </Box>
            <Hr
              fullWidth
              size={1}
              borderBottomColor={this.props.theme.greyLighter}
            />
            <Box paddedHorizontally={3} fullWidth>
              <FooterBar
                goPrev={() => this.goToPrevStory()}
                goNext={() => this.goToNextStory()}
                jumpToStory={(index: number) => this.navigateStory(index)}
                zoomTo={() => this.onCenterScene(story)}
                currentHumanIndex={this.props.viewState.currentStoryId + 1}
                totalStories={stories.length}
                listStories={() => {
                  runInAction(() => {
                    this.props.viewState.storyShown = false;
                  });
                  onStoryButtonClick({
                    terria: this.props.viewState.terria,
                    theme: this.props.theme,
                    viewState: this.props.viewState,
                    animationDuration: 250
                  })();
                }}
              />
            </Box>
          </Box>
        </Box>
      </Swipeable>
    );
  }
}

export default withTranslation()(withViewState(withTheme(StoryPanel)));
