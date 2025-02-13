import i18next from "i18next";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import ReactSelect from "react-select";
import ReactSelectCreatable from "react-select/creatable";
import { useTheme } from "styled-components";
import isDefined from "../../Core/isDefined";
import CommonStrata from "../../Models/Definition/CommonStrata";
import {
  SelectableDimensionEnum as SelectableDimensionEnumModel,
  SelectableDimensionMultiEnum as SelectableDimensionEnumMultiModel
} from "../../Models/SelectableDimensions/SelectableDimensions";

export const SelectableDimensionEnum: React.FC<{
  id: string;
  dim: SelectableDimensionEnumModel;
}> = observer(({ dim }) => {
  const theme = useTheme();

  const undefinedOption = {
    value: undefined,
    label:
      dim.undefinedLabel ?? i18next.t("selectableDimensions.undefinedLabel")
  };

  let options = dim.options?.map((option) => ({
    value: option.id,
    label: option.name ?? option.id
  }));

  const selectedOption = dim.selectedId
    ? options?.find((option) => option.value === dim.selectedId)
    : undefinedOption;

  if (!options) return null;

  if (typeof dim.selectedId === "undefined" || dim.allowUndefined) {
    options = [undefinedOption, ...options];
  }

  return dim.allowCustomInput ? (
    <ReactSelectCreatable
      css={`
        color: white;
      `}
      styles={{
        control: (baseStyles) => ({
          ...baseStyles,
          borderColor: theme.darkLighter
        }),
        option: (baseStyles, { isSelected }) => ({
          ...baseStyles,
          color: "white"
        })
      }}
      options={options}
      value={selectedOption}
      onChange={(evt) => {
        runInAction(() =>
          dim.setDimensionValue(CommonStrata.user, evt?.value ?? "")
        );
      }}
      isClearable={dim.allowUndefined}
      formatOptionLabel={dim.optionRenderer}
      theme={(selectTheme) => ({
        ...selectTheme,
        colors: {
          ...selectTheme.colors,
          neutral0: theme.darkLighter,
          neutral10: theme.grey,
          neutral20: theme.grey,
          neutral80: "white",
          primary25: theme.grey,
          primary50: theme.colorPrimary,
          primary75: theme.colorPrimary,
          primary: theme.colorPrimary
        }
      })}
    />
  ) : (
    <ReactSelect
      css={`
        color: white;
      `}
      styles={{
        control: (baseStyles) => ({
          ...baseStyles,
          borderColor: theme.darkLighter
        }),
        option: (baseStyles, { isSelected }) => ({
          ...baseStyles,
          color: "white"
        })
      }}
      options={options}
      value={selectedOption}
      onChange={(evt) => {
        runInAction(() =>
          dim.setDimensionValue(CommonStrata.user, evt?.value ?? "")
        );
      }}
      isClearable={dim.allowUndefined}
      formatOptionLabel={dim.optionRenderer}
      theme={(selectTheme) => ({
        ...selectTheme,
        colors: {
          ...selectTheme.colors,
          neutral0: theme.darkLighter,
          neutral10: theme.grey,
          neutral20: theme.grey,
          neutral80: "white",
          primary25: theme.grey,
          primary50: theme.colorPrimary,
          primary75: theme.colorPrimary,
          primary: theme.colorPrimary
        }
      })}
    />
  );
});

/** Similar to SelectableDimensionEnum, but allows multiple values to be selected */
export const SelectableDimensionEnumMulti: React.FC<{
  id: string;
  dim: SelectableDimensionEnumMultiModel;
}> = observer(({ dim }) => {
  const theme = useTheme();

  const options = dim.options?.map((option) => ({
    value: option.id,
    label: option.name ?? option.id
  }));

  if (!options) return null;

  const selectedOptions = options.filter((option) =>
    dim.selectedIds?.some((id) => option.value === id)
  );

  return (
    <ReactSelect
      css={`
        color: ${theme.dark};
        border: none;
      `}
      options={options}
      value={selectedOptions}
      onChange={(evt) => {
        runInAction(() =>
          dim.setDimensionValue(
            CommonStrata.user,
            evt?.map((selected) => selected.value).filter(isDefined) ?? []
          )
        );
      }}
      isClearable={dim.allowUndefined}
      formatOptionLabel={dim.optionRenderer}
      theme={(selectTheme) => ({
        ...selectTheme,
        colors: {
          ...selectTheme.colors,
          primary25: theme.greyLighter,
          primary50: theme.colorPrimary,
          primary75: theme.colorPrimary,
          primary: theme.colorPrimary
        }
      })}
      isMulti
    />
  );
});
