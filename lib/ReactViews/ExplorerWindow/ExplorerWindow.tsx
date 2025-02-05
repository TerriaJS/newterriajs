import { action } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { useViewState } from "../Context";
import ModalPopup from "./ModalPopup";
import Tabs from "./Tabs";
import Text from "../../Styled/Text";
import Box from "../../Styled/Box";
import { useTheme } from "styled-components";
import { t } from "i18next";

export const ExplorerWindowElementName = "AddData";

export default observer<React.FC>(function ExplorerWindow() {
  const viewState = useViewState();
  const theme = useTheme();
  const onClose = action(() => {
    viewState.closeCatalog();
    viewState.switchMobileView("nowViewing");
  });

  const onStartAnimatingIn = action(() => {
    viewState.explorerPanelAnimating = true;
  });

  const onDoneAnimatingIn = action(() => {
    viewState.explorerPanelAnimating = false;
  });

  const isVisible =
    !viewState.useSmallScreenInterface &&
    !viewState.hideMapUi &&
    viewState.explorerPanelIsVisible;

  return (
    <ModalPopup
      viewState={viewState}
      isVisible={isVisible}
      isTopElement={viewState.topElement === ExplorerWindowElementName}
      onClose={onClose}
      onStartAnimatingIn={onStartAnimatingIn}
      onDoneAnimatingIn={onDoneAnimatingIn}
    >
      <Box
        css={`
          background: ${theme.dark};
          border-radius: ${theme.radiusXL} ${theme.radiusXL} 0 0;
        `}
        paddedRatio={4}
        fullWidth
      >
        <Text extraExtraLarge textLight css={{ fontWeight: 500 }}>
          {t("addData.dataCatalogue")}
        </Text>
      </Box>
      <Tabs terria={viewState.terria} viewState={viewState} />
    </ModalPopup>
  );
});
