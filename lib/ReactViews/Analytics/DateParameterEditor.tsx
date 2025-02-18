import { observer } from "mobx-react";
import { FC } from "react";
import CommonStrata from "../../Models/Definition/CommonStrata";
import DateParameter from "../../Models/FunctionParameters/DateParameter";
import Styles from "./parameter-editors.scss";

interface DateParameterEditorProps {
  parameter: DateParameter;
}

const DateParameterEditor: FC<
  React.PropsWithChildren<DateParameterEditorProps>
> = observer(({ parameter }) => {
  const style =
    parameter?.value !== undefined ? Styles.field : Styles.fieldDatePlaceholder;

  return (
    <div>
      <input
        className={style}
        type="date"
        placeholder="YYYY-MM-DD"
        onChange={(e) => parameter.setValue(CommonStrata.user, e.target.value)}
        value={parameter.value ?? ""}
      />
    </div>
  );
});

export default DateParameterEditor;
