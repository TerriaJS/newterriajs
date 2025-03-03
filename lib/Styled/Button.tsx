import React from "react";
import styled from "styled-components";
import { BoxSpan } from "./Box";
import { TextSpan } from "./Text";

const IconSpan = styled.span<{ margin?: string }>`
  ${(p) => p.margin};
`;

export interface IButtonProps {
  fullWidth?: boolean;
  fullHeight?: boolean;
  styledWidth?: string;
  activeStyles?: boolean;
  textLight?: boolean;
}

interface IStyledButtonProps extends IButtonProps {
  shortMinHeight?: boolean;
  styledMinWidth?: string;
  marginLeft?: number;
  marginRight?: number;
  primaryHover?: boolean;
  primary?: boolean;
  rounded?: boolean;
  roundLeft?: boolean;
  roundRight?: boolean;
  secondary?: boolean;
  denyButton?: boolean;
  warning?: boolean;
  splitter?: boolean;
  textLight?: boolean;
  transparentBg?: boolean;
  disabled?: boolean;
  [key: string]: any;
}

export const StyledButton = styled.button<IStyledButtonProps>`
  pointer-events: auto;
  cursor: pointer;
  min-height: 40px;
  ${(props) => props.shortMinHeight && `min-height: 34px;`}
  // min-width: 75px;
  padding: 0 16px;

  border: 1px solid #e4e5e7;
  border-radius: 4px;

  ${(props) => props.fullWidth && `width: 100%;`}
  ${(props) => props.fullHeight && `height: 100%;`}
  ${(props) => props.styledWidth && `width: ${props.styledWidth};`}
  ${(props) => props.styledMinWidth && `min-width: ${props.styledMinWidth};`}

  ${(props) => props.marginLeft && `margin-left: ${4 * props.marginLeft}px;`}
  ${(props) => props.marginRight && `margin-right: ${4 * props.marginRight}px;`}

  &:hover,
  &:focus {
    opacity: 0.9;
  }

  ${(props) =>
    props.primaryHover &&
    `
    &:hover,
    &:focus {
      color: ${props.theme.textLight};
      background-color: ${props.theme.colorPrimary};
    }
  `}

  ${(props) =>
    props.primary &&
    `
    color: #fff;
    background-color: ${props.theme.colorPrimary};
    border: none;
    border-radius:4px;
  `}
  ${(props) => props.rounded && ` border-radius: 32px; `}
  ${(props) => props.roundLeft && `border-radius: 32px 0 0 32px;`}
  ${(props) => props.roundRight && `border-radius: 0 32px 32px 0;`}

  ${(props) =>
    props.secondary &&
    `
    // background-color: #4d5766;
    background-color: ${props.theme.textLight};
    color: ${props.theme.darkWithOverlay};
    border-radius: 4px;
    border: 2px solid ${props.theme.darkWithOverlay};
  `}
  ${(props) =>
    props.denyButton &&
    `
    border: 2px solid ${props.theme.grey};
    color: ${props.theme.grey};
    background-color: transparent;
  `}
  ${(props) =>
    props.warning &&
    `
    background-color: red;
  `}

  ${(props) =>
    props.splitter &&
    `
    background-color: ${props.theme.colorSecondary};
    color: ${props.theme.textLight};
  `}

  ${(props) => props.transparentBg && `background: transparent;`}
  ${(props) =>
    props.disabled &&
    `
    // normalize.css has some silly overrides so this specificity is needed here to re-override
    &[disabled] {
      cursor: not-allowed;
      opacity: 0.3;
      background: ${props.theme.grey};
    }
  `}
`;

/**
 * Use for things you need as clickable things & not necessary the design
 * language styled button
 */
export const RawButton = styled.button<IButtonProps>`
  margin: 0;
  padding: 0;
  border: 0;
  background-color: transparent;
  cursor: pointer;

  &:hover {
    cursor: pointer;
  }

  ${(props) =>
    props.activeStyles &&
    `
    &:hover,
    &:focus {
      opacity: 0.9;
    }
  `}
  ${(props) =>
    props.disabled &&
    `
    &[disabled] {
      cursor: not-allowed;
    }
  `}

  ${(props) => props.fullWidth && `width: 100%;`}
  ${(props) => props.fullHeight && `height: 100%;`}
  ${(props) => props.styledWidth && `width: ${props.styledWidth};`}

  ${(props) =>
    props.textLight ? `color: ${props.theme.textLight}` : `color: inherit`}
`;

export type ButtonProps = {
  renderIcon?: () => React.ReactChild;
  iconProps?: any;
  primary?: boolean;
  secondary?: boolean;
  warning?: boolean;
  textLight?: boolean;
  rightIcon?: boolean;
  textProps?: any;
  children?: React.ReactChildren;
  buttonRef?: React.Ref<HTMLButtonElement>;
  title?: string;
} & React.ComponentPropsWithoutRef<typeof StyledButton>;

// Icon and props-children-mandatory-text-wrapping is a mess here so it's all very WIP
export const Button: React.FC<ButtonProps> = (props) => {
  const {
    primary,
    secondary,
    warning,
    textLight,
    iconProps,
    textProps,
    buttonRef,
    ...rest
  } = props;

  const IconComponent =
    props.renderIcon && typeof props.renderIcon === "function"
      ? () => (
          <IconSpan
            css={iconProps && iconProps.css}
            margin={
              // Apply left or right margin only when the button content is not empty
              props.children
                ? props.rightIcon
                  ? "margin-left: 8px"
                  : "margin-right: 8px"
                : null
            }
            rightIcon={props.rightIcon}
            {...iconProps}
          >
            {props!.renderIcon!()}
          </IconSpan>
        )
      : undefined;

  return (
    <StyledButton
      ref={buttonRef}
      primary={primary}
      secondary={secondary}
      warning={warning}
      {...rest}
    >
      <BoxSpan centered>
        {!props.rightIcon && IconComponent?.()}
        {props.children && (
          <TextSpan
            white={primary || secondary || warning || textLight}
            medium={secondary}
            {...textProps}
          >
            {props.children}
          </TextSpan>
        )}
        {props.rightIcon && IconComponent?.()}
      </BoxSpan>
    </StyledButton>
  );
};

export default React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => <Button {...props} buttonRef={ref} />
);
