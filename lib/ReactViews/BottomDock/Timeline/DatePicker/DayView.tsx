import DatePicker from "react-datepicker";
import { useTranslation } from "react-i18next";
import type { ObjectifiedDays } from "../../../../ModelMixins/DiscretelyTimeVaryingMixin";
import Spacing from "../../../../Styled/Spacing";
import * as DTP from "./DateTimePicker.styles";
import { monthNames } from "./utils";

interface DayViewProps {
  year: number;
  month: number;
  datesObject: ObjectifiedDays;
  selectedDay?: number;
  onSelectDay: (date: Date | null) => void;
  onBackToYear: () => void;
  onBackToMonth: () => void;
}

export const DayView: React.FC<DayViewProps> = ({
  year,
  month,
  datesObject,
  selectedDay,
  onSelectDay,
  onBackToYear,
  onBackToMonth
}) => {
  const { t } = useTranslation();

  const dayObject = datesObject;
  if (!dayObject || dayObject.dates.length <= 1) {
    return null;
  }

  const daysToDisplay = dayObject.dates;
  const selected = selectedDay ? dayObject[selectedDay].dates[0] : null;

  return (
    <div
      css={`
        text-align: center;
        margin-top: -10px;
      `}
    >
      <div>
        <DTP.BackButton title={t("dateTime.back")} onClick={onBackToYear}>
          {year}
        </DTP.BackButton>
        &nbsp;
        <DTP.BackButton title={t("dateTime.back")} onClick={onBackToMonth}>
          {monthNames[month]}
        </DTP.BackButton>
        <Spacing bottom={1} />
      </div>
      <DatePicker
        inline
        onChange={onSelectDay}
        includeDates={daysToDisplay}
        selected={selected}
      />
    </div>
  );
};
