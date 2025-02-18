import { reaction } from "mobx";
import { observer } from "mobx-react";
import { FC, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import GlobeOrMap from "../../../../Models/GlobeOrMap";
import { ICredit } from "./Credit.type";
import { Credits } from "./Credits";
import { CreditsContainer } from "./CreditsContainer";
import { DataAttributionModal } from "./DataAttribution/DataAttributionModal";
import { Spacer } from "./Spacer";
import { TerriaLogo } from "./TerriaLogo";
import { MapCreditLogo } from "./MapCreditLogo";

interface IMapCreditsProps {
  hideTerriaLogo: boolean;
  credits?: ICredit[];
  currentViewer: GlobeOrMap;
}

export const MapCredits: FC<React.PropsWithChildren<IMapCreditsProps>> =
  observer(({ currentViewer, hideTerriaLogo, credits }) => {
    const { t } = useTranslation();
    const [dataAttributionVisible, setDataAttributionVisible] = useState(false);

    const showDataAttribution = useCallback(() => {
      setDataAttributionVisible(true);
    }, [setDataAttributionVisible]);

    const hideDataAttribution = useCallback(() => {
      setDataAttributionVisible(false);
    }, [setDataAttributionVisible]);

    useEffect(() => {
      return reaction(
        () => currentViewer.attributions.length,
        () => {
          if (
            currentViewer.attributions &&
            currentViewer.attributions.length === 0
          ) {
            hideDataAttribution();
          }
        }
      );
      /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, [currentViewer]);

    if (currentViewer.type === "none") {
      return <CreditsContainer />;
    }

    return (
      <CreditsContainer>
        {!hideTerriaLogo ? <TerriaLogo /> : null}
        <MapCreditLogo currentViewer={currentViewer} />
        <Credits credits={credits} />
        <Spacer />
        {currentViewer.attributions && currentViewer.attributions.length > 0 ? (
          <a onClick={showDataAttribution}>
            {t("map.extraCreditLinks.basemap")}
          </a>
        ) : null}
        {dataAttributionVisible ? (
          <DataAttributionModal
            closeModal={hideDataAttribution}
            attributions={currentViewer.attributions}
          />
        ) : null}
      </CreditsContainer>
    );
  });
