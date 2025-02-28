import { observer } from "mobx-react";
import { FC, useState } from "react";
import { useTranslation, TFunction } from "react-i18next";
import styled, { useTheme } from "styled-components";
import ViewState from "../../ReactViewModels/ViewState";
import Box, { BoxSpan } from "../../Styled/Box";
import { RawButton } from "../../Styled/Button";
import Spacing from "../../Styled/Spacing";
import Text from "../../Styled/Text";
import { GLYPHS, StyledIcon } from "../../Styled/Icon";

export interface FrameProps {
  title: string;
  viewState: ViewState;
}

export const Frame: FC<FrameProps> = observer((props) => {
  const theme = useTheme();
  const [t] = useTranslation();
  const [showChildren, setShowChildren] = useState(true);
  const { viewState } = props;
  return (
    <Wrapper isMapFullScreen={viewState.isMapFullScreen}>
      <Toggle
        paddedVertically
        paddedHorizontally={2}
        centered
        justifySpaceBetween
        backgroundColor={theme.toolPrimaryColor}
      >
        <Title title={props.title} icon={GLYPHS.search} />
        {/* margin-right 5px for the padded button offset - larger click area
          but visible should be inline with rest of box */}
        <Box centered css={"margin-right:-5px;"}>
          <ToolCloseButton viewState={viewState} t={t} />
          <Spacing right={4} />
          {/* collapse button */}
          <RawButton onClick={() => setShowChildren(!showChildren)}>
            <BoxSpan paddedRatio={1} centered>
              <StyledIcon
                styledWidth="12px"
                light
                glyph={showChildren ? GLYPHS.opened : GLYPHS.closed}
              />
            </BoxSpan>
          </RawButton>
        </Box>
      </Toggle>
      {showChildren && props.children}
    </Wrapper>
  );
});

const TOP_MARGIN = 70;
const BOTTOM_MARGIN = 100;

export const Main = styled(Text)`
  display: flex;
  flex-direction: column;
  padding: 15px;
  overflow-y: auto;
  ${({ theme }) => theme.borderRadiusBottom(theme.radius40Button)}
  background-color: ${(p) => p.theme.darkWithOverlay};
  min-height: 350px;
`;

const Wrapper = styled(Box).attrs({
  column: true,
  position: "absolute",
  styledWidth: "340px"
  // charcoalGreyBg: true
})<{ isMapFullScreen: boolean }>`
  top: ${TOP_MARGIN}px;
  left: 0px;
  min-height: 220px;
  max-height: calc(100vh - ${TOP_MARGIN + BOTTOM_MARGIN}px);
  // background: ${(p) => p.theme.dark};
  margin-left: ${(props) =>
    props.isMapFullScreen
      ? 16
      : parseInt(props.theme.workbenchWidth, 10) + 40}px;
  transition: margin-left 0.25s;
`;

const Toggle = styled(Box)`
  ${({ theme }) => theme.borderRadiusTop(theme.radius40Button)}
`;

interface ToolCloseButtonProps {
  viewState: ViewState;
  t: TFunction;
}

const ToolCloseButton: FC<ToolCloseButtonProps> = (props) => {
  return (
    <RawButton onClick={() => props.viewState.closeTool()}>
      <Text textLight small semiBold uppercase>
        {props.t("tool.exitBtnTitle")}
      </Text>
    </RawButton>
  );
};

interface TitleProps {
  title: string;
  icon?: { id: string };
}

const Title: FC<TitleProps> = (props) => {
  return (
    <Box centered>
      <Box>
        {props.icon && (
          <StyledIcon styledWidth="20px" light glyph={props.icon} />
        )}
      </Box>
      <Spacing right={1} />
      <TitleText
        textLight
        semiBold
        // font-size is non standard with what we have so far in terria,
        // lineheight as well to hit nonstandard paddings
        styledFontSize="17px"
        styledLineHeight="30px"
        overflowEllipsis
        overflowHide
        noWrap
      >
        {props.title}
      </TitleText>
    </Box>
  );
};

const TitleText = styled(Text)`
  flex-grow: 2;
  max-width: 220px;
`;
