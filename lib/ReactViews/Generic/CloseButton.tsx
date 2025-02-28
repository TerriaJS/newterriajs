// for all the panels and modals we will eventually normalise
import styled from "styled-components";
// import Box  from "../../Styled/Box";
import Icon from "../../Styled/Icon";
import { ButtonProps, RawButton } from "../../Styled/Button";

const StyledCloseButton = styled(RawButton)`
  ${(p: any) => !p.noAbsolute && `position: absolute;`}
  // width: 20px;
  // height: 20px;
  width: 14px;
  height: 14px;
  ${(p: any) =>
    p.topRight &&
    `
    top: 15px;
    right:15px;
    `}
  svg {
    // fill: ${(p) => p.color || p.theme.darkWithOverlay};
    fill: ${(p) => p.color};
  }
`;

const CloseButton = (props: ButtonProps) => {
  return (
    <StyledCloseButton {...props}>
      <Icon glyph={Icon.GLYPHS.closeLight} />
    </StyledCloseButton>
  );
};

export default CloseButton;
