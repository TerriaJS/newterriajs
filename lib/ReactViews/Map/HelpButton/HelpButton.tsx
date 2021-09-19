import { useTranslation } from "react-i18next";

import ViewState from "../../../ReactViewModels/ViewState";
import Icon from "../../../Styled/Icon";
import Text from "../../../Styled/Text";
import Prompt from "../../Generic/Prompt";

import Styles from "./help-button.scss";
import { runInAction } from "mobx";

interface Props {
  viewState: ViewState;
}

export default (props: Props) => {
  const { t } = useTranslation();

  return (
    <div>
      <button
        className={Styles.helpBtn}
        onClick={evt => {
          evt.preventDefault();
          evt.stopPropagation();
          props.viewState.showHelpPanel();
        }}
      >
        <Icon glyph={Icon.GLYPHS.helpThick} />
        <span>{t("helpPanel.btnText")}</span>
      </button>
      <Prompt
        content={
          <div>
            <Text bold extraLarge textLight>
              {t("helpPanel.promptMessage")}
            </Text>
          </div>
        }
        displayDelay={500}
        dismissText={t("helpPanel.dismissText")}
        dismissAction={() => {
          runInAction(() =>
            props.viewState.toggleFeaturePrompt("help", false, true)
          );
        }}
        caretTopOffset={-8}
        caretLeftOffset={130}
        caretSize={15}
        promptWidth={273}
        promptTopOffset={50}
        promptLeftOffset={-100}
        isVisible={props.viewState.featurePrompts.indexOf("help") >= 0}
      />
    </div>
  );
};
