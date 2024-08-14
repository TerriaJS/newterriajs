import { observer } from "mobx-react";
import React from "react";
import { useTranslation } from "react-i18next";
import Icon from "../../../../Styled/Icon";
import Text from "../../../../Styled/Text";
import Prompt from "../../../Generic/Prompt";
import { useViewState } from "../../../Context";

import Styles from "./help-button.scss";
import withControlledVisibility from "../../../HOCs/withControlledVisibility";

const HelpButton = observer(() => {
  const { t } = useTranslation();
  const viewState = useViewState();

  return (
    <div>
      <button
        className={Styles.helpBtn}
        onClick={(evt) => {
          evt.preventDefault();
          evt.stopPropagation();
          viewState.showHelpPanel();
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
        dismissAction={() => viewState.toggleFeaturePrompt("help", false, true)}
        caretTopOffset={-8}
        caretLeftOffset={130}
        caretSize={15}
        promptWidth={273}
        promptTopOffset={50}
        promptLeftOffset={-100}
        isVisible={viewState.featurePrompts.indexOf("help") >= 0}
      />
    </div>
  );
});

export default withControlledVisibility(HelpButton);
