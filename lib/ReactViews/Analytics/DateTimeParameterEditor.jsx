import React, { useState } from "react";
import defined from "terriajs-cesium/Source/Core/defined";
import Styles from "./parameter-editors.scss";
import CommonStrata from "../../Models/Definition/CommonStrata";
import PropTypes from "prop-types";

const DateTimeParameterEditor = ({ parameter, previewed }) => {
  const [dateValue, setDateValue] = useState(
    defined(parameter) && defined(parameter.value) ? parameter.value : ""
  );
  const [timeValue, setTimeValue] = useState("00:00");

  const style =
    defined(parameter) && defined(parameter.value)
      ? Styles.field
      : Styles.fieldDatePlaceholder;
  return (
    <div>
      <input
        className={style}
        type="date"
        placeholder="YYYY-MM-DD"
        value={dateValue}
        onChange={(e) => {
          setDateValue(e.target.value);
          if (defined(parameter)) {
            parameter.setValue(
              CommonStrata.user,
              `${e.target.value}T${timeValue}`
            );
          }
        }}
      />
      <input
        className={style}
        type="time"
        placeholder="HH:mm:ss.sss"
        value={timeValue}
        onChange={(e) => {
          setTimeValue(e.target.value);
          if (defined(parameter)) {
            parameter.setValue(
              CommonStrata.user,
              `${dateValue}T${e.target.value}`
            );
          }
        }}
      />
    </div>
  );
};

DateTimeParameterEditor.propTypes = {
  parameter: PropTypes.object,
  previewed: PropTypes.object
};

export default DateTimeParameterEditor;
