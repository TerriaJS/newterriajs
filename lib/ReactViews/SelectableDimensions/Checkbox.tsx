import { runInAction } from "mobx";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import CommonStrata from "../../Models/Definition/CommonStrata";
import { SelectableDimensionCheckbox as SelectableDimensionCheckboxModel } from "../../Models/SelectableDimensions/SelectableDimensions";
import Checkbox from "../../Styled/Checkbox";
import Text from "../../Styled/Text";

export const SelectableDimensionCheckbox: FC<
  React.PropsWithChildren<{
    id: string;
    dim: SelectableDimensionCheckboxModel;
  }>
> = ({ id, dim }) => {
  const { t } = useTranslation();
  return (
    <Checkbox
      name={id}
      isChecked={dim.selectedId === "true"}
      onChange={(evt) =>
        runInAction(() =>
          dim.setDimensionValue(
            CommonStrata.user,
            evt.target.checked ? "true" : "false"
          )
        )
      }
    >
      <Text>
        {dim.options?.find((opt) => opt.id === dim.selectedId)?.name ??
          (dim.selectedId === "true"
            ? t("selectableDimensions.enabled")
            : t("selectableDimensions.disabled"))}
      </Text>
    </Checkbox>
  );
};
