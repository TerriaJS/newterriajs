import { Ref } from "react";
import { Trans, useTranslation } from "react-i18next";
import { DefaultTheme } from "styled-components";

import triggerResize from "../../../../Core/triggerResize";
import Terria from "../../../../Models/Terria";
import ViewState from "../../../../ReactViewModels/ViewState";
import Icon from "../../../../Styled/Icon";
import Text from "../../../../Styled/Text";
import Prompt from "../../../Generic/Prompt";
import { useRefForTerria } from "../../../Hooks/useRefForTerria";

import Styles from "./story-button.scss";

interface Props {
  terria: Terria;
  theme: DefaultTheme;
  viewState: ViewState;
  animationDuration: number;
}

interface ButtonProps extends Props {
  ["aria-expanded"]: boolean;
}

const STORY_BUTTON_NAME = "MenuBarStoryButton";

export const onStoryButtonClick = (props: Props) => () => {
  props.viewState.toggleStoryBuilder();
  props.terria.currentViewer.notifyRepaintRequired();
  // Allow any animations to finish, then trigger a resize.
  setTimeout(function () {
    triggerResize();
  }, props.animationDuration || 1);
  props.viewState.toggleFeaturePrompt("story", false, true);
};

const promptHtml = (hasStories: boolean) => (
  <Text textLight textAlignCenter>
    {hasStories ? (
      <Trans i18nKey="story.promptHtml1">
        <Text extraLarge>
          You can view and create stories at any time by clicking here.
        </Text>
      </Trans>
    ) : (
      <Trans i18nKey="story.promptHtml2">
        <div>
          <Text>INTRODUCING</Text>
          <Text bold extraExtraLarge styledLineHeight={"32px"}>
            Data Stories
          </Text>
          <Text medium>
            Create and share interactive stories directly from your map.
          </Text>
        </div>
      </Trans>
    )}
  </Text>
);

const StoryButton = (props: Props) => {
  const storyButtonRef: Ref<HTMLButtonElement> = useRefForTerria(
    STORY_BUTTON_NAME,
    props.viewState
  );
  const storyEnabled = props.terria.configParameters.storyEnabled;

  const dismissAction = () => {
    props.viewState.toggleFeaturePrompt("story", false, true);
  };

  const delayTime =
    storyEnabled && props.terria.stories.length > 0 ? 1000 : 2000;

  const { t } = useTranslation();

  return (
    <div>
      <button
        ref={storyButtonRef}
        className={Styles.storyBtn}
        type="button"
        onClick={onStoryButtonClick(props)}
        aria-expanded={props.viewState.storyBuilderShown}
        css={`
          ${(p: ButtonProps) =>
            p["aria-expanded"] &&
            `&:not(.foo) {
                      background: ${p.theme.colorPrimary};
                      svg {
                        fill: ${p.theme.textLight};
                      }
                    }`}
        `}
      >
        <Icon glyph={Icon.GLYPHS.story} />
        <span>{t("story.story")}</span>
      </button>
      <Prompt
        centered
        isVisible={
          storyEnabled && props.viewState.featurePrompts.indexOf("story") >= 0
        }
        content={promptHtml(props.terria.stories.length > 0)}
        displayDelay={delayTime}
        dismissText={t("story.dismissText")}
        dismissAction={dismissAction}
      />
    </div>
  );
};
export default StoryButton;
