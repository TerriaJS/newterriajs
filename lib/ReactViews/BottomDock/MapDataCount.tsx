import { observer } from "mobx-react";

import Icon, { StyledIcon } from "../../Styled/Icon";
import ButtonAsLabel from "../../Styled/ButtonAsLabel";
import Box from "../../Styled/Box";
import Text from "../../Styled/Text";
import Spacing from "../../Styled/Spacing";
import { useTranslation } from "react-i18next";
import withControlledVisibility from "../HOCs/withControlledVisibility";
import Terria from "../../Models/Terria";
import ViewState from "../../ReactViewModels/ViewState";
import MappableMixin from "../../ModelMixins/MappableMixin";

interface Props {
  terria: Terria;
  viewState: ViewState;
}

const MapDataCount = observer(function (props: Props) {
  const { t } = useTranslation();
  const { terria, viewState } = props;
  if (viewState.useSmallScreenInterface) {
    return null;
  }

  // Can't simply use number of items given they can exist in workbench
  // without being shown on map
  const numberOfDatasets = terria.workbench.items.filter((item) => {
    if (MappableMixin.isMixedInto(item)) {
      return item.show;
    }
  }).length;
  const hasMapData = numberOfDatasets !== 0;
  const mapDataText = hasMapData
    ? t("countDatasets.mapDataState", {
        count: numberOfDatasets
      })
    : t("countDatasets.noMapDataEnabled");

  return (
    <Box css={"flex-shrink 0.5;"}>
      <ButtonAsLabel light={hasMapData}>
        <Spacing right={1} />
        <StyledIcon
          glyph={
            hasMapData ? Icon.GLYPHS.mapDataActive : Icon.GLYPHS.mapDataInactive
          }
          light={!hasMapData}
          dark={hasMapData}
          styledWidth={"20px"}
        />
        <Spacing right={2} />
        <Text semiBold>{mapDataText}</Text>
        <Spacing right={3} />
      </ButtonAsLabel>
    </Box>
  );
});

export default withControlledVisibility(MapDataCount);
