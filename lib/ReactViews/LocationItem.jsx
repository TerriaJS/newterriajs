import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import prettifyCoordinates from "../Map/Vector/prettifyCoordinates";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import Styles from "./location-item.scss";

export default function LocationItem(props) {
  let latitude = "";
  let longitude = "";
  if (props.position) {
    const cartesianPosition = props.position;
    const catographic =
      Ellipsoid.WGS84.cartesianToCartographic(cartesianPosition);
    const latitudeRaw = CesiumMath.toDegrees(catographic.latitude);
    const longitudeRaw = CesiumMath.toDegrees(catographic.longitude);
    const pretty = prettifyCoordinates(longitudeRaw, latitudeRaw);
    latitude = pretty.latitude;
    longitude = pretty.longitude;
  }
  const { t } = useTranslation();
  return (
    <div className={Styles.location}>
      <span>{t("featureInfo.latLon")}</span>
      <span>{latitude + ", " + longitude}</span>
    </div>
  );
}

LocationItem.propTypes = {
  position: PropTypes.object
};
