import defined from "terriajs-cesium/Source/Core/defined";
import RuntimeError from "terriajs-cesium/Source/Core/RuntimeError";
import i18next from "i18next";

const featureCreators = {
  Point: createPointGeometry
};

function geoJsonGeometryFromW3cGeometry(geometry) {
  const type = "Point";
  const creator = featureCreators[type];
  if (!defined(creator)) {
    throw new RuntimeError(
      i18next.t("map.w3cToGeoJson.containsUnsupportedFeatureType", {
        type: type
      })
    );
  }

  return creator(geometry);
}

function createPointGeometry(geometry) {
  /*
    avoid using geo namespace since user defines it in different way
    and we already know that Point in W3C geometry supports only lat and long elements
    http://www.w3.org/2003/01/geo/wgs84_pos# and http://www.w3.org/2003/01/geo/
   */
  const latitude = geometry.getElementsByTagNameNS("*", "lat")[0].textContent;
  const longitude = geometry.getElementsByTagNameNS("*", "long")[0].textContent;
  return {
    type: "Point",
    coordinates: [longitude, latitude]
  };
}

export default geoJsonGeometryFromW3cGeometry;
