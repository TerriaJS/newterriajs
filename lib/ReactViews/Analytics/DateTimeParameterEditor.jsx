import defined from "terriajs-cesium/Source/Core/defined";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";

import Styles from "./parameter-editors.scss";
import CommonStrata from "../../Models/Definition/CommonStrata";

const DateTimeParameterEditor = createReactClass({
  displayName: "DateTimeParameterEditor",

  propTypes: {
    previewed: PropTypes.object,
    parameter: PropTypes.object
  },

  getInitialState() {
    return this.getDateTime();
  },

  getDateTime() {
    const dateTimeBreakOut = {};
    const timeDate = this.props.parameter.value;
    if (timeDate !== undefined) {
      const splits = timeDate.split("T");
      dateTimeBreakOut.date = splits[0];
      if (splits[1].length === 0) {
        dateTimeBreakOut.time = "00:00";
      } else {
        dateTimeBreakOut.time = splits[1];
      }
    } else {
      dateTimeBreakOut.date = "";
      dateTimeBreakOut.time = "00:00";
    }

    this.setDateTime(dateTimeBreakOut);

    return dateTimeBreakOut;
  },

  setDateTime(dateTime) {
    let value;
    if (dateTime.date && dateTime.time) {
      value = dateTime.date + "T" + dateTime.time;
    }
    this.props.parameter.setValue(CommonStrata.user, value);
  },

  onChangeDate(e) {
    const dateTimeBreakOut = this.getDateTime();
    dateTimeBreakOut.date = e.target.value;
    this.setDateTime(dateTimeBreakOut);
    this.setState(dateTimeBreakOut);
  },

  onChangeTime(e) {
    const dateTimeBreakOut = this.getDateTime();
    dateTimeBreakOut.time = e.target.value;
    this.setDateTime(dateTimeBreakOut);
    this.setState(dateTimeBreakOut);
  },

  render() {
    const style =
      defined(this.props.parameter) && defined(this.props.parameter.value)
        ? Styles.field
        : Styles.fieldDatePlaceholder;

    return (
      <div>
        <input
          className={style}
          type="date"
          placeholder="YYYY-MM-DD"
          onChange={this.onChangeDate}
          value={this.state.date}
        />
        <input
          className={style}
          type="time"
          placeholder="HH:mm:ss.sss"
          onChange={this.onChangeTime}
          value={this.state.time}
        />
      </div>
    );
  }
});

module.exports = DateTimeParameterEditor;
