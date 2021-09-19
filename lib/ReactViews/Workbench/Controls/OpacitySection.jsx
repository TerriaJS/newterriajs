"use strict";
import createReactClass from "create-react-class";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import Slider from "rc-slider";
import { withTranslation } from "react-i18next";
import CommonStrata from "../../../Models/Definition/CommonStrata";
import hasTraits from "../../../Models/Definition/hasTraits";
import RasterLayerTraits from "../../../Traits/TraitsClasses/RasterLayerTraits";
import Styles from "./opacity-section.scss";

const OpacitySection = observer(
  createReactClass({
    displayName: "OpacitySection",

    propTypes: {
      item: PropTypes.object.isRequired,
      t: PropTypes.func.isRequired
    },

    changeOpacity(value) {
      const item = this.props.item;
      if (hasTraits(item, RasterLayerTraits, "opacity")) {
        runInAction(() => {
          item.setTrait(CommonStrata.user, "opacity", value / 100.0);
        });
      }
    },

    render() {
      const item = this.props.item;
      const { t } = this.props;
      if (
        !hasTraits(item, RasterLayerTraits, "opacity") ||
        item.disableOpacityControl
      ) {
        return null;
      }
      return (
        <div className={Styles.opacity}>
          <label htmlFor="opacity">
            {t("workbench.opacity", {
              opacity: parseInt(item.opacity * 100, 10)
            })}
          </label>
          <Slider
            className={Styles.opacitySlider}
            min={0}
            max={100}
            value={(item.opacity * 100) | 0}
            onChange={this.changeOpacity}
          />
        </div>
      );
    }
  })
);

module.exports = withTranslation()(OpacitySection);
