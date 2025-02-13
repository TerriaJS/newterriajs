"use strict";

import { Component } from "react";

import PropTypes from "prop-types";

import defined from "terriajs-cesium/Source/Core/defined";

import Styles from "./parameter-editors.scss";

import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import UserDrawing from "../../Models/UserDrawing";
import { withTranslation } from "react-i18next";
import { observer } from "mobx-react";
import { runInAction } from "mobx";
import CommonStrata from "../../Models/Definition/CommonStrata";

@observer
class RectangleParameterEditor extends Component {
  static propTypes = {
    previewed: PropTypes.object,
    parameter: PropTypes.object,
    viewState: PropTypes.object,
    t: PropTypes.func.isRequired
  };

  setValueFromText(e) {
    RectangleParameterEditor.setValueFromText(e, this.props.parameter);
  }

  selectPolygonOnMap() {
    selectOnMap(
      this.props.previewed.terria,
      this.props.viewState,
      this.props.parameter
    );
  }

  render() {
    const { t } = this.props;
    return (
      <div>
        <input
          className={Styles.field}
          type="text"
          onChange={this.setValueFromText.bind(this)}
          value={getDisplayValue(this.props.parameter.value)}
        />
        <button
          type="button"
          onClick={this.selectPolygonOnMap.bind(this)}
          className={Styles.btnSelector}
        >
          {t("analytics.clickToDrawRectangle")}
        </button>
      </div>
    );
  }
}

/**
 * Triggered when user types value directly into field.
 * @param {String} e Text that user has entered manually.
 * @param {FunctionParameter} parameter Parameter to set value on.
 */
RectangleParameterEditor.setValueFromText = function (e, parameter) {
  parameter.setValue(CommonStrata.user, [JSON.parse(e.target.value)]);
};

/**
 * Given a value, return it in human readable form for display.
 * @param {Object} value Native format of parameter value.
 * @return {String} String for display
 */
export function getDisplayValue(value) {
  if (!defined(value)) {
    return "";
  }
  return `${value.east}, ${value.north}, ${value.west}, ${value.south}`;
}

/**
 * Prompt user to select/draw on map in order to define parameter.
 * @param {Terria} terria Terria instance.
 * @param {Object} viewState ViewState.
 * @param {FunctionParameter} parameter Parameter.
 */
export function selectOnMap(terria, viewState, parameter) {
  const userDrawing = new UserDrawing({
    terria: terria,
    drawRectangle: true,
    onCleanUp: function () {
      viewState.openAddData();
    },
    onDrawingComplete: function (params) {
      if (params.points) {
        const cartographicPoints = params.points.map((point) => {
          const cartographic = Cartographic.fromCartesian(
            point,
            Ellipsoid.WGS84
          );
          return {
            latitude: CesiumMath.toDegrees(cartographic.latitude),
            longitude: CesiumMath.toDegrees(cartographic.longitude)
          };
        });
        const rectangle = {
          west: cartographicPoints[0].longitude,
          south: cartographicPoints[0].latitude,
          east: cartographicPoints[1].longitude,
          north: cartographicPoints[1].latitude
        };
        runInAction(() => {
          parameter.setValue(CommonStrata.user, rectangle);
        });
      }
    }
  });

  userDrawing.enterDrawMode();
}

export default withTranslation()(RectangleParameterEditor);
