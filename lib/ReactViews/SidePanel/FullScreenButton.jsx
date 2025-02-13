import { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { observer } from "mobx-react";
import { withTranslation } from "react-i18next";
import { Category, ViewAction } from "../../Core/AnalyticEvents/analyticEvents";
import Icon from "../../Styled/Icon";
import withControlledVisibility from "../HOCs/withControlledVisibility";
import { withViewState } from "../Context";
import Styles from "./full_screen_button.scss";

// The button to make the map full screen and hide the workbench.
@observer
class FullScreenButton extends Component {
  static propTypes = {
    viewState: PropTypes.object.isRequired,
    btnText: PropTypes.string,
    minified: PropTypes.bool,
    animationDuration: PropTypes.number, // Defaults to 1 millisecond.
    t: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      isActive: false
    };
  }

  toggleFullScreen() {
    this.props.viewState.setIsMapFullScreen(
      !this.props.viewState.isMapFullScreen
    );

    // log a GA event
    this.props.viewState.terria.analytics?.logEvent(
      Category.view,
      this.props.viewState.isMapFullScreen
        ? ViewAction.exitFullScreen
        : ViewAction.enterFullScreen
    );
  }

  renderButtonText() {
    const btnText = this.props.btnText ? this.props.btnText : null;
    if (this.props.minified) {
      if (this.props.viewState.isMapFullScreen) {
        return <Icon glyph={Icon.GLYPHS.right} />;
      } else {
        return <Icon glyph={Icon.GLYPHS.closeLight} />;
      }
    }
    return (
      <>
        <span>{btnText}</span>
        <Icon glyph={Icon.GLYPHS.right} />
      </>
    );
  }

  render() {
    const btnClassName = classNames(Styles.btn, {
      [Styles.isActive]: this.props.viewState.isMapFullScreen,
      [Styles.minified]: this.props.minified
    });
    const { t } = this.props;
    return (
      <div
        className={classNames(Styles.fullScreen, {
          [Styles.minifiedFullscreenBtnWrapper]: this.props.minified,
          [Styles.trainerBarVisible]: this.props.viewState.trainerBarVisible
        })}
      >
        {this.props.minified && (
          <label className={Styles.toggleWorkbench} htmlFor="toggle-workbench">
            {this.props.btnText}
          </label>
        )}
        <button
          type="button"
          id="toggle-workbench"
          aria-label={
            this.props.viewState.isMapFullScreen
              ? t("sui.showWorkbench")
              : t("sui.hideWorkbench")
          }
          onClick={() => this.toggleFullScreen()}
          className={btnClassName}
          title={
            this.props.viewState.isMapFullScreen
              ? t("sui.showWorkbench")
              : t("sui.hideWorkbench")
          }
        >
          {this.renderButtonText()}
        </button>
      </div>
    );
  }
}

export default withTranslation()(
  withViewState(withControlledVisibility(FullScreenButton))
);
