"use strict";

// proptypes are in mixin
/* eslint react/prop-types:0*/

import createReactClass from "create-react-class";
import Button from "../../../../Styled/Button";
import Icon from "../../../../Styled/Icon";
import BaseOuterPanel from "../BaseOuterPanel";
import InnerPanel from "../InnerPanel";
import { StyledIcon } from "../../../../Styled/Icon";

const StorySharePanel = createReactClass({
  displayName: "StorySharePanel",
  mixins: [BaseOuterPanel],

  getInitialState() {
    return {
      localIsOpen: false,
      caretOffset: undefined,
      dropdownOffset: undefined
    };
  },

  onInnerMounted(innerElement) {
    if (innerElement) {
      this.setState({
        caretOffset: "0px",
        dropdownOffset: "0px"
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
    if (this.props.onUserClick) {
      this.props.onUserClick();
    }
    this.openPanel(e);
  },

  onClose() {
    if (this.props.onUserClick) {
      this.props.onUserClick();
    }
    this.onDismissed();
  },

  render() {
    return (
      <>
        <Button
          fullWidth
          disabled={this.props.btnDisabled}
          title={this.props.btnTitle}
          primary
          renderIcon={() => (
            <StyledIcon glyph={Icon.GLYPHS.share} light styledWidth={"20px"} />
          )}
          textProps={{
            large: true
          }}
          onClick={this.openWithUserClick}
        >
          {this.props.btnText ? this.props.btnText : ""}
        </Button>
        {this.isOpen() && (
          <div
            css={`
              margin-top: 35px;
              font-family: ${(p) => p.theme.fontBase};
            `}
          >
            <InnerPanel
              showDropdownAsModal={this.props.showDropdownAsModal}
              modalWidth={this.props.modalWidth}
              onDismissed={this.onClose}
              innerRef={this.onInnerMounted}
              doNotCloseFlag={this.getDoNotCloseFlag()}
              theme={this.props.theme}
              caretOffset={this.state.caretOffset}
              dropdownOffset={this.state.dropdownOffset}
            >
              {this.props.children}
            </InnerPanel>
          </div>
        )}
      </>
    );
  }
});

export default StorySharePanel;
