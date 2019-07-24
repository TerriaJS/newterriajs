import React from "react";

import createReactClass from "create-react-class";
import { observer } from "mobx-react";

import PropTypes from "prop-types";

import classNames from "classnames";
import MobileMenuItem from "./MobileMenuItem";
import SettingPanel from "../Map/Panels/SettingPanel";
import SharePanel from "../Map/Panels/SharePanel/SharePanel";
import Terria from "../../Models/Terria";

import ViewState from "../../ReactViewModels/ViewState";

import Styles from "./mobile-menu.scss";
import { runInAction } from "mobx";

const MobileMenu = observer(
  createReactClass({
    displayName: "MobileMenu",

    propTypes: {
      menuItems: PropTypes.arrayOf(PropTypes.element),
      viewState: PropTypes.instanceOf(ViewState).isRequired,
      showFeedback: PropTypes.bool,
      terria: PropTypes.instanceOf(Terria).isRequired,
      allBaseMaps: PropTypes.array.isRequired
    },

    getDefaultProps() {
      return {
        menuItems: [],
        showFeedback: false
      };
    },

    toggleMenu() {
      runInAction(() => {
        this.props.viewState.mobileMenuVisible = !this.props.viewState
          .mobileMenuVisible;
      });
    },

    getInitialState() {
      return {};
    },

    onFeedbackFormClick() {
      runInAction(() => {
        this.props.viewState.feedbackFormIsVisible = true;
        this.props.viewState.mobileMenuVisible = false;
      });
    },

    hideMenu() {
      runInAction(() => {
        this.props.viewState.mobileMenuVisible = false;
      });
    },

    render() {
      // return this.props.viewState.mobileMenuVisible ? (
      return (
        <div>
          <If condition={this.props.viewState.mobileMenuVisible}>
            <div className={Styles.overlay} onClick={this.toggleMenu} />
          </If>
          <div
            className={classNames(Styles.mobileNav, {
              [Styles.mobileNavHidden]: !this.props.viewState.mobileMenuVisible
            })}
          >
            <div onClick={this.hideMenu}>
              <SettingPanel
                terria={this.props.terria}
                viewState={this.props.viewState}
              />
            </div>
            <div onClick={this.hideMenu}>
              <SharePanel
                terria={this.props.terria}
                viewState={this.props.viewState}
              />
            </div>
            <For each="menuItem" of={this.props.menuItems}>
              <div
                onClick={this.hideMenu}
                key={menuItem ? menuItem.key : undefined}
              >
                {menuItem}
              </div>
            </For>
            <If condition={this.props.showFeedback}>
              <MobileMenuItem
                onClick={this.onFeedbackFormClick}
                caption="Give Feedback"
              />
            </If>
          </div>
        </div>
      );
    }
  })
);

export default MobileMenu;
