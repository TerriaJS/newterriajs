import { ChangeEvent, Component } from "react";

import Styles from "./parameter-editors.scss";
import FunctionParameter from "../../Models/FunctionParameters/FunctionParameter";
import { action } from "mobx";
import { observer } from "mobx-react";
import CommonStrata from "../../Models/Definition/CommonStrata";

@observer
export default class GenericParameterEditor extends Component<{
  parameter: FunctionParameter;
}> {
  @action
  onChange(e: ChangeEvent<HTMLInputElement>) {
    this.props.parameter.setValue(CommonStrata.user, e.target.value);
  }

  render() {
    const value = (this.props.parameter.value || "") as string;
    return (
      <input
        className={Styles.field}
        type="text"
        onChange={this.onChange.bind(this)}
        value={value}
      />
    );
  }
}
