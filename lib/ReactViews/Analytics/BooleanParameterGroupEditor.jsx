import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import MoreOrLess from "../Generic/MoreOrLess";
import BooleanParameterEditor from "./BooleanParameterEditor";
import Styles from "./parameter-editors.scss";

const BooleanParameterGroupEditor = createReactClass({
  displayName: "BooleanParameterGroupEditor",
  propTypes: {
    previewed: PropTypes.object,
    parameter: PropTypes.object
  },
  toggleDiv: function (divID, _ev) {
    const thisDiv = document.getElementById(divID);
    if (thisDiv.style.display === "none") {
      thisDiv.style.display = "block";
    } else {
      thisDiv.style.display = "none";
    }
  },
  toggleAll: function (inputArgs, _ev) {
    // if OneForAll selected, set the value of all BooleanParameters in
    // ParameterList to true, disable them,
    // else set the value of all BooleanParameters in ParameterList to
    // false, enable them
    const FirstOne = document.getElementById(inputArgs.OneForAllId);
    let LastOne = FirstOne.children[0];
    while (LastOne.childElementCount !== 0) {
      LastOne = LastOne.children[0];
    }
    const OneForAllValue = LastOne.href.baseVal.split("-")[1] !== "off";
    const ParamElementArray = [];
    Array.from(
      document.getElementById(inputArgs.ParameterListId).children
    ).forEach(function (child) {
      ParamElementArray.push(child.children[0].children[0]);
    });
    if (OneForAllValue === false) {
      ParamElementArray.forEach(function (Parameter) {
        // Parameter.value = true;
        // only have the ability to check state of button
        // and fire the onclick if it needs to change.
        const thisButton = Parameter.children[0];
        if (
          thisButton.children[0].children[0].href.baseVal.split("-")[1] ===
          "off"
        ) {
          // fire react click event
          thisButton[
            Object.keys(thisButton).filter(function (v) {
              return /__reactEventHandlers/.test(v);
            })
          ].onClick();
        }
        thisButton.disabled = true;
      });
    } else {
      ParamElementArray.forEach(function (Parameter) {
        // Parameter.value = false;
        const thisButton = Parameter.children[0];
        if (
          thisButton.children[0].children[0].href.baseVal.split("-")[1] !==
          "off"
        ) {
          thisButton[
            Object.keys(thisButton).filter(function (v) {
              return /__reactEventHandlers/.test(v);
            })
          ].onClick();
        }
        thisButton.disabled = false;
      });
    }
  },
  renderCheckboxGroup() {
    const whichIcon = true;
    const OneForAll = this.props.parameter.OneForAll;
    const name =
      (this.props.parameter.name
        ? this.props.parameter.name
        : this.props.parameter.id) + "_Group";
    const OneForAllDivName = name + "_OneForAllDiv";
    const groupClick = this.toggleDiv.bind(this, name);
    const allClick = this.toggleAll.bind(this, {
      OneForAllId: OneForAllDivName,
      ParameterListId: name
    });
    return (
      <fieldset>
        <legend>
          <div style={{ display: "inline-block" }} onClick={groupClick}>
            <MoreOrLess initialopen={whichIcon} myclass={Styles.btnRadio} />
          </div>
          <div
            id={OneForAllDivName}
            style={{ display: "inline-block" }}
            onClick={allClick}
          >
            <BooleanParameterEditor parameter={OneForAll} />
          </div>
        </legend>
        {/* should this start closed? style={{display: 'none'}} */}
        <div
          id={name}
          style={whichIcon ? { display: "block" } : { display: "none" }}
        >
          {this.props.parameter.ParameterList.map(function (item, key) {
            return (
              <div key={key}>
                <BooleanParameterEditor parameter={item} />
              </div>
            );
          })}
        </div>
      </fieldset>
    );
  },
  render() {
    return <div>{this.renderCheckboxGroup()}</div>;
  }
});

export default BooleanParameterGroupEditor;
