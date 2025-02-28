import React from "react";
import { useTheme } from "styled-components";
import { TextSpan } from "../Styled/Text";
import Box from "../Styled/Box";

interface IProps {
  label: string;
  badge?: number;
  children: React.ReactNode;
}
const BadgeBar: React.FC<IProps> = (props: IProps) => {
  const theme = useTheme();
  return (
    <Box
      flex
      column
      styledMargin="0 15px"
      justifySpaceBetween
      whiteSpace="nowrap"
      styledMinHeight="70px"
      verticalCenter
      css={`
        border-top: 1px solid ${theme.darkLighter};
        border-bottom: 1px solid ${theme.darkLighter};
        justify-content: space-evenly;
        align-items: center;
      `}
    >
      <Box>
        <TextSpan textLight uppercase overflowHide overflowEllipsis>
          {props.label} {props.badge !== undefined ? `(${props.badge})` : null}
        </TextSpan>
      </Box>
      <Box
        flex
        styledWidth="100%"
        css={`
          justify-content: space-between;
        `}
      >
        {props.children}
      </Box>
    </Box>
  );
};

export default BadgeBar;
