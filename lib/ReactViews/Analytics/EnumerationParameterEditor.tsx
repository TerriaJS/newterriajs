import { ChangeEvent, Component } from "react";
import { observer } from "mobx-react";

import Styles from "./parameter-editors.scss";
import { action } from "mobx";
import EnumerationParameter from "../../Models/FunctionParameters/EnumerationParameter";
import CommonStrata from "../../Models/Definition/CommonStrata";
import isDefined from "../../Core/isDefined";

@observer
export default class EnumerationParameterEditor extends Component<{
  parameter: EnumerationParameter;
}> {
  @action
  onChange(e: ChangeEvent<HTMLSelectElement>) {
    this.props.parameter.setValue(CommonStrata.user, e.target.value);
  }

  render() {
    const value = this.props.parameter.value;
    return (
      <select
        className={Styles.field}
        onChange={this.onChange.bind(this)}
        value={value}
      >
        {(!isDefined(value) || !this.props.parameter.isRequired) && (
          <option key="__undefined__" value="">
            Not specified
          </option>
        )}
        {/* Create option if value is invalid (not in possibleValues) */}
        {isDefined(value) &&
          !this.props.parameter.options.find(option => option.id === value) && (
            <option key="__invalid__" value={value}>
              Invalid value ({value})
            </option>
          )}
        {this.props.parameter.options.map((v, i) => (
          <option value={v.id} key={i}>
            {v.name ?? v.id}
          </option>
        ))}
      </select>
    );
  }
}
