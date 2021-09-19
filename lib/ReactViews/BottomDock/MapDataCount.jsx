import PropTypes from "prop-types";
import { observer } from "mobx-react";

import Icon, { StyledIcon } from "../../Styled/Icon";
import ButtonAsLabel from "../../Styled/ButtonAsLabel";
import Box from "../../Styled/Box";
import Text from "../../Styled/Text";
import Spacing from "../../Styled/Spacing";
import { useTranslation } from "react-i18next";
import withControlledVisibility from "../HOCs/withControlledVisibility";

const MapDataCount = observer(function(props) {
  const { t } = useTranslation();
  const { terria, viewState } = props;
  if (viewState.useSmallScreenInterface) {
    return null;
  }

  // Can't simply use number of items given they can exist in workbench
  // without being shown on map
  const numberOfDatasets = terria.workbench.items.filter(item => item.show)
    .length;
  const hasMapData = numberOfDatasets !== 0;
  const mapDataText = hasMapData
    ? t("countDatasets.mapDataState", {
        count: numberOfDatasets
      })
    : t("countDatasets.noMapDataEnabled");

  return (
    // Should we even provide a wrapper Box? makes sense not to, but most of the
    // components as they stand come with their own "wrapper" via scss
    // <Box styledMinHeight="72px">
    <Box position="absolute" css={"bottom: 40px;"}>
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
MapDataCount.propTypes = {
  terria: PropTypes.object.isRequired,
  viewState: PropTypes.object.isRequired
};

export default withControlledVisibility(MapDataCount);
