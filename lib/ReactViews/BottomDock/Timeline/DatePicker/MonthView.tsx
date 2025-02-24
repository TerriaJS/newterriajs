import { useTranslation } from "react-i18next";
import isDefined from "../../../../Core/isDefined";
import type { ObjectifiedMonths } from "../../../../ModelMixins/DiscretelyTimeVaryingMixin";
import * as DTP from "./DateTimePicker.styles";
import { daysInMonth, monthNames } from "./utils";

interface MonthViewProps {
  year: number;
  datesObject: ObjectifiedMonths;
  onSelectMonth: (month: number) => void;
  onBack: () => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  year,
  datesObject,
  onSelectMonth,
  onBack
}) => {
  const { t } = useTranslation();

  if (!datesObject.dates || datesObject.dates.length <= 12) {
    return null;
  }

  return (
    <DTP.Grid>
      <DTP.GridHeading>
        <DTP.BackButton title={t("dateTime.back")} onClick={onBack}>
          {year}
        </DTP.BackButton>
      </DTP.GridHeading>
      <DTP.GridBody>
        {monthNames.map((m, i) => (
          <DTP.GridRow
            css={`
              ${!isDefined(datesObject[i])
                ? `:hover {
              background: transparent;
              cursor: default;
            }`
                : ""}
            `}
            key={m}
            onClick={() => isDefined(datesObject[i]) && onSelectMonth(i)}
          >
            <DTP.GridLabel>{m}</DTP.GridLabel>
            <DTP.GridRowInner marginRight="3">
              {daysInMonth(i + 1, year).map((d) => (
                <DTP.GridItem
                  active={
                    isDefined(datesObject[i]) &&
                    isDefined(datesObject[i][d + 1])
                  }
                  key={d}
                />
              ))}
            </DTP.GridRowInner>
          </DTP.GridRow>
        ))}
      </DTP.GridBody>
    </DTP.Grid>
  );
};
