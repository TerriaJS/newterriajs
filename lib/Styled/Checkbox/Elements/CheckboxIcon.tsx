import { FC } from "react";
import styled from "styled-components";
import { GLYPHS, StyledIcon } from "../../Icon";
import { CheckboxIconProps } from "../types";

const StyledCheckboxIcon = styled(StyledIcon).attrs({
  styledWidth: "1em"
})<{ disabled?: boolean }>`
  top: 0.125em;
  align-self: flex-start;
  position: relative;
  fill: currentColor;
  ${props =>
    !props.disabled &&
    `
    &:hover {
      opacity: 0.6;
    }
  `}
`;

const CheckboxIcon: FC<CheckboxIconProps> = (props: CheckboxIconProps) => {
  if (props.isDisabled) {
    return (
      <StyledCheckboxIcon
        glyph={GLYPHS.checkboxOff}
        disabled
        css={`
          opacity: 0.3;
        `}
      />
    );
  } else if (props.isIndeterminate) {
    return <StyledCheckboxIcon glyph={GLYPHS.checkboxIndeterminate} />;
  } else {
    return (
      <>
        {props.isChecked ? (
          <StyledCheckboxIcon glyph={GLYPHS.checkboxOn} />
        ) : (
          <StyledCheckboxIcon glyph={GLYPHS.checkboxOff} />
        )}
      </>
    );
  }
};

export default CheckboxIcon;
