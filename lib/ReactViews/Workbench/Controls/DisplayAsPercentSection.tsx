import * as React from "react";
import { useTranslation } from "react-i18next";
import Checkbox from "./../../../Styled/Checkbox/Checkbox";
import { useTheme } from "styled-components";
import Spacing from "../../../Styled/Spacing";
import { TextSpan } from "../../../Styled/Text";

interface IDisplayAsPercentSection {
  item: any;
}

const DisplayAsPercentSection: React.FC<
  React.PropsWithChildren<IDisplayAsPercentSection>
> = (props: IDisplayAsPercentSection) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const togglePercentage = () => {
    props.item.displayPercent = !props.item.displayPercent;
  };

  if (!props.item.canDisplayPercent) {
    return null;
  }

  return (
    <>
      <Spacing bottom={2} />
      <Checkbox
        id="workbenchDisplayPercent"
        isChecked={props.item.displayPercent}
        onChange={togglePercentage}
      >
        <TextSpan>{t("workbench.displayPercent")}</TextSpan>
      </Checkbox>
    </>
  );
};
DisplayAsPercentSection.displayName = "DisplayAsPercentSection";

export default DisplayAsPercentSection;
