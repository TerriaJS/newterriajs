"use strict";

import { Component } from "react";

import PropTypes from "prop-types";

import defined from "terriajs-cesium/Source/Core/defined";

import Styles from "./parameter-editors.scss";

import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import UserDrawing from "../../Models/UserDrawing";
import { withTranslation } from "react-i18next";
import { observer } from "mobx-react";
import { runInAction } from "mobx";
import CommonStrata from "../../Models/Definition/CommonStrata";

@observer
class PolygonParameterEditor extends Component {
  static propTypes = {
    previewed: PropTypes.object,
    parameter: PropTypes.object,
    viewState: PropTypes.object,
    t: PropTypes.func.isRequired
  };

  setValueFromText(e) {
    PolygonParameterEditor.setValueFromText(e, this.props.parameter);
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
          {t("analytics.clickToDrawPolygon")}
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
PolygonParameterEditor.setValueFromText = function (e, parameter) {
  parameter.setValue(CommonStrata.user, [JSON.parse(e.target.value)]);
};

/**
 * Given a value, return it in human readable form for display.
 * @param {Object} value Native format of parameter value.
 * @return {String} String for display
 */
export function getDisplayValue(value) {
  if (!defined(value) || value.length < 1) {
    return "";
  }
  const pointsLongLats = value[0];

  let polygon = "";
  for (let i = 0; i < pointsLongLats.length; i++) {
    polygon +=
      "[" +
      pointsLongLats[i][0].toFixed(3) +
      ", " +
      pointsLongLats[i][1].toFixed(3) +
      "]";
    if (i !== pointsLongLats.length - 1) {
      polygon += ", ";
    }
  }
  if (polygon.length > 0) {
    return "[" + polygon + "]";
  } else {
    return "";
  }
}

/**
 * Helper function for processing clicked/moved points.
 */
function getPointsLongLats(pointEntities, terria) {
  const pointEnts = pointEntities.entities.values;
  const pointsLongLats = [];
  for (let i = 0; i < pointEnts.length; i++) {
    const currentPoint = pointEnts[i];
    const currentPointPos = currentPoint.position.getValue(
      terria.timelineClock.currentTime
    );
    const cartographic =
      Ellipsoid.WGS84.cartesianToCartographic(currentPointPos);
    const points = [];
    points.push(CesiumMath.toDegrees(cartographic.longitude));
    points.push(CesiumMath.toDegrees(cartographic.latitude));
    pointsLongLats.push(points);
  }

  // Close the polygon.
  if (pointsLongLats.length > 0) {
    pointsLongLats.push(pointsLongLats[0]);
  }

  return pointsLongLats;
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
    onPointClicked: function (pointEntities) {
      runInAction(() => {
        parameter.setValue(CommonStrata.user, [
          getPointsLongLats(pointEntities, terria)
        ]);
      });
    },
    onCleanUp: function () {
      viewState.openAddData();
    },
    onPointMoved: function (customDataSource) {
      runInAction(() => {
        parameter.setValue(CommonStrata.user, [
          getPointsLongLats(customDataSource, terria)
        ]);
      });
    }
  });
  userDrawing.enterDrawMode();
}

export default withTranslation()(PolygonParameterEditor);
