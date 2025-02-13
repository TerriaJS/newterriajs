import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";
import defined from "terriajs-cesium/Source/Core/defined";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import CommonStrata from "../../Models/Definition/CommonStrata";
import UserDrawing from "../../Models/UserDrawing";
import Styles from "./parameter-editors.scss";

const LineParameterEditor = createReactClass({
  displayName: "LineParameterEditor",

  propTypes: {
    previewed: PropTypes.object,
    parameter: PropTypes.object,
    viewState: PropTypes.object,
    t: PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      userDrawing: new UserDrawing({
        terria: this.props.previewed.terria,
        onPointClicked: this.onPointClicked,
        onCleanUp: this.onCleanUp,
        allowPolygon: false
      })
    };
  },

  onCleanUp() {
    this.props.viewState.openAddData();
  },

  setValueFromText(e) {
    LineParameterEditor.setValueFromText(e, this.props.parameter);
  },

  onPointClicked(pointEntities) {
    const pointEnts = pointEntities.entities.values;
    const pointsLongLats = [];
    for (let i = 0; i < pointEnts.length; i++) {
      const currentPoint = pointEnts[i];

      const currentPointPos = currentPoint.position.getValue(
        this.props.previewed.terria.clock?.currentTime
      );
      const cartographic =
        Ellipsoid.WGS84.cartesianToCartographic(currentPointPos);
      const points = [];
      points.push(CesiumMath.toDegrees(cartographic.longitude));
      points.push(CesiumMath.toDegrees(cartographic.latitude));
      pointsLongLats.push(points);
    }
    this.props.parameter.setValue(CommonStrata.user, pointsLongLats);
  },

  selectLineOnMap() {
    this.state.userDrawing.enterDrawMode();
  },

  render() {
    const { t } = this.props;
    return (
      <div>
        <input
          className={Styles.field}
          type="text"
          onChange={this.setValueFromText}
          value={getDisplayValue(this.props.parameter.value)}
        />
        <button
          type="button"
          onClick={this.selectLineOnMap}
          className={Styles.btnSelector}
        >
          {t("analytics.clickToDrawLine")}
        </button>
      </div>
    );
  }
});

/**
 * Triggered when user types value directly into field.
 * @param {String} e Text that user has entered manually.
 * @param {FunctionParameter} parameter Parameter to set value on.
 */
LineParameterEditor.setValueFromText = function (e, parameter) {
  const coordinatePairs = e.target.value.split("], [");
  const pointsLongLats = [];
  for (let i = 0; i < coordinatePairs.length; i++) {
    let coordinates = coordinatePairs[i].replace("[", "").replace("]", "");
    coordinates = coordinates.split(",");

    if (coordinates.length >= 2) {
      const points = [];
      points.push(parseFloat(coordinates[0]));
      points.push(parseFloat(coordinates[1]));
      pointsLongLats.push(points);
    }
  }
  parameter.setValue(CommonStrata.user, pointsLongLats);
};

/**
 * Given a value, return it in human readable form for display.
 * @param {Object} value Native format of parameter value.
 * @return {String} String for display
 */
export function getDisplayValue(value) {
  const pointsLongLats = value;
  if (!defined(pointsLongLats) || pointsLongLats.length < 1) {
    return "";
  }

  let line = "";
  for (let i = 0; i < pointsLongLats.length; i++) {
    line +=
      "[" +
      pointsLongLats[i][0].toFixed(3) +
      ", " +
      pointsLongLats[i][1].toFixed(3) +
      "]";
    if (i !== pointsLongLats.length - 1) {
      line += ", ";
    }
  }
  if (line.length > 0) {
    return line;
  } else {
    return "";
  }
}

export default withTranslation()(LineParameterEditor);
