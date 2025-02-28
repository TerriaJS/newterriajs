import React from "react";
import styled from "styled-components";
import { GLYPHS, StyledIcon } from "../../Icon";
import { CheckboxIconProps } from "../types";

const StyledCheckboxIcon = styled(StyledIcon).attrs({
  styledWidth: "1em"
})<{ disabled?: boolean; isSwitch?: boolean }>`
  top: 0.125em;
  align-self: flex-start;
  position: relative;
  fill: currentColor;
  ${(props) =>
    !props.disabled &&
    `
    &:hover {
      opacity: 0.6;
    }
  `}
  ${(props) =>
    props.isSwitch &&
    `
    width: 28px;
    &:hover {
      opacity: 0.95;
    }
  `}
`;

const CheckboxIcon: React.FC<CheckboxIconProps> = (
  props: CheckboxIconProps
) => {
  const iconOn = props.isSwitch ? GLYPHS.switchOn : GLYPHS.checkboxOn;
  const iconOff = props.isSwitch ? GLYPHS.switchOff : GLYPHS.checkboxOff;
  if (props.isDisabled) {
    return (
      <StyledCheckboxIcon
        glyph={props.isChecked ? iconOn : iconOff}
        disabled
        isSwitch={props.isSwitch}
        css={`
          cursor: not-allowed;
          opacity: 0.3;
        `}
      />
    );
  } else if (props.isIndeterminate) {
    return (
      <StyledCheckboxIcon
        isSwitch={props.isSwitch}
        glyph={GLYPHS.checkboxIndeterminate}
      />
    );
  } else {
    return (
      <StyledCheckboxIcon
        isSwitch={props.isSwitch}
        glyph={props.isChecked ? iconOn : iconOff}
      />
    );
  }
};

export default CheckboxIcon;
