import defined from "terriajs-cesium/Source/Core/defined";
import RuntimeError from "terriajs-cesium/Source/Core/RuntimeError";
import i18next from "i18next";

const featureCreators = {
  point: createPointGeometry,
  line: createLineGeometry,
  polygon: createPolygonGeometry,
  box: createGeometryFromBox
};
function geoJsonGeometryFromGeoRssSimpleGeometry(geometry) {
  const type = geometry.localName;
  const creator = featureCreators[type];
  if (!defined(creator)) {
    throw new RuntimeError(
      i18next.t("map.geoRssToGeoJson.containsUnsupportedFeatureType", {
        type: type
      })
    );
  }

  return creator(geometry);
}

function createPointGeometry(pointGeometry) {
  return {
    type: "Point",
    coordinates: geom2coord(pointGeometry.textContent.trim())[0]
  };
}
function createLineGeometry(lineGeometry) {
  return {
    type: "LineString",
    coordinates: geom2coord(lineGeometry.textContent)
  };
}

function createPolygonGeometry(polygonGeometry) {
  return {
    type: "Polygon",
    coordinates: [geom2coord(polygonGeometry.textContent.trim())]
  };
}

function createGeometryFromBox(bboxGeometry) {
  const coordinates = bboxGeometry.textContent
    .trim()
    .split(/\s+/)
    .filter(isNotEmpty);
  if (coordinates.length !== 4) {
    throw new RuntimeError("geometry not valid");
  }
  const minLat = coordinates[0];
  const minLon = coordinates[1];
  const maxLat = coordinates[2];
  const maxLon = coordinates[3];

  return {
    type: "Polygon",
    coordinates: [
      [
        [minLon, minLat],
        [minLon, maxLat],
        [maxLon, maxLat],
        [maxLon, minLat],
        [minLon, minLat]
      ]
    ]
  };
}

function isNotEmpty(s) {
  return s.length !== 0;
}

//Utility function to change esri gml positions to geojson positions
function geom2coord(posList) {
  const pnts = posList.split(/\s+/).filter(isNotEmpty);
  const coords = [];
  for (let i = 0; i < pnts.length; i += 2) {
    coords.push([parseFloat(pnts[i + 1]), parseFloat(pnts[i])]);
  }
  return coords;
}

export default geoJsonGeometryFromGeoRssSimpleGeometry;
