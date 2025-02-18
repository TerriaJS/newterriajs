/**
 * Prompt.tsx - don't use without guarding on useSmallScreenInterface - it won't look pretty!
 */
import { FC, useState } from "react";
import { useTheme } from "styled-components";
import FadeIn from "../Transitions/FadeIn/FadeIn";
import SlideUpFadeIn from "../Transitions/SlideUpFadeIn/SlideUpFadeIn";
import TourExplanationBox from "../Tour/TourExplanationBox";
import TourPrefaceBox from "../Tour/TourPrefaceBox";
import CloseButton from "../Generic/CloseButton";
import ViewState from "../../ReactViewModels/ViewState";
import Text from "../../Styled/Text";
import Box from "../../Styled/Box";
import Button from "../../Styled/Button";
import Spacing from "../../Styled/Spacing";

interface PromptProps {
  viewState: ViewState;
  title: string;
  content: string;
  dismissLabel: string;
  acceptLabel: string;
  onDismiss: () => void;
  onAccept: () => void;
  isVisible: boolean;
}

export const HelpPrompt: FC<React.PropsWithChildren<PromptProps>> = ({
  title,
  content,
  dismissLabel,
  acceptLabel,
  onDismiss,
  onAccept,
  isVisible
}) => {
  const theme = useTheme();
  // This is required so we can do nested animations
  const [childrenVisible, setChildrenVisible] = useState(isVisible);
  return (
    <FadeIn
      isVisible={isVisible}
      onEnter={() => setChildrenVisible(true)}
      transitionProps={{
        onExiting: () => setChildrenVisible(false)
      }}
    >
      <Box
        fullWidth
        fullHeight
        position="absolute"
        css={`
          z-index: ${(p: any) => Number(p.theme.frontComponentZIndex) + 100};
        `}
      >
        <TourPrefaceBox
          onClick={onDismiss}
          role="presentation"
          aria-hidden="true"
          pseudoBg
        />
        <SlideUpFadeIn isVisible={childrenVisible}>
          <TourExplanationBox
            longer
            paddedRatio={4}
            column
            style={{
              right: 25,
              bottom: 45
            }}
          >
            <CloseButton
              color={theme.darkWithOverlay}
              topRight
              onClick={() => onDismiss()}
            />
            <Spacing bottom={2} />
            <Text extraExtraLarge bold textDarker>
              {title}
            </Text>
            <Spacing bottom={3} />
            <Text light medium textDarker>
              {content}
            </Text>
            <Spacing bottom={4} />
            <Text medium>
              <Box centered>
                <Button
                  secondary
                  fullWidth
                  shortMinHeight
                  onClick={(e: any) => {
                    e.stopPropagation();
                    onDismiss();
                  }}
                >
                  {dismissLabel}
                </Button>
                <Spacing right={3} />
                <Button
                  primary
                  fullWidth
                  shortMinHeight
                  textProps={{ noFontSize: true }}
                  onClick={(e: any) => {
                    e.stopPropagation();
                    onAccept();
                  }}
                >
                  {acceptLabel}
                </Button>
              </Box>
            </Text>
            <Spacing bottom={1} />
          </TourExplanationBox>
        </SlideUpFadeIn>
      </Box>
    </FadeIn>
  );
};

export default HelpPrompt;
