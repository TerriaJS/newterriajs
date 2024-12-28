"use strict";

// proptypes are in mixin
/* eslint react/prop-types:0*/

import React from "react";
import createReactClass from "create-react-class";
import classNames from "classnames";
import Icon from "../../../Styled/Icon";
import InnerPanel from "./InnerPanel";
import BaseOuterPanel from "./BaseOuterPanel";

import Styles from "./panel.scss";

import defined from "terriajs-cesium/Source/Core/defined";

const DropdownPanel = createReactClass({
  displayName: "DropdownPanel",
  mixins: [BaseOuterPanel],

  getInitialState() {
    return {
      localIsOpen: false,
      caretOffset: undefined,
      dropdownOffset: undefined
    };
  },

  onInnerMounted(innerElement) {
    const centerInnerDropdown = this.props.showDropdownInCenter;
    if (centerInnerDropdown) {
      this.setState({
        caretOffset: "50%",
        dropdownOffset: "50%"
      });
    } else if (innerElement) {
      const btnRef = this.props.btnRef;
      const buttonElementOffsetLeft =
        btnRef?.current?.offsetLeft || this.buttonElement?.offsetLeft || 0;
      const buttonElementClientWidth =
        btnRef?.current?.clientWidth || this.buttonElement?.clientWidth || 0;
      // how much further right the panel is from the button
      const offset = buttonElementOffsetLeft - innerElement.offsetLeft;
      // if the panel is left of the button leave its offset as is, otherwise move it right so it's level with the button.
      const dropdownOffset =
        offset < innerElement.offsetLeft ? offset : innerElement.offsetLeft;
      // offset the caret to line up with the middle of the button - note that the caret offset is relative to the panel, whereas
      // the offsets for the button/panel are relative to their container.
      const caretOffset = Math.max(
        buttonElementClientWidth / 2 -
          10 -
          (dropdownOffset - buttonElementOffsetLeft),
        0
      );

      this.setState({
        caretOffset: caretOffset >= 0 && caretOffset + "px",
        dropdownOffset: dropdownOffset + "px"
      });
    } else {
      this.setState({
        caretOffset: undefined,
        dropdownOffset: undefined
      });
    }
  },

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.forceClosed) {
      this.onDismissed();
    }
  },

  openWithUserClick(e) {
    if (this.props.userOnClick) {
      this.props.userOnClick();
    }
    this.openPanel(e);
  },

  render() {
    let iconGlyph;
    if (defined(Icon.GLYPHS[this.props.theme.icon])) {
      iconGlyph = Icon.GLYPHS[this.props.theme.icon];
    } else {
      iconGlyph = this.props.theme.icon;
    }

    return (
      <div className={classNames(Styles.panel, this.props.theme.outer)}>
        <button
          onClick={this.openWithUserClick}
          type="button"
          className={classNames(Styles.button, this.props.theme.btn, {
            [Styles.buttonForModalDropdown]: this.props.showDropdownAsModal
          })}
          title={this.props.btnTitle}
          ref={
            this.props.btnRef || ((element) => (this.buttonElement = element))
          }
          // eslint-disable-next-line react/no-unknown-property
          isOpen={this.isOpen()}
          css={`
            ${(p) =>
              p.isOpen &&
              `&:not(.foo) {
                background: ${p.theme.colorPrimary};
                svg {
                  fill: ${p.theme.textLight};
                }
              }`}
          `}
        >
          {this.props.theme.icon && <Icon glyph={iconGlyph} />}
          {this.props.btnText && <span>{this.props.btnText}</span>}
        </button>
        {this.isOpen() && (
          <InnerPanel
            showDropdownInCenter={this.props.showDropdownInCenter}
            showDropdownAsModal={this.props.showDropdownAsModal}
            modalWidth={this.props.modalWidth}
            onDismissed={this.onDismissed}
            innerRef={this.onInnerMounted}
            doNotCloseFlag={this.getDoNotCloseFlag()}
            theme={this.props.theme}
            caretOffset={this.state.caretOffset}
            dropdownOffset={this.state.dropdownOffset}
            disableCloseOnFocusLoss={this.props.disableCloseOnFocusLoss}
          >
            {this.props.children}
          </InnerPanel>
        )}
      </div>
    );
  }
});

export default DropdownPanel;
