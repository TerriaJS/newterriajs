import React from "react";
import { useTheme } from "styled-components";
import AnimatedSpinnerIcon from "../../Styled/AnimatedSpinnerIcon";
import { ButtonProps } from "../../Styled/Button";
import { IconGlyph, StyledIcon } from "../../Styled/Icon";
import StyledButton from "./StyledButton";

export interface ActionButtonProps
  extends Omit<
    ButtonProps & React.HTMLProps<HTMLButtonElement>,
    "iconProps" | "renderIcon"
  > {
  className?: string;
  icon?: IconGlyph;
  showProcessingIcon?: boolean;
}

/**
 * A themed button to use inside {@link ActionBar}
 */
export const ActionButton: React.FC<ActionButtonProps> = ({
  className,
  icon,
  showProcessingIcon,
  warning,
  isActive,
  ...props
}) => {
  const theme = useTheme();
  return (
    <StyledButton
      className={className}
      backgroundColor={isActive ? theme.colorPrimary : theme.darkLighter}
      hoverBackgroundColor={warning ? "red" : theme.colorPrimary}
      renderIcon={
        showProcessingIcon
          ? () => <AnimatedSpinnerIcon styledWidth="20px" styledHeight="20px" />
          : icon
            ? () => (
                <StyledIcon
                  light
                  styledWidth="20px"
                  styledHeight="20px"
                  glyph={icon}
                />
              )
            : undefined
      }
      {...(props as any)}
    />
  );
};
