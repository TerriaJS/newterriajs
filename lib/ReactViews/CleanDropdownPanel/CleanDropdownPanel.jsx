"use strict";
// Ref now needs to be passed in via refForCaret as there is no longer a button
// in CleanDropdownPanel

// proptypes are in mixin
/* eslint react/prop-types:0*/

import createReactClass from "create-react-class";
// import Icon from "../../Icon";
import InnerPanel from "../Map/Panels/InnerPanel";
import BaseOuterPanel from "../Map/Panels/BaseOuterPanel";

// import Styles from "./panel.scss";
import Box from "../../Styled/Box";

// import defined from "terriajs-cesium/Source/Core/defined";

const CleanDropdownPanel = createReactClass({
  displayName: "CleanDropdownPanel",
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
    const refForCaret =
      this.props.refForCaret && this.props.refForCaret.current;
    if (centerInnerDropdown) {
      this.setState({
        caretOffset: "50%",
        dropdownOffset: "50%"
      });
    } else if (innerElement && refForCaret) {
      // how much further right the panel is from the button
      const offset = refForCaret.offsetLeft - innerElement.offsetLeft;
      // if the panel is left of the button leave its offset as is, otherwise move it right so it's level with the button.
      const dropdownOffset =
        offset < innerElement.offsetLeft ? offset : innerElement.offsetLeft;
      // offset the caret to line up with the middle of the button - note that the caret offset is relative to the panel, whereas
      // the offsets for the button/panel are relative to their container.
      const caretOffset = Math.max(
        refForCaret.clientWidth / 2 -
          10 -
          (dropdownOffset - refForCaret.offsetLeft),
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

  render() {
    return (
      <Box
        styledWidth={"auto"}
        className={this.props.theme.outer}
        css={`
          // unfortunately this is probably the quickest way to deal with the
          // mix of scss+styled-components atm
          .tjs-sc-InnerPanelCloseButton {
            svg:not(:hover):not(:focus) {
              fill: ${(p) => p.theme.textLight};
            }
            svg {
              height: 12px;
              width: 12px;
            }
          }
          max-width: calc(100vw - 10px);
          ${this.props.cleanDropdownPanelStyles}
        `}
      >
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
          >
            {this.props.children}
          </InnerPanel>
        )}
      </Box>
    );
  }
});

export default CleanDropdownPanel;
