"use strict";
const React = require("react");
const PropTypes = require("prop-types");
import classNames from "classnames";
import { observer } from "mobx-react";
import { withTranslation } from "react-i18next";
import { Category, ViewAction } from "../../Core/AnalyticEvents/analyticEvents";
import Icon, { StyledIcon } from "../../Styled/Icon";
import withControlledVisibility from "../HOCs/withControlledVisibility";
import { withViewState } from "../Context";
import Styles from "./full_screen_button.scss";
import Button from "../../Styled/Button";
import Branding from "./Branding";

// The button to make the map full screen and hide the workbench.
@observer
class FullScreenButton extends React.Component {
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
    if (this.props.viewState.isMapFullScreen) {
      return <span>{btnText}</span>;
    }
  }

  render() {
    const { t } = this.props;
    return (
      <div
        className={classNames(Styles.fullScreen, {
          [Styles.minifiedFullscreenBtnWrapper]: this.props.minified,
          [Styles.trainerBarVisible]: this.props.viewState.trainerBarVisible,
          [Styles.fullScreenWrapper]:
            this.props.viewState.isMapFullScreen && !this.props.minified
        })}
      >
        {this.props.minified && (
          <label className={Styles.toggleWorkbench} htmlFor="toggle-workbench">
            {this.props.btnText}
          </label>
        )}
        {this.props.viewState.isMapFullScreen && !this.props.minified && (
          <Branding />
        )}
        <Button
          id="toggle-workbench"
          css={`
            border-radius: 0 4px 4px 0;
            ${this.props.viewState.isMapFullScreen === false
              ? `width: 16px;
            padding: 0px;`
              : `width: 100%; border-radius: 0;`}
          `}
          primary
          textProps={{
            medium: true
          }}
          onClick={() => this.toggleFullScreen()}
          aria-label={
            this.props.viewState.isMapFullScreen
              ? t("sui.showWorkbench", {
                  count: this.props.viewState.terria.workbench.items.length
                })
              : t("sui.hideWorkbench")
          }
          title={
            this.props.viewState.isMapFullScreen
              ? t("sui.showWorkbench", {
                  count: this.props.viewState.terria.workbench.items.length
                })
              : t("sui.hideWorkbench")
          }
          renderIcon={() =>
            this.props.viewState.isMapFullScreen ? (
              <StyledIcon styledWidth="12px" light glyph={Icon.GLYPHS.right} />
            ) : (
              <StyledIcon
                css="margin-right: 2px;"
                light
                styledWidth="12px"
                glyph={Icon.GLYPHS.left}
              />
            )
          }
        >
          {this.renderButtonText()}
        </Button>
      </div>
    );
  }
}

export default withTranslation()(
  withViewState(withControlledVisibility(FullScreenButton))
);
