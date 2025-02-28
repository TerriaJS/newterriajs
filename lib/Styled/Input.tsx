import { InputHTMLAttributes, FC } from "react";
import styled, { css, useTheme } from "styled-components";
import Box, { IBoxProps } from "./Box";

export interface CommonProps {
  boxProps?: IBoxProps;
  fieldBorder?: string;
  large?: boolean;
  white?: boolean;
  dark?: boolean;
  light?: boolean;
  border?: boolean;
  fullHeight?: boolean;
  rounded?: boolean;
  invalidValue?: boolean;
  styledWidth?: string;
  styledHeight?: string;
  styledMinHeight?: string;
  styledMaxHeight?: string;
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & CommonProps;
type TextAreaProps = InputHTMLAttributes<HTMLTextAreaElement> &
  CommonProps & {
    lineHeight?: string;
  };

const commonStyles = css<InputProps | TextAreaProps>`
  -moz-appearance: none;
  -webkit-appearance: none;

  display: block;
  box-sizing: border-box;
  height: ${(p) => p.theme.inputHeight};
  width: 100%;
  border: none;
  border-radius: ${(p) => p.theme.radiusSmall};

  ${(props) =>
    props.border &&
    `
  border-style: solid;
  border-width: 1px;
  border-color: ${props.fieldBorder};
`}
  margin-top: 0;
  margin-bottom: 0;
  padding: 0px;
  padding-left: 10px;
  padding-right: 10px;
  color: ${(p) => p.theme.textDark};
  background: ${(p) => p.theme.overlayInvert};
  ${(props) =>
    props.light &&
    `
  color: ${props.theme.textBlack};
  background: ${props.theme.overlayInvert};
  ${
    props.border &&
    `border-color: transparent;
  &:focus {
    border-color: transparent;
  }`
  }
`}
  ${(props) =>
    props.dark &&
    `
  color: ${props.theme.textLight};
  background: ${props.theme.overlay};
  ${
    props.border &&
    `border-color: ${props.fieldBorder};
  `
  };
`}
${(props) =>
    props.white &&
    `
  color: ${props.theme.textDark};
  background: #FFFFFF;
`}
${(props) => props.fullHeight && `height: 100%;`}
${(props) => props.styledWidth && `width: ${props.styledWidth};`}
${(props) => props.styledHeight && `height: ${props.styledHeight};`}
${(props) => props.styledMinHeight && `min-height: ${props.styledMinHeight};`}
${(props) => props.styledMaxHeight && `max-height: ${props.styledMaxHeight};`}
${(props) => props.large && `height: ${props.theme.inputHeightLarge};`}
${(props) => props.rounded && `border-radius: 30px;`}
${(props) => props.disabled && `opacity: 0.3;`}
${(props) =>
    props.invalidValue &&
    `
  border-color: #d60000;
  background-color: #fdf2f2;
`}
`;

export const StyledTextArea = styled.textarea<TextAreaProps>`
  ${commonStyles}
  line-height: ${(props) => props.lineHeight};
  padding-top: 5px;
  padding-bottom: 5px;
  cursor: auto;
  -webkit-overflow-scrolling: touch;
  min-width: 100%;
  max-width: 100%;

  &::-webkit-scrollbar {
    width: 10px; /* for vertical scrollbars */
    height: 8px; /* for horizontal scrollbars */
  }

  &::-webkit-scrollbar-track {
    background: rgba(136, 136, 136, 0.1);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(136, 136, 136, 0.6);
  }
`;

export const StyledInput = styled.input<InputProps>`
  ${commonStyles}
`;

const Input: FC<InputProps> = (props: InputProps) => {
  const { boxProps, ...rest }: InputProps = props;
  useTheme();
  return (
    <Box fullWidth {...boxProps}>
      <StyledInput {...rest} />
    </Box>
  );
};

export default Input;
