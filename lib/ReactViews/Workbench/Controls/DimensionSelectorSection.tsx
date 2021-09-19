"use strict";

import i18next from "i18next";
import { action } from "mobx";
import { observer } from "mobx-react";
import { ChangeEvent, Component, Fragment } from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import isDefined from "../../../Core/isDefined";
import CommonStrata from "../../../Models/Definition/CommonStrata";
import { BaseModel } from "../../../Models/Definition/Model";
import SelectableDimensions, {
  SelectableDimension,
  MAX_SELECTABLE_DIMENSION_OPTIONS
} from "../../../Models/SelectableDimensions";
import Box from "../../../Styled/Box";
import Select from "../../../Styled/Select";
import Spacing from "../../../Styled/Spacing";
import Text from "../../../Styled/Text";

interface PropsType extends WithTranslation {
  item: SelectableDimensions & BaseModel;
}

@observer
class DimensionSelectorSection extends Component<PropsType> {
  @action
  setDimensionValue(
    dimension: SelectableDimension,
    event: ChangeEvent<HTMLSelectElement>
  ) {
    dimension.setDimensionValue(CommonStrata.user, event.target.value);
  }

  render() {
    const item = this.props.item;

    // Filter out dimensions with only 1 option (unless they have 1 option and allow undefined - which is 2 total options)
    const selectableDimensions = item.selectableDimensions?.filter(
      dim =>
        !dim.disable &&
        isDefined(dim.options) &&
        dim.options.length < MAX_SELECTABLE_DIMENSION_OPTIONS &&
        dim.options.length + (dim.allowUndefined ? 1 : 0) > 1
    );

    if (
      !SelectableDimensions.is(item) ||
      !isDefined(selectableDimensions) ||
      selectableDimensions.length === 0
    ) {
      return null;
    }

    return (
      <Box displayInlineBlock fullWidth>
        <Spacing bottom={2} />
        {selectableDimensions.map((dim, i) => (
          <Fragment key={dim.id}>
            <label htmlFor={`${this.props.item.uniqueId}-${dim.id}`}>
              <Text textLight medium as="span">
                {dim.name || dim.id}:
              </Text>
            </label>
            <Spacing bottom={1} />
            <Select
              light
              name={dim.id}
              id={`${this.props.item.uniqueId}-${dim.id}`}
              value={
                typeof dim.selectedId === "undefined"
                  ? "__undefined__"
                  : dim.selectedId
              }
              onChange={this.setDimensionValue.bind(this, dim)}
            >
              {/* If no value as been selected -> add option */}
              {(typeof dim.selectedId === "undefined" ||
                dim.allowUndefined) && (
                <option key="__undefined__" value="">
                  {dim.undefinedLabel ??
                    i18next.t("workbench.dimensionsSelector.undefinedLabel")}
                </option>
              )}
              {dim.options!.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name || option.id}
                </option>
              ))}
            </Select>
            {i < selectableDimensions.length - 1 && <Spacing bottom={2} />}
          </Fragment>
        ))}
      </Box>
    );
  }
}

export default withTranslation()(DimensionSelectorSection);
