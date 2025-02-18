import { FC } from "react";
import styled from "styled-components";
import Button from "../../Styled/Button";
import { StyledIcon } from "../../Styled/Icon";
import Text from "../../Styled/Text";
import { FeatureInfoPanelButton as FeatureInfoPanelButtonModel } from "../../ViewModels/FeatureInfoPanel";

const FeatureInfoPanelButton: FC<
  React.PropsWithChildren<FeatureInfoPanelButtonModel>
> = (props) => {
  const { text, icon } = props;
  if (!text) {
    return null;
  }
  return (
    <StyledButton
      onClick={props.onClick}
      title={props.title}
      shortMinHeight
      renderIcon={
        icon
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
    >
      {text && <Text textLight>{text}</Text>}
    </StyledButton>
  );
};

const StyledButton = styled(Button).attrs({
  primary: true
})`
  margin: 0 3px;
  border-radius: 4px;
  min-height: 32px;
`;

export default FeatureInfoPanelButton;
