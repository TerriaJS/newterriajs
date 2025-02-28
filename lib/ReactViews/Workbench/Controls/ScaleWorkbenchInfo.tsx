import { observer } from "mobx-react";
import { FC } from "react";
import { BaseModel } from "../../../Models/Definition/Model";
import Text from "../../../Styled/Text";
import { applyTranslationIfExists } from "../../../Language/languageHelpers";
import MinMaxLevelMixin from "../../../ModelMixins/MinMaxLevelMixin";
import { Spacing } from "../../../Styled/Spacing";
import { useTranslation } from "react-i18next";

interface IScaleWorkbenchInfoProps {
  item: BaseModel;
}
export const ScaleWorkbenchInfo: FC<IScaleWorkbenchInfoProps> = observer(
  ({ item }: IScaleWorkbenchInfoProps) => {
    const { i18n } = useTranslation();
    if (!MinMaxLevelMixin.isMixedInto(item) || !item.scaleWorkbenchInfo) {
      return null;
    }
    return (
      <>
        <Spacing bottom={2} />
        <Text>{applyTranslationIfExists(item.scaleWorkbenchInfo, i18n)}</Text>
      </>
    );
  }
);
