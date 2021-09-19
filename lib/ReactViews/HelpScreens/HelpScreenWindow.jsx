"use strict";
import classNames from "classnames";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";
import defined from "terriajs-cesium/Source/Core/defined";
import HelpViewState from "../../ReactViewModels/HelpViewState";
import parseCustomHtmlToReact from "../Custom/parseCustomHtmlToReact";
import ObserverModelMixin from "../ObserveModelMixin";
import Styles from "./help-screen-window.scss";

const HelpScreenWindow = createReactClass({
  displayName: "HelpScreenWindow",
  mixins: [ObserverModelMixin],

  propTypes: {
    helpViewState: PropTypes.object,
    t: PropTypes.func.isRequired
  },

  render() {
    const currentScreen = this.props.helpViewState.currentScreen;
    if (!defined(currentScreen) || !defined(currentScreen.rectangle)) {
      return false;
    }
    const windowClass = classNames(Styles.window, {
      [Styles.isActive]: currentScreen
    });
    const { t } = this.props;
    const buttonText =
      currentScreen &&
      currentScreen.totalNumberOfScreens === currentScreen.currentScreenNumber
        ? t("helpMenu.done")
        : t("helpMenu.next");
    const positionLeft = calculateLeftPosition(currentScreen);
    const positionTop = calculateTopPosition(currentScreen);

    const caretTop = currentScreen && currentScreen.caretTop;
    const caretLeft = currentScreen && currentScreen.caretLeft;

    const width = currentScreen && currentScreen.width;

    return (
      <div
        style={{
          left: positionLeft + "px",
          top: positionTop + "px",
          width: width + "px"
        }}
        className={windowClass}
        aria-hidden={!currentScreen}
      >
        <span
          style={{ left: caretLeft + "px", top: caretTop + "px" }}
          className={Styles.caret}
        />
        <div className={Styles.content}>
          {parseCustomHtmlToReact(currentScreen && currentScreen.message())}
        </div>
        <div className={Styles.screenCount}>
          <strong>
            {currentScreen &&
              currentScreen.currentScreenNumber +
                "/" +
                currentScreen.totalNumberOfScreens}
          </strong>
        </div>
        <div className={Styles.nextButton}>
          <button
            type="button"
            onClick={currentScreen && currentScreen.onNext}
            className={Styles.btn}
          >
            <strong>{buttonText}</strong>
          </button>
        </div>
      </div>
    );
  }
});

/**
 * Work out the screen pixel value for left positioning based on helpScreen parameters.
 * @private
 */
function calculateLeftPosition(helpScreen) {
  const screenRect = helpScreen.rectangle;
  let leftPosition = 0;
  if (helpScreen.positionLeft === HelpViewState.RelativePosition.RECT_LEFT) {
    leftPosition = screenRect.left;
  } else if (
    helpScreen.positionLeft === HelpViewState.RelativePosition.RECT_RIGHT
  ) {
    leftPosition = screenRect.right;
  } else if (
    helpScreen.positionLeft === HelpViewState.RelativePosition.RECT_TOP
  ) {
    leftPosition = screenRect.top;
  } else if (
    helpScreen.positionLeft === HelpViewState.RelativePosition.RECT_BOTTOM
  ) {
    leftPosition = screenRect.bottom;
  }

  leftPosition += helpScreen.offsetLeft;
  return leftPosition;
}

/**
 * Work out the screen pixel value for top positioning based on helpScreen parameters.
 * @private
 */
function calculateTopPosition(helpScreen) {
  const screenRect = helpScreen.rectangle;
  let topPosition = 0;
  if (helpScreen.positionTop === HelpViewState.RelativePosition.RECT_LEFT) {
    topPosition = screenRect.left;
  } else if (
    helpScreen.positionTop === HelpViewState.RelativePosition.RECT_RIGHT
  ) {
    topPosition = screenRect.right;
  } else if (
    helpScreen.positionTop === HelpViewState.RelativePosition.RECT_TOP
  ) {
    topPosition = screenRect.top;
  } else if (
    helpScreen.positionTop === HelpViewState.RelativePosition.RECT_BOTTOM
  ) {
    topPosition = screenRect.bottom;
  }

  topPosition += helpScreen.offsetTop;
  return topPosition;
}

module.exports = withTranslation()(HelpScreenWindow);
