import defined from "terriajs-cesium/Source/Core/defined";
import geoJsonGeometryFromGeoRssSimpleGeometry from "./geoJsonGeometryFromGeoRssSimpleGeometry";
import geoJsonGeometryFromGmlGeometry from "./geoJsonGeometryFromGmlGeometry";
import geoJsonGeometryFromW3cGeometry from "./geoJsonGeometryFromW3cGeometry";

/**
 * Converts a GeoRss v2.0 document to GeoJSON.
 * @param  {Document|String} xml The GML document.
 * @return {Object} The GeoJSON object.
 */
export const geoRss2ToGeoJson = function (xml) {
  if (typeof xml === "string") {
    var parser = new DOMParser();
    xml = parser.parseFromString(xml, "text/xml");
  }
  var result = [];

  var rss = xml.documentElement;
  const channel = rss.getElementsByTagName("channel")[0];
  const items = channel.getElementsByTagName("item");
  for (var itemIndex = 0; itemIndex < items.length; ++itemIndex) {
    var item = items[itemIndex];

    var properties = {};
    const containsGeometry = getGeoRssPropertiesRecursively(item, properties);
    if (!containsGeometry) {
      continue;
    }
    var feature = {
      type: "Feature",
      properties: properties,
      geometry: getGeometry(item)
    };
    result.push(feature);
  }

  return {
    type: "FeatureCollection",
    crs: { type: "EPSG", properties: { code: "4326" } },
    features: result
  };
};

/**
 * Converts a GeoRss v2.0 document to GeoJSON.
 * @param  {Document|String} xml The GML document.
 * @return {Object} The GeoJSON object.
 */
export const geoRssAtomToGeoJson = function (xml) {
  if (typeof xml === "string") {
    var parser = new DOMParser();
    xml = parser.parseFromString(xml, "text/xml");
  }
  var result = [];

  var feed = xml.documentElement;
  const entries = feed.getElementsByTagName("entry");
  for (var entryIndex = 0; entryIndex < entries.length; ++entryIndex) {
    var entry = entries[entryIndex];
    var properties = {};

    const containsGeometry = getGeoRssPropertiesRecursively(entry, properties);
    if (!containsGeometry) {
      continue;
    }
    var feature = {
      type: "Feature",
      properties: properties,
      geometry: getGeometry(entry)
    };
    result.push(feature);
  }

  return {
    type: "FeatureCollection",
    crs: { type: "EPSG", properties: { code: "4326" } },
    features: result
  };
};

var gmlFeatureNames = [
  "Curve",
  "LineString",
  "Point",
  "Polygon",
  "MultiCurve",
  "MultiPoint",
  "MultiSurface",
  "Surface",
  "Envelope"
];

var nodeWhere = ["where"];
var identifyW3C = ["Point"];

var simpleGeometryNames = ["point", "line", "polygon", "box"];

function getGeoRssPropertiesRecursively(gmlNode, properties) {
  var constainsGeometry = false;

  for (var i = 0; i < gmlNode.childNodes.length; ++i) {
    var child = gmlNode.childNodes[i];

    if (nodeWhere.indexOf(child.localName) >= 0) {
      constainsGeometry = true;
      // identifies elements enclosed with where tag, used with gml and sometimes with simple geometry
      continue;
    } else if (simpleGeometryNames.indexOf(child.localName) >= 0) {
      constainsGeometry = true;
      continue;
    } else if (identifyW3C.indexOf(child.localName) >= 0) {
      constainsGeometry = true;
      continue;
    }

    if (child.hasChildNodes() && child.nodeType === Node.ELEMENT_NODE) {
      properties[child.localName] = child.textContent;
    }
  }

  return constainsGeometry;
}

/**
 * GeoRss format support following geometries
 * - GML geometry enclosed with where tag (i.e. <georss:where><gml:...>...</gml:...></georss:where>)
 * - simple geometry which can be enclosed with where tag but are often not (i.e. <georss:point>25 45</georss:point>)
 * - W3C geometry (i.e. <geo:Point><geo:lat>55.701</geo:lat><geo:long>12.552</geo:long></geo:Point>)
 * @param {*} node
 */
function getGeometry(node) {
  var result;
  for (var i = 0; !defined(result) && i < node.childNodes.length; ++i) {
    var child = node.childNodes[i];

    if (nodeWhere.indexOf(child.localName) >= 0) {
      return getGeometryFromWhere(child);
    } else if (simpleGeometryNames.indexOf(child.localName) >= 0) {
      return createGeoJsonGeometryFeatureFromSimpleGeoRssGeometry(child);
    } else if (identifyW3C.indexOf(child.localName) >= 0) {
      return createGeoJsonGeometryFeatureFromW3cGeometry(child);
    } else {
      result = getGeometry(child);
    }
  }
  return result;
}
function getGeometryFromWhere(node) {
  var result;
  for (var i = 0; !defined(result) && i < node.childNodes.length; ++i) {
    var child = node.childNodes[i];
    if (gmlFeatureNames.indexOf(child.localName) >= 0) {
      return createGeoJsonGeometryFeatureFromGmlGeometry(child);
    } else if (simpleGeometryNames.indexOf(child.localName) >= 0) {
      return createGeoJsonGeometryFeatureFromSimpleGeoRssGeometry(child);
    } else {
      result = getGeometryFromWhere(child);
    }
  }
  return result;
}

function createGeoJsonGeometryFeatureFromGmlGeometry(geometry) {
  return geoJsonGeometryFromGmlGeometry(geometry);
}

function createGeoJsonGeometryFeatureFromSimpleGeoRssGeometry(geometry) {
  return geoJsonGeometryFromGeoRssSimpleGeometry(geometry);
}

function createGeoJsonGeometryFeatureFromW3cGeometry(geometry) {
  return geoJsonGeometryFromW3cGeometry(geometry);
}
