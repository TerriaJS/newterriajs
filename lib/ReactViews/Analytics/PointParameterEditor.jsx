"use strict";

import createReactClass from "create-react-class";

import PropTypes from "prop-types";

import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import defined from "terriajs-cesium/Source/Core/defined";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";

import MapInteractionMode from "../../Models/MapInteractionMode";

import Styles from "./parameter-editors.scss";
import { runInAction, autorun } from "mobx";
import { withTranslation } from "react-i18next";
import CommonStrata from "../../Models/Definition/CommonStrata";

const PointParameterEditor = createReactClass({
  displayName: "PointParameterEditor",

  propTypes: {
    previewed: PropTypes.object,
    parameter: PropTypes.object,
    viewState: PropTypes.object,
    parameterViewModel: PropTypes.object,
    t: PropTypes.func.isRequired
  },

  inputOnChange(e) {
    const text = e.target.value;
    this.props.parameterViewModel.userValue = text;
    this.props.parameterViewModel.isValueValid =
      PointParameterEditor.setValueFromText(e, this.props.parameter);
  },

  inputOnBlur(_e) {
    const isCurrentlyInvalid = !this.props.parameterViewModel.isValueValid;
    this.props.parameterViewModel.wasEverBlurredWhileInvalid =
      this.props.parameterViewModel.wasEverBlurredWhileInvalid ||
      isCurrentlyInvalid;
  },

  selectPointOnMap() {
    selectOnMap(
      this.props.previewed.terria,
      this.props.viewState,
      this.props.parameter,
      this.props.t("analytics.selectLocation")
    );
  },

  getDisplayValue() {
    // Show the user's value if they've done any editing.
    if (defined(this.props.parameterViewModel.userValue)) {
      return this.props.parameterViewModel.userValue;
    }

    // Show the parameter's value if there is one.
    return getDisplayValue(this.props.parameter.value);
  },

  render() {
    const parameterViewModel = this.props.parameterViewModel;
    const showErrorMessage =
      !parameterViewModel.isValueValid &&
      parameterViewModel.wasEverBlurredWhileInvalid;
    const style = showErrorMessage ? Styles.fieldInvalid : Styles.field;
    const { t } = this.props;
    return (
      <div>
        {showErrorMessage && (
          <div className={Styles.warningText}>
            {t("analytics.enterValidCoords")}
          </div>
        )}
        <input
          className={style}
          type="text"
          onChange={this.inputOnChange}
          onBlur={this.inputOnBlur}
          value={this.getDisplayValue()}
          placeholder="131.0361, -25.3450"
        />
        <button
          type="button"
          onClick={this.selectPointOnMap}
          className={Styles.btnSelector}
        >
          {t("analytics.selectLocation")}
        </button>
      </div>
    );
  }
});

/**
 * Triggered when user types value directly into field.
 * @param {String} e Text that user has entered manually.
 * @param {FunctionParameter} parameter Parameter to set value on.
 * @returns {Boolean} True if the value was set successfully; false if the value could not be parsed.
 */
PointParameterEditor.setValueFromText = function (e, parameter) {
  const text = e.target.value;

  if (text.trim().length === 0 && !parameter.isRequired) {
    parameter.setValue(CommonStrata.user, undefined);
    return true;
  }

  // parseFloat will ignore non-numeric characters at the end of the string.
  // e.g. "5asdf" will be parsed successfully as "5".
  // So we reject the text if there are any characters in it other than
  // 0-9, whitespace, plus, minus, comma, and period.
  // This isn't perfect - some strings may still parse even though they
  // don't make sense, like "0..9,1.2.3" - but it will at least eliminate
  // common errors like trying to specify degrees/minutes/seconds or
  // specifying W or E rather than using positive or negative numbers
  // for longitude.
  if (/[^\d\s.,+-]/.test(text)) {
    return false;
  }

  const coordinates = text.split(",");
  if (coordinates.length === 2) {
    const longitude = parseFloat(coordinates[0]);
    const latitude = parseFloat(coordinates[1]);
    if (isNaN(longitude) || isNaN(latitude)) {
      return false;
    }
    parameter.setValue(
      CommonStrata.user,
      Cartographic.fromDegrees(
        parseFloat(coordinates[0]),
        parseFloat(coordinates[1])
      )
    );
    return true;
  } else {
    return false;
  }
};

/**
 * Given a value, return it in human readable form for display.
 * @param {Object} value Native format of parameter value.
 * @return {String} String for display
 */
export function getDisplayValue(value) {
  const digits = 5;

  if (defined(value)) {
    return (
      CesiumMath.toDegrees(value.longitude).toFixed(digits) +
      "," +
      CesiumMath.toDegrees(value.latitude).toFixed(digits)
    );
  } else {
    return "";
  }
}

/**
 * Prompt user to select/draw on map in order to define parameter.
 * @param {Terria} terria Terria instance.
 * @param {Object} viewState ViewState.
 * @param {FunctionParameter} parameter Parameter.
 */
export function selectOnMap(terria, viewState, parameter, interactionMessage) {
  runInAction(() => {
    // Cancel any feature picking already in progress.
    terria.pickedFeatures = undefined;
  });

  let pickedFeaturesSubscription;
  const pickPointMode = new MapInteractionMode({
    message: interactionMessage,
    onCancel: function () {
      terria.mapInteractionModeStack.pop();
      viewState.openAddData();
      if (pickedFeaturesSubscription) {
        pickedFeaturesSubscription.dispose();
      }
    }
  });

  runInAction(() => {
    terria.mapInteractionModeStack.push(pickPointMode);
  });

  autorun((reaction) => {
    pickedFeaturesSubscription = reaction;
    if (pickPointMode.pickedFeatures) {
      const pickedFeatures = pickPointMode.pickedFeatures;
      if (pickedFeatures.pickPosition) {
        runInAction(() => {
          const value = Ellipsoid.WGS84.cartesianToCartographic(
            pickedFeatures.pickPosition
          );
          terria.mapInteractionModeStack.pop();
          parameter.setValue(CommonStrata.user, value);
          viewState.openAddData();
        });
      }
      pickedFeaturesSubscription.dispose();
    }
  });

  runInAction(() => {
    viewState.explorerPanelIsVisible = false;
  });
}

export default withTranslation()(PointParameterEditor);
