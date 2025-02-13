import { FC } from "react";
import { BaseModel } from "../../../Models/Definition/Model";
import {
  filterSelectableDimensions,
  Placement,
  SelectableDimension
} from "../../../Models/SelectableDimensions/SelectableDimensions";
import Box from "../../../Styled/Box";
import SelectableDimensionComponent from "../../SelectableDimensions/SelectableDimension";

export interface GeneratedControlSectionProps {
  item: BaseModel;
  controls: SelectableDimension[];
  placement: Placement;
}

const GeneratedControlSection: FC<GeneratedControlSectionProps> = ({
  item,
  controls,
  placement
}) => {
  const enabledDimensions = filterSelectableDimensions(placement)(controls);
  if (enabledDimensions.length === 0) {
    return null;
  }
  return (
    <Box displayInlineBlock fullWidth>
      {enabledDimensions.map((dim, _i) => (
        <SelectableDimensionComponent
          key={`${item.uniqueId}-generated-control-${dim.id}-fragment`}
          id={`${item.uniqueId}-generated-control-${dim.id}`}
          dim={dim}
        />
      ))}
    </Box>
  );
};

export default GeneratedControlSection;
