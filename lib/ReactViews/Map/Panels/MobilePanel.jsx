// proptypes are in mixin.
/* eslint react/prop-types:0*/

import createReactClass from "create-react-class";

import MobileMenuItem from "../../Mobile/MobileMenuItem";
import BaseOuterPanel from "./BaseOuterPanel";
import InnerPanel from "./InnerPanel";

import Styles from "./panel.scss";

const MobilePanel = createReactClass({
  displayName: "MobilePanel",
  mixins: [BaseOuterPanel],

  getInitialState() {
    return {
      localIsOpen: false
    };
  },

  render() {
    return (
      <div>
        <MobileMenuItem
          onClick={this.openPanel}
          caption={this.props.btnText}
          icon={this.props.mobileIcon}
        />
        {this.isOpen() && (
          <>
            {/* The overlay doesn't actually need to do anything except block clicks, as InnerPanel will listen to the window */}
            <div className={Styles.overlay} />

            <InnerPanel
              theme={this.props.theme}
              caretOffset="15px"
              doNotCloseFlag={this.getDoNotCloseFlag()}
              onDismissed={this.onDismissed}
              disableCloseOnFocusLoss={this.disableCloseOnFocusLoss}
            >
              {this.props.children}
            </InnerPanel>
          </>
        )}
      </div>
    );
  }
});

export default MobilePanel;
