import { observer } from "mobx-react";
import { FC } from "react";
import CommonStrata from "../../Models/Definition/CommonStrata";
import DateTimeParameter from "../../Models/FunctionParameters/DateTimeParameter";
import Styles from "./parameter-editors.scss";

interface DateTimeParameterEditorProps {
  parameter: DateTimeParameter;
}

const DateTimeParameterEditor: FC<
  React.PropsWithChildren<DateTimeParameterEditorProps>
> = observer(({ parameter }) => {
  const style =
    parameter?.value !== undefined ? Styles.field : Styles.fieldDatePlaceholder;

  return (
    <div>
      <input
        className={style}
        type="datetime-local"
        value={parameter.value ?? ""}
        onChange={(e) => parameter.setValue(CommonStrata.user, e.target.value)}
      />
    </div>
  );
});

export default DateTimeParameterEditor;
