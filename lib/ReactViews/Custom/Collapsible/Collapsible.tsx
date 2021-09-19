"use strict";

import { observer } from "mobx-react";
import { FC, Component, Fragment } from "react";
import Box from "../../../Styled/Box";
import { RawButton } from "../../../Styled/Button";
import { SpacingSpan } from "../../../Styled/Spacing";
import Text, { TextSpan } from "../../../Styled/Text";
import { GLYPHS, StyledIcon } from "../../../Styled/Icon";

interface CollapsibleIconProps {
  isOpen?: boolean;
  /**
   * caret is light coloured (default is true)
   */
  light?: boolean;
  /**
   * caret is default style
   */
  btnStyle?: "plus" | "caret";
}

interface CollapsibleProps extends CollapsibleIconProps {
  title: string;

  onToggle?: (isOpen: boolean) => void;
  btnRight?: boolean;

  titleTextProps?: any;
  bodyBoxProps?: any;
  bodyTextProps?: any;
}

export const CollapseIcon: FC<CollapsibleIconProps> = props => (
  <StyledIcon
    displayInline
    styledWidth={"8px"}
    light={props.light ?? true}
    glyph={
      props.btnStyle === "plus"
        ? props.isOpen
          ? GLYPHS.minusThick
          : GLYPHS.plusThick
        : GLYPHS.opened
    }
    opacity={props.isOpen ? 1 : 0.4}
    rotation={props.isOpen ? 0 : -90}
  />
);

@observer
export default class Collapsible extends Component<
  CollapsibleProps,
  { isOpen: boolean }
> {
  constructor(props: CollapsibleProps) {
    super(props);
    this.state = { isOpen: props.isOpen ?? false };
  }

  toggleOpen() {
    this.setState({ isOpen: !this.state.isOpen });
    if (this.props.onToggle) this.props.onToggle(!this.state.isOpen);
  }

  render() {
    return (
      <Fragment>
        <RawButton
          fullWidth
          onClick={this.toggleOpen.bind(this)}
          css={`
            text-align: left;
            display: flex;
            align-items: center;
          `}
          aria-expanded={this.state.isOpen}
          aria-controls={`${this.props.title}`}
        >
          {!this.props.btnRight && (
            <CollapseIcon {...this.props} isOpen={this.state.isOpen} />
          )}
          {!this.props.btnRight && <SpacingSpan right={2} />}
          <TextSpan
            textLight={this.props.light ?? true}
            bold
            medium
            {...this.props.titleTextProps}
          >
            {this.props.title}
          </TextSpan>
          {this.props.btnRight && <SpacingSpan right={2} />}
          {this.props.btnRight && (
            <CollapseIcon {...this.props} isOpen={this.state.isOpen} />
          )}
        </RawButton>
        <Box {...this.props.bodyBoxProps}>
          {this.state.isOpen && (
            <Text
              textLight={this.props.light ?? true}
              small
              id={`${this.props.title}`}
              {...this.props.bodyTextProps}
            >
              {this.props.children}
            </Text>
          )}
        </Box>
      </Fragment>
    );
  }
}
