import { ReactNode, FC } from "react";
import { TextSpan } from "../Styled/Text";
const Box = require("../Styled/Box").default;

interface IProps {
  label: string;
  badge?: number;
  children: ReactNode;
}
const BadgeBar: FC<IProps> = (props: IProps) => {
  return (
    <Box paddedHorizontally={3} justifySpaceBetween whiteSpace="nowrap">
      <Box verticalCenter styledMaxWidth="40%">
        <TextSpan textLight uppercase overflowHide overflowEllipsis>
          {props.label} {props.badge ? `(${props.badge})` : null}
        </TextSpan>
      </Box>

      <Box styledMaxWidth="60%">{props.children}</Box>
    </Box>
  );
};

export default BadgeBar;
