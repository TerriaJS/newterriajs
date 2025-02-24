import type { ObjectifiedHours } from "../../../../ModelMixins/DiscretelyTimeVaryingMixin";
import { formatDateTime } from "../DateFormats";
import * as DTP from "./DateTimePicker.styles";
import { monthNames } from "./utils";

interface HourViewProps {
  year: number;
  month: number;
  day: number;
  datesObject: ObjectifiedHours;
  onSelectHour: (hour: number) => void;
}

export const HourView: React.FC<HourViewProps> = ({
  year,
  month,
  day,
  datesObject,
  onSelectHour
}) => {
  const dayData = datesObject;
  const timeOptions = dayData.dates.map((m) => ({
    value: m,
    label: formatDateTime(m)
  }));

  if (timeOptions.length <= 24) {
    return null;
  }

  return (
    <DTP.Grid>
      <DTP.GridHeading>
        {`Select an hour on ${day} ${monthNames[month + 1]} ${year}`}
      </DTP.GridHeading>
      <DTP.GridBody>
        {dayData.index.map((hour) => (
          <DTP.DateButton key={hour} onClick={() => onSelectHour(hour)}>
            <span>
              {hour} : 00 - {hour + 1} : 00
            </span>{" "}
            <span>({dayData[hour].length} options)</span>
          </DTP.DateButton>
        ))}
      </DTP.GridBody>
    </DTP.Grid>
  );
};
