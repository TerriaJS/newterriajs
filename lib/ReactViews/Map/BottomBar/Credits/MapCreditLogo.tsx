import { FC } from "react";
import CreditDisplay from "terriajs-cesium/Source/Scene/CreditDisplay";
import GlobeOrMap from "../../../../Models/GlobeOrMap";
import Leaflet from "../../../../Models/Leaflet";
import parseCustomHtmlToReact from "../../../Custom/parseCustomHtmlToReact";

interface IMapCreditLogoProps {
  currentViewer: GlobeOrMap;
}

export const MapCreditLogo: FC<IMapCreditLogoProps> = ({ currentViewer }) => {
  if (currentViewer.type === "Leaflet") {
    const prefix = (currentViewer as Leaflet).attributionPrefix;
    if (prefix) {
      return <>{parseCustomHtmlToReact(prefix)}</>;
    }
    return null;
  }
  return parseCustomHtmlToReact(CreditDisplay.cesiumCredit.html, {
    disableExternalLinkIcon: true
  });
};
