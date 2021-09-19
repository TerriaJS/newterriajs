import { FC } from "react";
import styled, { DefaultTheme, useTheme } from "styled-components";
const Box: any = require("./Box").default;

export const StyledInput = styled.input<InputProps>`
  -moz-appearance: none;
  -webkit-appearance: none;
  
  display: block;
  box-sizing: border-box;
  height: ${p => p.theme.inputHeight};
  width: 100%;
  border: none;
  border-radius: ${p => p.theme.radiusSmall};
 
  ${props =>
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
  color: ${p => p.theme.textDark};
  background: ${p => p.theme.overlayInvert};
  ${props =>
    props.light &&
    `
    color: ${props.theme.textBlack};
    background: ${props.theme.overlayInvert};
    ${props.border &&
      `border-color: transparent;
    &:focus {
      border-color: transparent;
    `}
  `}
  ${props =>
    props.dark &&
    `
    color: ${props.theme.textLight};
    background: ${props.theme.overlay};
    ${props.border &&
      `border-color: ${props.fieldBorder};
    `};
  `}
  ${props =>
    props.white &&
    `
    color: ${props.theme.textDark};
    background: #FFFFFF;
  `}
  ${props => props.fullHeight && `height: 100%;`}
  ${props => props.styledWidth && `width: ${props.styledWidth};`}
  ${props => props.styledHeight && `height: ${props.styledHeight};`}
  ${props => props.styledMinHeight && `min-height: ${props.styledMinHeight};`}
  ${props => props.styledMaxHeight && `max-height: ${props.styledMaxHeight};`}
  ${props => props.large && `height: ${props.theme.inputHeightLarge};`}
  ${props => props.rounded && `border-radius: 30px;`}
  ${props => props.disabled && `opacity: 0.3;`}
  ${props =>
    props.invalidValue &&
    `
    border-color: #d60000;
    background-color: #fdf2f2;
  `}
`;

interface InputProps {
  boxProps?: any;
  fieldBorder?: string;
  large?: boolean;
  dark?: boolean;
  light?: boolean;
  [spread: string]: any;
}

const Input: FC<InputProps> = (props: InputProps) => {
  const { boxProps, ...rest }: InputProps = props;
  const theme: DefaultTheme = useTheme();
  return (
    <Box fullWidth {...boxProps}>
      <StyledInput {...rest}></StyledInput>
    </Box>
  );
};

export default Input;
