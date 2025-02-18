import { debounce } from "lodash-es";
import { action, runInAction } from "mobx";
import { observer } from "mobx-react";
import { FC, useState } from "react";
import { ChromePicker } from "react-color";
import { useTranslation } from "react-i18next";
import isDefined from "../../Core/isDefined";
import CommonStrata from "../../Models/Definition/CommonStrata";
import { SelectableDimensionColor as SelectableDimensionColorModel } from "../../Models/SelectableDimensions/SelectableDimensions";
import { RawButton } from "../../Styled/Button";
import { TextSpan } from "../../Styled/Text";

const debounceSetColorDimensionValue = debounce(
  action((dim: SelectableDimensionColorModel, value: string) => {
    // Only update value if it has changed
    if (dim.value !== value) {
      dim.setDimensionValue(CommonStrata.user, value);
    }
  }),
  100
);

export const SelectableDimensionColor: FC<
  React.PropsWithChildren<{
    id: string;
    dim: SelectableDimensionColorModel;
  }>
> = observer(({ dim }) => {
  const [open, setIsOpen] = useState(false);
  const { t } = useTranslation();
  return (
    <div>
      {dim.value ? (
        <div
          css={{
            padding: "5px",
            background: "#fff",
            borderRadius: "1px",
            boxShadow: "0 0 0 1px rgba(0,0,0,.1)",
            display: "inline-block",
            cursor: "pointer"
          }}
          onClick={() => setIsOpen(true)}
        >
          <div
            css={{
              width: "36px",
              height: "14px",
              borderRadius: "2px",
              background: dim.value ?? "#aaa"
            }}
          />
        </div>
      ) : null}
      {/* Show "Add" button if value is undefined */}
      {!dim.value ? (
        <>
          &nbsp;
          <RawButton
            onClick={() =>
              runInAction(() =>
                dim.setDimensionValue(CommonStrata.user, "#000000")
              )
            }
            activeStyles
            fullHeight
          >
            <TextSpan textLight small light css={{ margin: 0 }}>
              {t("selectableDimensions.colorAdd")}
            </TextSpan>
          </RawButton>
        </>
      ) : null}
      {/* Show "Clear" button if `allowUndefined` */}
      {dim.value && dim.allowUndefined ? (
        <>
          &nbsp;
          <RawButton
            onClick={() =>
              runInAction(() =>
                dim.setDimensionValue(CommonStrata.user, undefined)
              )
            }
            activeStyles
            fullHeight
          >
            <TextSpan textLight small light css={{ margin: 0 }}>
              {t("selectableDimensions.colorRemove")}
            </TextSpan>
          </RawButton>
        </>
      ) : null}
      {open ? (
        <div
          css={{
            position: "absolute",
            zIndex: 2
          }}
        >
          <div
            css={{
              position: "fixed",
              top: "0px",
              right: "0px",
              bottom: "0px",
              left: "0px",
              width: "340px"
            }}
            onClick={() => setIsOpen(false)}
          />
          <ChromePicker
            css={{ transform: "translate(50px, -50%);" }}
            color={dim.value}
            onChangeComplete={(evt) => {
              const colorString = isDefined(evt.rgb.a)
                ? `rgba(${evt.rgb.r},${evt.rgb.g},${evt.rgb.b},${evt.rgb.a})`
                : `rgb(${evt.rgb.r},${evt.rgb.g},${evt.rgb.b})`;
              debounceSetColorDimensionValue(dim, colorString);
            }}
          />
        </div>
      ) : null}
    </div>
  );
});
