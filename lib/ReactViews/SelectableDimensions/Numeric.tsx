import { runInAction } from "mobx";
import { FC, useState } from "react";
import CommonStrata from "../../Models/Definition/CommonStrata";
import { SelectableDimensionNumeric as SelectableDimensionNumericModel } from "../../Models/SelectableDimensions/SelectableDimensions";
import Input from "../../Styled/Input";
import { observer } from "mobx-react";

export const SelectableDimensionNumeric: FC<
  React.PropsWithChildren<{
    id: string;
    dim: SelectableDimensionNumericModel;
  }>
> = observer(({ id, dim }) => {
  const [value, setValue] = useState(dim.value?.toString());

  return (
    <Input
      styledHeight={"34px"}
      light
      border
      type="number"
      name={id}
      value={value}
      min={dim.min}
      max={dim.max}
      invalidValue={Number.isNaN(parseFloat(value ?? ""))}
      onChange={(evt) => {
        setValue(evt.target.value);
        const number = parseFloat(evt.target.value);
        if (!Number.isNaN(number)) {
          runInAction(() => dim.setDimensionValue(CommonStrata.user, number));
        }
      }}
    />
  );
});
