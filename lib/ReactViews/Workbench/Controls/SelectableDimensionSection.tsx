import { observer } from "mobx-react";
import { Component } from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import isDefined from "../../../Core/isDefined";
import { BaseModel } from "../../../Models/Definition/Model";
import SelectableDimensions, {
  filterSelectableDimensions,
  Placement
} from "../../../Models/SelectableDimensions/SelectableDimensions";
import Box from "../../../Styled/Box";
import SelectableDimension from "../../SelectableDimensions/SelectableDimension";

interface PropsType extends WithTranslation {
  item: BaseModel;
  /** Placement used to filter selectableDimensions.placement (eg 'belowLegend) */
  placement: Placement;
}

@observer
class SelectableDimensionSection extends Component<PropsType> {
  render() {
    const item = this.props.item;
    if (!SelectableDimensions.is(item)) {
      return null;
    }

    const selectableDimensions = filterSelectableDimensions(
      this.props.placement
    )(item.selectableDimensions);

    if (!isDefined(selectableDimensions) || selectableDimensions.length === 0) {
      return null;
    }

    return (
      <Box displayInlineBlock fullWidth>
        {selectableDimensions.map((dim, _i) => (
          <SelectableDimension
            key={`${item.uniqueId}-${dim.id}-fragment`}
            id={`${item.uniqueId}-${dim.id}`}
            dim={dim}
          />
        ))}
      </Box>
    );
  }
}

export default withTranslation()(SelectableDimensionSection);
