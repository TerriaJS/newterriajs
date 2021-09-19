"use strict";
import classNames from "classnames";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";
import Icon from "../../../Styled/Icon";
import Styles from "./display-as-percent.scss";

const DisplayAsPercentSection = createReactClass({
  displayName: "DisplayAsPercentSection",

  propTypes: {
    item: PropTypes.object,
    t: PropTypes.func.isRequired
  },

  togglePercentage() {
    this.props.item.displayPercent = !this.props.item.displayPercent;
  },

  render() {
    if (!this.props.item.canDisplayPercent) {
      return null;
    }
    const { t } = this.props;
    return (
      <label className={Styles.main}>
        <button
          type="button"
          onClick={this.togglePercentage}
          className={classNames(Styles.btn, {
            [Styles.btnActive]: this.props.item.displayPercent,
            [Styles.btnInactive]: !this.props.item.displayPercent
          })}
        >
          {this.props.item.displayPercent ? (
            <Icon glyph={Icon.GLYPHS.checkboxOn} />
          ) : (
            <Icon glyph={Icon.GLYPHS.checkboxOff} />
          )}
          <span>{t("workbench.displayPercent")}</span>
        </button>
      </label>
    );
  }
});
module.exports = withTranslation()(DisplayAsPercentSection);
