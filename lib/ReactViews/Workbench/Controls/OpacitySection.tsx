import { runInAction } from "mobx";
import { observer } from "mobx-react";
import Slider from "rc-slider";
import { Component } from "react";
import { WithTranslation, withTranslation, TFunction } from "react-i18next";
import styled from "styled-components";
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
}

@observer
class OpacitySection extends Component<OpacitySectionProps> {
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
      <>
        <Spacing bottom={2} />
        <Box verticalCenter>
          <StyledLabel small htmlFor="opacity">
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
      </>
    );
  }
}

const StyledLabel = styled(Text).attrs({ as: "label" })<{ htmlFor: string }>`
  white-space: nowrap;
  flex-basis: 50%;
`;

export default withTranslation()(OpacitySection);
