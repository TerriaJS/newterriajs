import type { ObjectifiedDates } from "../../../../ModelMixins/DiscretelyTimeVaryingMixin";
import * as DTP from "./DateTimePicker.styles";

interface CenturyGridProps {
  datesObject: ObjectifiedDates;
  onSelectCentury: (century: number) => void;
}

export const CenturyView: React.FC<CenturyGridProps> = ({
  datesObject,
  onSelectCentury
}) => {
  const centuries = datesObject.index;
  if (datesObject.dates && datesObject.dates.length >= 12) {
    return (
      <DTP.Grid>
        <DTP.GridHeading>Select a century</DTP.GridHeading>
        {centuries.map((c) => (
          <DTP.DateButton
            key={c}
            css={`
              display: inline-block;
              width: 40%;
            `}
            onClick={() => onSelectCentury(c)}
          >
            {c}00
          </DTP.DateButton>
        ))}
      </DTP.Grid>
    );
  } else {
    // Note: This will be handled separately
    return null;
  }
};
