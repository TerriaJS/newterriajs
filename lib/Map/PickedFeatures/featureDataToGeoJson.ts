import Point from "@mapbox/point-geometry";
import {
  Feature as GeoJsonFeature,
  Geometry as GeoJsonGeometry,
  Position
} from "@turf/helpers";
import {
  Feature as ArcGisFeature,
  Point as ArcGisPoint,
  Polygon as ArcGisPolygon,
  Polyline as ArcGisPolyline,
  Position as ArcGisPosition,
  esriGeometryType,
  FeatureSet,
  SpatialReference
} from "arcgis-rest-api";
import pointInPolygon from "point-in-polygon";
import defined from "terriajs-cesium/Source/Core/defined";
import WindingOrder from "terriajs-cesium/Source/Core/WindingOrder";
import filterOutUndefined from "../../Core/filterOutUndefined";
import {
  FeatureCollectionWithCrs,
  GeoJsonCrs,
  toFeatureCollection
} from "../../Core/GeoJson";
import JsonValue, { isJsonObject, isJsonValue } from "../../Core/Json";
import computeRingWindingOrder from "../Vector/computeRingWindingOrder";

/**
 * Converts feature data, such as from a WMS GetFeatureInfo or an Esri Identify, to
 * GeoJSON.  The set of feature data formats supported by this function can be extended
 * by adding to {@link featureDataToGeoJson#supportedFormats}.
 *
 * @param {JsonValue} featureData The feature data to convert to GeoJSON.
 * @return {FeatureCollectionWithCrs | undefined} The GeoJSON representation of this feature data, or undefined if it cannot be converted to GeoJSON.
 */
export default function featureDataToGeoJson(
  featureData: unknown
): FeatureCollectionWithCrs | undefined {
  if (!isJsonValue(featureData)) {
    return undefined;
  }

  for (let i = 0; i < featureDataToGeoJson.supportedFormats.length; ++i) {
    const converted =
      featureDataToGeoJson.supportedFormats[i].converter(featureData);
    if (defined(converted)) {
      return converted;
    }
  }
  return undefined;
}

featureDataToGeoJson.supportedFormats = [
  {
    name: "GeoJSON",
    converter: convertGeoJson
  },
  {
    name: "Esri",
    converter: convertEsri
  }
];

function convertGeoJson(featureData: JsonValue) {
  return toFeatureCollection(featureData);
}

function convertEsri(featureData: JsonValue) {
  if (
    (isEsriFeatureSet(featureData) || isEsriFeature(featureData)) &&
    hasEsriGeometryType(featureData)
  )
    return getEsriGeometry(featureData, featureData.geometryType);
}

function getEsriGeometry(
  featureData: FeatureSet | ArcGisFeature,
  geometryType: esriGeometryType
): FeatureCollectionWithCrs | undefined {
  const crs = esriSpatialReferenceToCrs(
    "geometry" in featureData
      ? featureData.geometry.spatialReference
      : featureData.spatialReference
  );

  return {
    type: "FeatureCollection",
    crs: crs ? crs : undefined,
    features: filterOutUndefined(
      "geometry" in featureData
        ? [getEsriFeature(featureData, geometryType)]
        : featureData.features.map((f) => getEsriFeature(f, geometryType))
    )
  };
}

