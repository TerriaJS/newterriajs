import dateFormat from "dateformat";
import isDefined from "../../../../Core/isDefined";
import { formatDateTime } from "../DateFormats";
import * as DTP from "./DateTimePicker.styles";

interface TimeListViewProps {
  items: Date[];
  dateFormatString?: string;
  onTimeSelected: (time: Date) => void;
}

export const TimeListView: React.FC<TimeListViewProps> = ({
  items,
  dateFormatString,
  onTimeSelected
}) => {
  if (!isDefined(items)) return null;

  return (
    <DTP.Grid>
      <DTP.GridHeading>Select a time</DTP.GridHeading>
      <DTP.GridBody>
        {items.map((item) => (
          <DTP.DateButton
            key={formatDateTime(item)}
            onClick={() => onTimeSelected(item)}
          >
            {isDefined(dateFormatString)
              ? dateFormat(item, dateFormatString)
              : formatDateTime(item)}
          </DTP.DateButton>
        ))}
      </DTP.GridBody>
    </DTP.Grid>
  );
};
