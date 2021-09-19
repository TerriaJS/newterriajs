import { observer } from "mobx-react";
import { FC } from "react";
import { BaseModel } from "../../../Models/Definition/Model";
import Text from "../../../Styled/Text";
import { useTranslationIfExists } from "../../../Language/languageHelpers";
import MinMaxLevelMixin from "../../../ModelMixins/MinMaxLevelMixin";
import { Spacing } from "../../../Styled/Spacing";

interface IScaleWorkbenchInfoProps {
  item: BaseModel;
}
export const ScaleWorkbenchInfo: FC<IScaleWorkbenchInfoProps> = observer(
  ({ item }: IScaleWorkbenchInfoProps) => {
    if (!MinMaxLevelMixin.isMixedInto(item) || !item.scaleWorkbenchInfo) {
      return null;
    }
    return (
      <>
        <Spacing bottom={2} />
        <Text>{useTranslationIfExists(item.scaleWorkbenchInfo)}</Text>
      </>
    );
  }
);
