import { runInAction } from "mobx";
import { observer } from "mobx-react";
import Slider from "rc-slider";
import React from "react";
import { WithTranslation, withTranslation, TFunction } from "react-i18next";
import styled, { DefaultTheme, withTheme } from "styled-components";
import CommonStrata from "../../../Models/Definition/CommonStrata";
import hasTraits from "../../../Models/Definition/hasTraits";
import { BaseModel } from "../../../Models/Definition/Model";
import Box from "../../../Styled/Box";
import Spacing from "../../../Styled/Spacing";
import Text from "../../../Styled/Text";
import OpacityTraits from "../../../Traits/TraitsClasses/OpacityTraits";

interface OpacitySectionProps extends WithTranslation {
  item: BaseModel;
  t: TFunction;
  theme: DefaultTheme;
}

@observer
class OpacitySection extends React.Component<OpacitySectionProps> {
  constructor(props: OpacitySectionProps) {
    super(props);
    this.changeOpacity = this.changeOpacity.bind(this);
  }
  changeOpacity(value: number) {
    const item = this.props.item;
    if (hasTraits(item, OpacityTraits, "opacity")) {
      runInAction(() => {
        item.setTrait(CommonStrata.user, "opacity", value / 100.0);
      });
    }
  }

  render() {
    const item = this.props.item;
    const { t } = this.props;
    if (
      !hasTraits(item, OpacityTraits, "opacity") ||
      (hasTraits(item, OpacityTraits, "disableOpacityControl") &&
        item.disableOpacityControl)
    ) {
      return null;
    }
    return (
      <Box verticalCenter paddedHorizontally={3} paddedVertically={2}>
        <StyledLabel medium htmlFor="opacity">
          {t("workbench.opacity", {
            opacity: Math.round(item.opacity * 100)
          })}
        </StyledLabel>
        <Spacing right={3} />
        <Slider
          min={0}
          max={100}
          value={(item.opacity * 100) | 0}
          onChange={this.changeOpacity}
        />
      </Box>
    );
  }
}

const StyledLabel = styled(Text).attrs({ as: "label" })<{ htmlFor: string }>`
  white-space: nowrap;
  flex-basis: 50%;
`;

export default withTranslation()(withTheme(OpacitySection));
