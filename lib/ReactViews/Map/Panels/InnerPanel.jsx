import React from "react";
import PropTypes from "prop-types";
import createReactClass from "create-react-class";
import classNames from "classnames";

import defined from "terriajs-cesium/Source/Core/defined";
import { withTranslation } from "react-i18next";

import Styles from "./panel.scss";
import Icon from "../../../Styled/Icon";

const InnerPanel = createReactClass({
  propTypes: {
    /**
     * A property that will be looked for on window click events - if it's set, the click event will not cause the
     * panel to close.
     */
    doNotCloseFlag: PropTypes.string,
    /** Disable closing on loss of focus and only allow with close button */
    disableCloseOnFocusLoss: PropTypes.bool,
    /** Will be called when the panel has finished hiding */
    onDismissed: PropTypes.func,
    /** Animate as modal instead of dropdown */
    showDropdownAsModal: PropTypes.bool,

    /** show panel centered instead of offset toward the left */
    showDropdownInCenter: PropTypes.bool,

    /** Relative width to draw from */
    modalWidth: PropTypes.number,
    /** Theme to style components */
    theme: PropTypes.object,
    /** How far the caret at the top of the panel should be from its left, as CSS (so #px or #% are both valid) */
    caretOffset: PropTypes.string,
    /** Will be passed as "ref" to the outermost element */
    innerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
    /** How far the dropdown should be offset from the left of the container. */
    dropdownOffset: PropTypes.string,

    children: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.element),
      PropTypes.element
    ]),
    t: PropTypes.func.isRequired
  },

  getDefaultProps() {
    return {
      onDismissed: () => {}
    };
  },

  getInitialState() {
    return {};
  },

  componentDidMount() {
    this.escKeyListener = (e) => {
      if (e.keyCode === 27) {
        this.close(e);
      }
    };
    window.addEventListener("click", this.close);
    window.addEventListener("keydown", this.escKeyListener, true);
    setTimeout(() => this.setState({ isOpenCss: true }));
  },

  componentWillUnmount() {
    this.cleanListeners();
  },

  cleanListeners() {
    window.removeEventListener("click", this.close);
    window.removeEventListener("keydown", this.escKeyListener, true);
  },

  forceClose() {
    this.cleanListeners();

    // If we're closing we want to immediately change the css class to cause it to animate shut, then when it's
    // finished actually stop it rendering with isOpen = false
    this.setState({
      isOpenCss: false
    });

    setTimeout(() => {
      this.props.onDismissed();
    }, 200); // TODO: Determine when it stops animating instead of duplicating the 200ms timeout?
  },

  close(e) {
    // Only close if this wasn't a click on an open/close button.
    if (
      (!this.props.doNotCloseFlag || !e[this.props.doNotCloseFlag]) &&
      !this.props.disableCloseOnFocusLoss
    ) {
      this.forceClose();
    }
  },

  render() {
    const { t } = this.props;
    return (
      <div
        className={classNames(
          // Until we break these few components out of sass, we'll use regular ol classnames
          "tjs-sc-InnerPanel",
          Styles.inner,
          this.props.theme.inner,
          { [Styles.isOpen]: this.state.isOpenCss },
          { [Styles.showDropdownAsModal]: this.props.showDropdownAsModal },
          { [Styles.showDropdownInCenter]: this.props.showDropdownInCenter }
        )}
        css={`
          background: ${(p) => p.theme.dark};
        `}
        ref={this.props.innerRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: this.props.modalWidth,
          left: this.props.dropdownOffset,
          // the modal should be right-aligned with the button
          right: "0px",
          transformOrigin: this.props.showDropdownInCenter
            ? "0 top"
            : this.props.caretOffset && `${this.props.caretOffset} top`
        }}
      >
        <button
          type="button"
          className={classNames(
            // Until we break these few components out of sass, we'll use regular ol classnames
            "tjs-sc-InnerPanelCloseButton",
            Styles.innerCloseBtn,
            {
              [Styles.innerCloseBtnForModal]: this.props.showDropdownAsModal
            }
          )}
          onClick={this.forceClose}
          title={t("general.close")}
          aria-label={t("general.close")}
          // eslint-disable-next-line react/no-unknown-property
          showDropdownAsModal={this.props.showDropdownAsModal}
          css={`
            svg {
              fill: ${(p) => p.theme.textLight};
            }
            &:hover,
            &:focus {
              svg {
                fill: ${(p) => p.theme.colorPrimary};
              }
            }
            ${(p) =>
              p.showDropdownAsModal &&
              `
                svg {
                  fill: ${p.theme.grey};
                }
            `}
          `}
        >
          <Icon glyph={Icon.GLYPHS.close} />
        </button>
        {defined(this.props.caretOffset) && !this.props.showDropdownAsModal && (
          <span
            className={classNames(Styles.caret, "tjs-sc-InnerPanel__caret")}
            style={{ left: this.props.caretOffset }}
            css={`
              background: ${(p) => p.theme.dark};
            `}
          />
        )}
        <div className={Styles.content}>{this.props.children}</div>
      </div>
    );
  }
});

export default withTranslation()(InnerPanel);
