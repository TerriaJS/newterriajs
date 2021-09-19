import classNames from "classnames";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";

import Styles from "./explorer-window.scss";

const SLIDE_DURATION = 300;

const ModalPopup = createReactClass({
  propTypes: {
    isVisible: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    viewState: PropTypes.object.isRequired,
    onStartAnimatingIn: PropTypes.func,
    onDoneAnimatingIn: PropTypes.func,
    children: PropTypes.node.isRequired,
    isTopElement: PropTypes.bool,
    t: PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      isMounted: false,
      visible: undefined
    };
  },

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillMount() {
    this.onVisibilityChange(this.props.isVisible);
  },

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.isVisible !== this.props.isVisible) {
      this.onVisibilityChange(this.props.isVisible);
    }
  },

  componentDidMount() {
    this.escKeyListener = e => {
      // Only explicitly check share modal state, move to levels/"layers of modals" logic if we need to go any deeper
      if (e.keyCode === 27 && !this.props.viewState.shareModalIsVisible) {
        this.props.onClose();
      }
    };
    window.addEventListener("keydown", this.escKeyListener, true);
  },

  onVisibilityChange(isVisible) {
    if (isVisible) {
      this.slideIn();
    } else {
      this.slideOut();
    }
  },

  slideIn() {
    if (this.props.onStartAnimatingIn) {
      this.props.onStartAnimatingIn();
    }

    this.setState({
      visible: true
    });
    setTimeout(() => {
      this.setState({
        slidIn: true
      });

      setTimeout(() => {
        if (this.props.onDoneAnimatingIn) {
          this.props.onDoneAnimatingIn();
        }
      }, SLIDE_DURATION);
    });
  },

  slideOut() {
    this.setState({
      slidIn: false
    });
    setTimeout(() => {
      this.setState({
        visible: false
      });
    }, SLIDE_DURATION);
  },

  componentWillUnmount() {
    window.removeEventListener("keydown", this.escKeyListener, true);
  },

  render() {
    const { t } = this.props;
    const visible = this.state.visible;

    return visible ? (
      <div
        className={classNames(
          Styles.modalWrapper,
          this.props.isTopElement ? "top-element" : ""
        )}
        id="explorer-panel-wrapper"
        aria-hidden={!visible}
      >
        <div
          onClick={this.props.onClose}
          id="modal-overlay"
          className={Styles.modalOverlay}
          tabIndex="-1"
        />
        <div
          id="explorer-panel"
          className={classNames(Styles.explorerPanel, Styles.modalContent, {
            [Styles.isMounted]: this.state.slidIn
          })}
          aria-labelledby="modalTitle"
          aria-describedby="modalDescription"
          role="dialog"
        >
          <button
            type="button"
            onClick={this.props.onClose}
            className={Styles.btnCloseModal}
            title={t("addData.closeDataPanel")}
            data-target="close-modal"
          >
            {t("addData.done")}
          </button>
          {this.props.children}
        </div>
      </div>
    ) : null;
  }
});

module.exports = withTranslation()(ModalPopup);
