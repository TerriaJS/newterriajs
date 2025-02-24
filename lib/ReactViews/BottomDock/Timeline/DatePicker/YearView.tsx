import isDefined from "../../../../Core/isDefined";
import type { ObjectifiedYears } from "../../../../ModelMixins/DiscretelyTimeVaryingMixin";
import * as DTP from "./DateTimePicker.styles";

interface YearViewProps {
  datesObject: ObjectifiedYears;
  onSelectYear: (year: number) => void;
}

export const YearView: React.FC<YearViewProps> = ({
  datesObject,
  onSelectYear
}) => {
  if (!datesObject.dates || datesObject.dates.length <= 12) {
    return null;
  }

  const years = datesObject.index;
  const monthOfYear = (Array.apply as any)(null, { length: 12 }).map(
    Number.call,
    Number
  ) as number[];

  return (
    <DTP.Grid>
      <DTP.GridHeading>Select a year</DTP.GridHeading>
      <DTP.GridBody>
        {years.map((y) => (
          <DTP.GridRow key={y} onClick={() => onSelectYear(y)}>
            <DTP.GridLabel>{y}</DTP.GridLabel>
            <DTP.GridRowInner marginRight="11">
              {monthOfYear.map((m) => (
                <DTP.GridItem active={isDefined(datesObject[y][m])} key={m} />
              ))}
            </DTP.GridRowInner>
          </DTP.GridRow>
        ))}
      </DTP.GridBody>
    </DTP.Grid>
  );
};
