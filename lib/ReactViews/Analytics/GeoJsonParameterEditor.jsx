import { Component } from "react";
import PropTypes from "prop-types";
import defined from "terriajs-cesium/Source/Core/defined";
import Styles from "./parameter-editors.scss";
import {
  selectOnMap as selectPointOnMap,
  getDisplayValue as getPointParameterDisplayValue
} from "./PointParameterEditor";
import {
  selectOnMap as selectPolygonOnMap,
  getDisplayValue as getPolygonParameterDisplayValue
} from "./PolygonParameterEditor";
import {
  selectOnMap as selectExistingPolygonOnMap,
  getDisplayValue as getExistingPolygonParameterDisplayValue
} from "./SelectAPolygonParameterEditor";
import { getDisplayValue as getRegionPickerDisplayValue } from "./RegionPicker";
import GeoJsonParameter from "../../Models/FunctionParameters/GeoJsonParameter";
import { withTranslation } from "react-i18next";
import { observer } from "mobx-react";
import { runInAction } from "mobx";
import CommonStrata from "../../Models/Definition/CommonStrata";

@observer
class GeoJsonParameterEditor extends Component {
  static propTypes = {
    previewed: PropTypes.object,
    parameter: PropTypes.object,
    viewState: PropTypes.object,
    t: PropTypes.func.isRequired
  };

  onCleanUp() {
    this.props.viewState.openAddData();
  }

  selectPointOnMap() {
    runInAction(() => {
      this.props.parameter.setValue(CommonStrata.user, undefined);
      selectPointOnMap(
        this.props.previewed.terria,
        this.props.viewState,
        this.props.parameter,
        this.props.t("analytics.selectLocation")
      );
      this.props.parameter.subtype = GeoJsonParameter.PointType;
    });
  }

  selectPolygonOnMap() {
    runInAction(() => {
      this.props.parameter.setValue(CommonStrata.user, undefined);
      selectPolygonOnMap(
        this.props.previewed.terria,
        this.props.viewState,
        this.props.parameter
      );
      this.props.parameter.subtype = GeoJsonParameter.PolygonType;
    });
  }

  selectExistingPolygonOnMap() {
    runInAction(() => {
      this.props.parameter.setValue(CommonStrata.user, undefined);
      selectExistingPolygonOnMap(
        this.props.previewed.terria,
        this.props.viewState,
        this.props.parameter
      );
      this.props.parameter.subtype = GeoJsonParameter.SelectAPolygonType;
    });
  }

  render() {
    const { t } = this.props;
    return (
      <div>
        <div>
          <strong>{t("analytics.selectLocation")}</strong>
        </div>
        <div
          className="container"
          style={{
            marginTop: "10px",
            marginBottom: "10px",
            display: "table",
            width: "100%"
          }}
        >
          <button
            type="button"
            onClick={() => this.selectPointOnMap()}
            className={Styles.btnLocationSelector}
          >
            <strong>{t("analytics.point")}</strong>
          </button>
          <button
            type="button"
            style={{ marginLeft: "2%", marginRight: "2%" }}
            onClick={() => this.selectPolygonOnMap()}
            className={Styles.btnLocationSelector}
          >
            <strong>{t("analytics.polygon")}</strong>
          </button>
          <button
            type="button"
            onClick={() => this.selectExistingPolygonOnMap()}
            className={Styles.btnLocationSelector}
          >
            <strong>{t("analytics.existingPolygon")}</strong>
          </button>
        </div>
        <input
          className={Styles.field}
          type="text"
          readOnly
          value={getDisplayValue(
            this.props.parameter.value,
            this.props.parameter
          )}
        />
        {getDisplayValue(this.props.parameter.value, this.props.parameter) ===
          "" && <div>{t("analytics.nothingSelected")}</div>}
      </div>
    );
  }
}

function getDisplayValue(value, parameter) {
  if (!defined(parameter.subtype)) {
    return "";
  }
  if (parameter.subtype === GeoJsonParameter.PointType) {
    return getPointParameterDisplayValue(value);
  }
  if (parameter.subtype === GeoJsonParameter.SelectAPolygonType) {
    return getExistingPolygonParameterDisplayValue(value);
  }
  if (parameter.subtype === GeoJsonParameter.PolygonType) {
    return getPolygonParameterDisplayValue(value);
  }
  return getRegionPickerDisplayValue(value, parameter);
}

export default withTranslation()(GeoJsonParameterEditor);