function getEsriFeature(
  featureData: ArcGisFeature,
  geometryType: esriGeometryType
): GeoJsonFeature | undefined {
  let geojsonGeom: GeoJsonGeometry | undefined;

  if (!featureData?.geometry) return undefined;

  if (geometryType === "esriGeometryPolygon") {
    const geometry = featureData.geometry as ArcGisPolygon;
    // There are a bunch of differences between Esri polygons and GeoJSON polygons.
    // For GeoJSON, see https://tools.ietf.org/html/rfc7946#section-3.1.6.
    // For Esri, see http://resources.arcgis.com/en/help/arcgis-rest-api/#/Geometry_objects/02r3000000n1000000/
    // In particular:
    // 1. Esri polygons can actually be multiple polygons by using multiple outer rings.  GeoJSON polygons
    //    can only have one outer ring and we need to use a MultiPolygon to represent multiple outer rings.
    // 2. In Esri which rings are outer rings and which are holes is determined by the winding order of the
    //    rings.  In GeoJSON, the first ring is the outer ring and subsequent rings are holes.
    // 3. In Esri polygons, clockwise rings are exterior, counter-clockwise are interior.  In GeoJSON, the first
    //    (exterior) ring is expected to be counter-clockwise, though lots of implementations probably don't
    //    enforce this.  The spec says, "For backwards compatibility, parsers SHOULD NOT reject
    //    Polygons that do not follow the right-hand rule."

    // Group rings into outer rings and holes/
    const outerRings: ArcGisPosition[][] = [];
    const holes: ArcGisPosition[][] = [];
    geometry.rings.forEach(function (ring) {
      if (
        computeRingWindingOrder(
          filterOutUndefined(ring.map((p) => new Point(p[0], p[1])))
        ) === WindingOrder.CLOCKWISE
      ) {
        outerRings.push(ring);
      } else {
        holes.push(ring);
      }

      // Reverse the coordinate order along the way due to #3 above.
      ring.reverse();
    });

    if (outerRings.length === 0 && holes.length > 0) {
      // Well, this is pretty weird.  We have holes but not outer ring?
      // Most likely scenario is that someone messed up the winding order.
      // So let's treat all the holes as outer rings instead.
      holes.forEach((hole) => {
        if (Array.isArray(hole)) {
          hole.reverse();
        }
      });
      outerRings.push(...holes);
      holes.length = 0;
    }

    // If there's only one outer ring, we can use a `Polygon` and things are simple.
    if (outerRings.length === 1) {
      geojsonGeom = {
        type: "Polygon",
        coordinates: [outerRings[0], ...holes]
      };
    } else {
      // Multiple (or zero!) outer rings, so we need to use a multipolygon, and we need
      // to figure out which outer ring contains each hole.
      geojsonGeom = {
        type: "MultiPolygon",
        coordinates: outerRings.map((ring) => [
          ring,
          ...findHolesInRing(ring, holes)
        ])
      };
    }
  } else if (geometryType === "esriGeometryPoint") {
    const geometry = featureData.geometry as ArcGisPoint;
    geojsonGeom = {
      type: "Point",
      coordinates: [geometry.x, geometry.y]
    };
  } else if (geometryType === "esriGeometryPolyline") {
    const geometry = featureData.geometry as ArcGisPolyline;
    geojsonGeom = {
      type: "MultiLineString",
      coordinates: geometry.paths
    };
  } else {
    return undefined;
  }

  if (geojsonGeom) {
    return {
      type: "Feature" as const,
      properties: isJsonObject(featureData.attributes)
        ? featureData.attributes
        : {},
      geometry: geojsonGeom
    };
  }
}

function findHolesInRing(ring: Position[], holes: Position[][]) {
  // Return all holes where every vertex in the hole ring is inside the outer ring.
  return holes.filter((hole) =>
    hole.every((coordinates) => pointInPolygon(coordinates, ring))
  );
}

function esriSpatialReferenceToCrs(
  spatialReference: SpatialReference | undefined
): GeoJsonCrs | undefined {
  let code: number | string | undefined;

  if (spatialReference) {
    if ("wkt" in spatialReference && spatialReference.wkt) {
      code = spatialReference.wkt;
    }
    if ("latestWkt" in spatialReference && spatialReference.latestWkt) {
      code = spatialReference.latestWkt;
    }

    if ("wkid" in spatialReference && spatialReference.wkid) {
      code = spatialReference.wkid;
    }
    if ("latestWkid" in spatialReference && spatialReference.latestWkid) {
      code = spatialReference.latestWkid;
    }
  }

  if (code === 102100) {
    return {
      type: "EPSG",
      properties: {
        code: "3857"
      }
    };
  } else if (typeof code === "number") {
    return {
      type: "EPSG",
      properties: {
        code: code.toString()
      }
    };
  } else if (typeof code === "string") {
    return {
      type: "name",
      properties: {
        name: code
      }
    };
  }
}

/** Very very basic type test for EsriFeatureSet */
function isEsriFeatureSet(obj: any): obj is FeatureSet {
  return isJsonObject(obj, false) && Array.isArray(obj.features);
}

function isEsriFeature(obj: any): obj is ArcGisFeature {
  return isJsonObject(obj, false) && isJsonObject(obj.geometry, false);
}

function hasEsriGeometryType(
  obj: any
): obj is { geometryType: esriGeometryType } {
  return (
    "geometryType" in obj &&
    [
      "esriGeometryPoint",
      "esriGeometryMultipoint",
      "esriGeometryPolyline",
      "esriGeometryPolygon",
      "esriGeometryEnvelope"
    ].includes(obj.geometryType)
  );
}
