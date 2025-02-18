import { observer } from "mobx-react";
import { FC, useEffect, useState } from "react";
import Box, { IBoxProps } from "../../../Styled/Box";
import { RawButton } from "../../../Styled/Button";
import { GLYPHS, StyledIcon } from "../../../Styled/Icon";
import { SpacingSpan } from "../../../Styled/Spacing";
import Text, { TextSpan } from "../../../Styled/Text";
import { parseCustomMarkdownToReactWithOptions } from "../parseCustomMarkdownToReact";

interface CollapsibleIconProps {
  isOpen?: boolean;
  /**
   * caret is light coloured (default is true)
   */
  light?: boolean;
  /**
   * caret is default style
   */
  btnStyle?: "plus" | "caret" | "checkbox";
}

interface CollapsibleProps extends CollapsibleIconProps {
  title: string;

  /** Function is called whenever Collapsible is toggled (close or open).
   * Return value is `true` if the listener has consumed the event, `false` otherwise.
   */
  onToggle?: (isOpen: boolean) => boolean | void;
  btnRight?: boolean;

  titleTextProps?: any;
  bodyBoxProps?: IBoxProps;
  bodyTextProps?: any;
}

export const CollapseIcon: FC<React.PropsWithChildren<CollapsibleIconProps>> = (
  props
) => {
  let glyph = GLYPHS.opened;
  let glyphWidth = 8;
  let glyphRotation = 0;
  let glyphOpacity = 1;

  if (props.btnStyle === "plus") {
    glyph = props.isOpen ? GLYPHS.minus : GLYPHS.plus;
    glyphOpacity = props.isOpen ? 1 : 0.4;
  } else if (props.btnStyle === "checkbox") {
    glyph = props.isOpen ? GLYPHS.checkboxOn : GLYPHS.checkboxOff;
    glyphWidth = 13;
  } else {
    glyphRotation = props.isOpen ? 0 : -90;
    glyphOpacity = props.isOpen ? 1 : 0.4;
  }

  return (
    <StyledIcon
      displayInline
      styledWidth={`${glyphWidth}px`}
      light={props.light ?? true}
      glyph={glyph}
      opacity={glyphOpacity}
      rotation={glyphRotation}
    />
  );
};

const Collapsible: FC<React.PropsWithChildren<CollapsibleProps>> = observer(
  (props) => {
    const [isOpen, setIsOpen] = useState<boolean | undefined>();

    useEffect(() => setIsOpen(props.isOpen), [props.isOpen]);

    const toggleOpen = () => {
      const newIsOpen = !isOpen;
      // Only update isOpen state if onToggle doesn't consume the event
      if (!props.onToggle || !props.onToggle(newIsOpen)) setIsOpen(newIsOpen);
    };

    return (
      <>
        <RawButton
          fullWidth
          onClick={toggleOpen}
          css={`
            text-align: left;
            display: flex;
            align-items: center;
          `}
          aria-expanded={isOpen}
          aria-controls={`${props.title}`}
          activeStyles
        >
          {!props.btnRight && <CollapseIcon {...props} isOpen={isOpen} />}
          {!props.btnRight && <SpacingSpan right={1} />}
          <TextSpan
            textLight={props.light ?? true}
            bold
            medium
            {...props.titleTextProps}
          >
            {parseCustomMarkdownToReactWithOptions(props.title, {
              inline: true
            })}
          </TextSpan>
          {props.btnRight && <SpacingSpan right={1} />}
          {props.btnRight && <CollapseIcon {...props} isOpen={isOpen} />}
        </RawButton>
        {isOpen ? (
          <Box {...props.bodyBoxProps}>
            <Text
              textLight={props.light ?? true}
              small
              id={`${props.title}`}
              {...props.bodyTextProps}
            >
              {props.children}
            </Text>
          </Box>
        ) : null}
      </>
    );
  }
);

export default Collapsible;
