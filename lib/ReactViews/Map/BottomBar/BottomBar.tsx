import { VFC } from "react";
import Box from "../../../Styled/Box";
import { useViewState } from "../../Context";
import { MapCredits } from "./Credits";
import { DistanceLegend } from "./DistanceLegend";
import { LocationBar } from "./LocationBar";

export const BottomBar: VFC = () => {
  const viewState = useViewState();
  return (
    <Box
      fullWidth
      justifySpaceBetween
      css={`
        background: linear-gradient(180deg, #000000 0%, #000000 100%);
        font-size: 0.7rem;
        opacity: 0.75;
      `}
    >
      <MapCredits
        hideTerriaLogo={!!viewState.terria.configParameters.hideTerriaLogo}
        credits={viewState.terria.configParameters.extraCreditLinks?.slice()}
        currentViewer={viewState.terria.mainViewer.currentViewer}
      />
      <Box paddedHorizontally={4} gap={2}>
        <LocationBar mouseCoords={viewState.terria.currentViewer.mouseCoords} />
        <DistanceLegend />
      </Box>
    </Box>
  );
};
