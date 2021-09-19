import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import { observer } from "mobx-react";

import ModalPopup from "./ModalPopup";
import Tabs from "./Tabs";
import { runInAction } from "mobx";

const ExplorerWindow = observer(
  createReactClass({
    displayName: "ExplorerWindow",

    propTypes: {
      terria: PropTypes.object.isRequired,
      viewState: PropTypes.object.isRequired
    },

    onClose() {
      this.props.viewState.closeCatalog();
      this.props.viewState.switchMobileView("nowViewing");
    },

    onStartAnimatingIn() {
      runInAction(() => {
        this.props.viewState.explorerPanelAnimating = true;
      });
    },

    onDoneAnimatingIn() {
      runInAction(() => {
        this.props.viewState.explorerPanelAnimating = false;
      });
    },

    isVisible() {
      return (
        !this.props.viewState.useSmallScreenInterface &&
        !this.props.viewState.hideMapUi &&
        this.props.viewState.explorerPanelIsVisible
      );
    },

    render() {
      return (
        <ModalPopup
          viewState={this.props.viewState}
          isVisible={this.isVisible()}
          isTopElement={this.props.viewState.topElement === "AddData"}
          onClose={this.onClose}
          onStartAnimatingIn={this.onStartAnimatingIn}
          onDoneAnimatingIn={this.onDoneAnimatingIn}
        >
          <Tabs terria={this.props.terria} viewState={this.props.viewState} />
        </ModalPopup>
      );
    }
  })
);

module.exports = ExplorerWindow;
