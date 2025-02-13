import { ReactNode, FC } from "react";
import { useTheme } from "styled-components";
import { TextSpan } from "../Styled/Text";
import Box from "../Styled/Box";

interface IProps {
  label: string;
  badge?: number;
  children: ReactNode;
}
const BadgeBar: FC<IProps> = (props: IProps) => {
  const theme = useTheme();
  return (
    <Box
      paddedHorizontally={3}
      justifySpaceBetween
      whiteSpace="nowrap"
      styledMinHeight="40px"
      verticalCenter
      css={`
        border-top: 1px solid ${theme.darkWithOverlay};
        border-bottom: 1px solid ${theme.darkWithOverlay};
      `}
    >
      <TextSpan textLight uppercase overflowHide overflowEllipsis>
        {props.label} {props.badge ? `(${props.badge})` : null}
      </TextSpan>

      <Box
        styledMaxWidth="60%"
        css={`
          gap: 15px;
        `}
      >
        {props.children}
      </Box>
    </Box>
  );
};

export default BadgeBar;
