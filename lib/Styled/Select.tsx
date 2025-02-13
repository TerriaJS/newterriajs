/**
 * sample usage:
 *

<Select>
  <option>one</option>
  <option>two</option>
  <option>three</option>
</Select>

or if you need padding, box needed as select comes with zero padding
<Box paddedRatio={1}>
  <Select>
    <option>one</option>
    <option>two</option>
    <option>three</option>
  </Select>
</Box>

or with overrides on icon
<Select dropdownIconProps={{fillColor: props.theme.textLight}}>
  <option>one</option>
  <option>two</option>
  <option>three</option>
</Select>
 */

import { ReactNode, FC } from "react";
import styled, { useTheme } from "styled-components";
import Box from "./Box";
import { GLYPHS, StyledIcon } from "./Icon";

const StyledSelect = styled.select<SelectProps>`
  -moz-appearance: none;
  -webkit-appearance: none;

  min-height: 34px; // use a bool prop when we figure out the smaller size
  width: 100%;

  border: none;
  border-radius: ${(p) => p.theme.radiusSmall};
  padding-left: ${(p) => p.paddingForLeftIcon || "10px"};
  padding-right: 30px; // For icon

  color: ${(p) => p.theme.textLight};
  background: ${(p) => p.theme.overlay};

  & option {
    color: ${(p) => p.theme.textBlack};
  }

  ${(props) =>
    props.light &&
    `
    color: ${props.theme.textBlack};
    background: ${props.theme.overlayInvert};
  `}

  ${(props) => props.disabled && `opacity: 0.3;`}
`;

const ArrowPositioning = styled.div`
  ${(props) => props.theme.verticalAlign("absolute")}
  right: 10px;

  // Stops presentational icon preventing select activation via mouse
  pointer-events: none;
`;

const LeftIconPositioning = styled.div`
  ${(props) => props.theme.verticalAlign("absolute")}

  // Stops presentational icon preventing select activation via mouse
  pointer-events: none;
`;

export interface SelectProps {
  boxProps?: any;
  dropdownIconProps?: any;
  light?: boolean;
  leftIcon?: () => ReactNode;
  paddingForLeftIcon?: string;
  children: ReactNode;
  [spread: string]: any;
}

const Select: FC<SelectProps> = (props) => {
  const {
    leftIcon,
    children,
    boxProps,
    dropdownIconProps,
    paddingForLeftIcon,
    ...rest
  }: SelectProps = props;
  const theme: any = useTheme();
  return (
    <Box fullWidth {...boxProps}>
      {leftIcon && <LeftIconPositioning>{leftIcon()}</LeftIconPositioning>}
      <StyledSelect
        leftIcon={leftIcon}
        paddingForLeftIcon={paddingForLeftIcon}
        {...rest}
      >
        {children}
      </StyledSelect>
      <ArrowPositioning>
        <StyledIcon
          // light bg needs dark icon
          fillColor={props.light ? theme.textBlack : theme.textLight}
          styledWidth="16px"
          glyph={GLYPHS.arrowDown}
          {...dropdownIconProps}
        />
      </ArrowPositioning>
    </Box>
  );
};

export default Select;
