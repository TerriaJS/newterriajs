import { observer } from "mobx-react";
import { useTranslation } from "react-i18next";
import { useViewState } from "../Context";
import HelpPrompt from "./HelpPrompt";

export const SATELLITE_HELP_PROMPT_KEY = "satelliteGuidance";
export const SatelliteHelpPrompt = observer(() => {
  const { t } = useTranslation();
  const viewState = useViewState();
  const showHelp = viewState.showSatelliteGuidance;

  const dismissSatellitePrompt = () => {
    viewState.toggleFeaturePrompt(SATELLITE_HELP_PROMPT_KEY, true, true);
    viewState.setShowSatelliteGuidance(false);
  };

  return (
    <HelpPrompt
      isVisible={showHelp}
      viewState={viewState}
      title={t("satelliteGuidance.titleI")}
      content={t("satelliteGuidance.bodyI")}
      dismissLabel={t("satelliteGuidance.prevI")}
      acceptLabel={t("satelliteGuidance.nextI")}
      onAccept={() => {
        dismissSatellitePrompt();
        viewState.showHelpPanel();
        viewState.selectHelpMenuItem("satelliteimagery");
      }}
      onDismiss={() => dismissSatellitePrompt()}
    />
  );
});

export default SatelliteHelpPrompt;
