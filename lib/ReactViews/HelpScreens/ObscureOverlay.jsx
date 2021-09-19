"use strict";
import classNames from "classnames";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import defined from "terriajs-cesium/Source/Core/defined";
import ObserverModelMixin from "../ObserveModelMixin";
import Styles from "./obscure-overlay.scss";

/**
 * This provides five panels. Four are rectangle elements that go above, left, right, and below the highlighted element
 * to grey out the rest of the screen. A fifth panel, which is clear, covers the whole screen to prevent the highlighted
 * element from being selectable.
 */
const ObscureOverlay = createReactClass({
  displayName: "ObscureOverlay",
  mixins: [ObserverModelMixin],

  propTypes: {
    helpViewState: PropTypes.object
  },

  cancel() {
    this.props.helpViewState.cancel = true;
  },

  advance() {
    this.props.helpViewState.advance = true;
  },

  render() {
    const helpScreen = this.props.helpViewState.currentScreen;
    if (!defined(helpScreen) || !defined(helpScreen.rectangle)) {
      return false;
    }

    // Top
    const topOverlayPositionLeft = 0 + "px";
    const topOverlayPositionTop = 0 + "px";
    const topOverlayHeight = helpScreen.rectangle.top + "px";
    const topOverlayWidth = "100%";

    // Left
    const leftOverlayPositionLeft = 0 + "px";
    const leftOverlayPositionTop = helpScreen.rectangle.top + "px";
    const leftOverlayHeight = helpScreen.rectangle.height + "px";
    const leftOverlayWidth = helpScreen.rectangle.left + "px";

    // Right
    const rightOverlayPositionLeft = helpScreen.rectangle.right + "px";
    const rightOverlayPositionTop = helpScreen.rectangle.top + "px";
    const rightOverlayHeight = helpScreen.rectangle.height + "px";
    const rightOverlayWidth = "100%";

    // Bottom
    const bottomOverlayPositionLeft = 0 + "px";
    const bottomOverlayPositionTop = helpScreen.rectangle.bottom + "px";
    const bottomOverlayHeight = "100%";
    const bottomOverlayWidth = "100%";

    const windowClass = classNames(Styles.window, {
      [Styles.isActive]: helpScreen
    });
    return (
      <div className={windowClass} aria-hidden={!helpScreen}>
        <div
          className={Styles.topOverlay}
          style={{
            left: topOverlayPositionLeft,
            top: topOverlayPositionTop,
            width: topOverlayWidth,
            height: topOverlayHeight
          }}
          onClick={this.cancel}
        />
        <div
          className={Styles.leftOverlay}
          style={{
            left: leftOverlayPositionLeft,
            top: leftOverlayPositionTop,
            width: leftOverlayWidth,
            height: leftOverlayHeight
          }}
          onClick={this.cancel}
        />
        <div
          className={Styles.rightOverlay}
          style={{
            left: rightOverlayPositionLeft,
            top: rightOverlayPositionTop,
            width: rightOverlayWidth,
            height: rightOverlayHeight
          }}
          onClick={this.cancel}
        />
        <div
          className={Styles.bottomOverlay}
          style={{
            left: bottomOverlayPositionLeft,
            top: bottomOverlayPositionTop,
            width: bottomOverlayWidth,
            height: bottomOverlayHeight
          }}
          onClick={this.cancel}
        />
        <div className={Styles.clearOverlay} onClick={this.advance} />
      </div>
    );
  }
});

module.exports = ObscureOverlay;
