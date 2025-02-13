import { FC } from "react";
import styled from "styled-components";
import Box from "../../Styled/Box";
import { SpacingSpan } from "../../Styled/Spacing";
import { TextSpan } from "../../Styled/Text";
import { RawButton } from "../../Styled/Button";

// only spans are valid html for buttons (even though divs work)
const ButtonWrapper = styled(Box).attrs({
  as: "span"
})`
  display: flex;
  justify-content: center;
  align-items: center;
`;

interface IStyledWorkbenchButton {
  primary?: boolean;
  inverted?: boolean;
}

// styles half ripped from nav.scss
const StyledWorkbenchButton = styled(RawButton)<IStyledWorkbenchButton>`
  border-radius: 3px;
  background: ${(props) => props.theme.dark};
  color: ${(props) => props.theme.textLight};
  flex-grow: 1;

  height: 32px;
  min-width: 32px;

  box-shadow: none;
  svg {
    height: 16px;
    width: 16px;
    fill: ${(props) => props.theme.textLight};
  }

  &:hover,
  &:focus {
    background: ${(props) => props.theme.colorPrimary};
  }

  // disabled

  ${(props) =>
    props.disabled &&
    `
    opacity:0.5;
    // background: ${props.theme.textDarker};
    &:hover,
    &:focus {
      cursor: not-allowed;
      background: ${props.theme.dark};
    }
    `}

  ${(props) =>
    props.primary &&
    `
    background: ${props.theme.colorPrimary};A
    color: ${props.theme.textLight};
    svg {
      fill: ${props.theme.textLight};
    }
  `}

  ${(props) =>
    props.inverted &&
    `
    background: ${props.theme.textDarker};
    color: ${props.theme.textLight};
    svg {
      fill: ${props.theme.textLight};
    }
  `}
`;

interface IProps {
  children?: any;
  primary?: boolean;
  disabled?: boolean;
  inverted?: boolean;
  iconOnly?: boolean;
  title?: string;
  iconElement(): any;
  onClick?: (e?: any) => void;
}

const WorkbenchButton: FC<IProps> = (props: IProps) => {
  const { children, title, primary, inverted, disabled, iconOnly } = props;

  return (
    <StyledWorkbenchButton
      primary={primary}
      disabled={disabled}
      iconOnly={iconOnly}
      inverted={inverted}
      type="button"
      title={title}
      onClick={props.onClick}
      {...props}
    >
      <ButtonWrapper>
        {/* only spans are valid html for buttons (even though divs work) */}
        {props.iconElement && props.iconElement()}
        {children && (
          <>
            <SpacingSpan right={1} />
            <TextSpan
              noWrap
              small
              css={`
                display: block;
                text-transform: uppercase;
                letter-spacing: 0.08px;
              `}
            >
              {children}
            </TextSpan>
          </>
        )}
      </ButtonWrapper>
    </StyledWorkbenchButton>
  );
};
export default WorkbenchButton;
