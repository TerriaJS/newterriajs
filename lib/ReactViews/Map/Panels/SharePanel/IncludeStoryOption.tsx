import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Checkbox from "../../../../Styled/Checkbox";
import React from "react";
import ViewState from "../../../../ReactViewModels/ViewState";
import { observer } from "mobx-react";
import Styles from "./share-panel.scss";

interface IncludeStoryOptionProps {
  viewState: ViewState;
}

const IncludeStoryOption: React.FC<IncludeStoryOptionProps> = observer(
  props => {
    const { t } = useTranslation();

    const onChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
      props.viewState.setIncludeStoryInShare(event.target.checked);
      return;
    };

    const isChecked = props.viewState.includeStoryInShare ?? false;

    return (
      <IncludeStoryOptionDiv className={Styles.includeStoryOption}>
        <Checkbox
          textProps={{ small: true }}
          id="includeStory"
          title="Include Story in Share"
          isChecked={isChecked ?? false}
          onChange={onChangeHandler}
          className={Styles.checkbox}
        />
        <p>{t("includeStory.message")}</p>
      </IncludeStoryOptionDiv>
    );
  }
);

export default IncludeStoryOption;

const IncludeStoryOptionDiv = styled.div`
  //   position: relative;
`;
