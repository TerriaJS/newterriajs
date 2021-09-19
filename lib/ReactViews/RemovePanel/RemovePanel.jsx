import ObserveModelMixin from "../ObserveModelMixin";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import Styles from "./remove-panel.scss";
import classNames from "classnames";
import { withTranslation } from "react-i18next";

const RemoveStoryPanel = createReactClass({
  displayName: "NotificationWindow",
  mixins: [ObserveModelMixin],
  propTypes: {
    removeText: PropTypes.string,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    confirmButtonTitle: PropTypes.string,
    cancelButtonTitle: PropTypes.string,
    t: PropTypes.func.isRequired
  },

  render() {
    const { t } = this.props;
    return (
      <div className={Styles.outerDiv}>
        <div className={Styles.popup}>
          <div className={Styles.inner}>
            <p className={Styles.title}>
              <strong>{this.props.removeText}</strong>
            </p>
            <div className={Styles.footer}>
              <button
                className={classNames(Styles.btn, Styles.delete)}
                onClick={this.props.onConfirm}
                type="button"
              >
                {this.props.confirmButtonTitle || t("general.delete")}
              </button>
              <button
                className={classNames(Styles.btn, Styles.cancel)}
                onClick={this.props.onCancel}
                type="button"
              >
                {this.props.cancelButtonTitle || t("general.cancel")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = withTranslation()(RemoveStoryPanel);
