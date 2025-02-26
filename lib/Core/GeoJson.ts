import {
  feature,
  Feature,
  featureCollection,
  FeatureCollection,
  Geometries,
  Geometry,
  GeometryCollection,
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
  Properties
} from "@turf/helpers";
import { isJsonObject, isJsonString } from "./Json";

export type GeoJsonCrs =
  | {
      type: "name";
      properties: {
        name: string;
      };
    }
  | {
      type: "EPSG";
      properties: {
        code: string;
      };
    };

export type FeatureCollectionWithCrs<
  G = Geometry | GeometryCollection,
  P = Properties
> = FeatureCollection<G, P> & {
  crs?: GeoJsonCrs;
};
// Note: these type checks are not that rigorous, we are assuming we are getting valid GeoJson objects
export function isFeatureCollection(
  json: any
): json is FeatureCollectionWithCrs {
  return (
    isJsonObject(json, false) &&
    json.type === "FeatureCollection" &&
    Array.isArray(json.features)
  );
}

export function isFeature(json: any): json is Feature {
  return (
    isJsonObject(json, false) && json.type === "Feature" && !!json.geometry
  );
}

export function isPoint(json: any): json is Feature<Point> {
  return (
    isJsonObject(json, false) &&
    json.type === "Feature" &&
    isJsonObject(json.geometry, false) &&
    json.geometry.type === "Point"
  );
}

export function isMultiPoint(json: any): json is Feature<MultiPoint> {
  return (
    isJsonObject(json, false) &&
    json.type === "Feature" &&
    isJsonObject(json.geometry, false) &&
    json.geometry.type === "MultiPoint"
  );
}

export function isLine(json: any): json is Feature<LineString> {
  return (
    isJsonObject(json, false) &&
    json.type === "Feature" &&
    isJsonObject(json.geometry, false) &&
    json.geometry.type === "LineString"
  );
}

export function isMultiLineString(json: any): json is Feature<MultiLineString> {
  return (
    isJsonObject(json, false) &&
    json.type === "Feature" &&
    isJsonObject(json.geometry, false) &&
    json.geometry.type === "MultiLineString"
  );
}

export function isPolygon(json: any): json is Feature<Polygon> {
  return (
    isJsonObject(json, false) &&
    json.type === "Feature" &&
    isJsonObject(json.geometry, false) &&
    json.geometry.type === "Polygon"
  );
}

export function isMultiPolygon(json: any): json is Feature<MultiPolygon> {
  return (
    isJsonObject(json, false) &&
    json.type === "Feature" &&
    isJsonObject(json.geometry, false) &&
    json.geometry.type === "MultiPolygon"
  );
}

export function isGeometryCollection(
  json: any
): json is Feature<GeometryCollection> {
  return (
    isJsonObject(json, false) &&
    json.type === "Feature" &&
    isJsonObject(json.geometry, false) &&
    json.geometry.type === "GeometryCollection"
  );
}

export function isGeometries(json: any): json is Geometries {
  return (
    isJsonObject(json, false) &&
    isJsonString(json.type) &&
    [
      "Point",
      "MultiPoint",
      "LineString",
      "MultiLineString",
      "Polygon",
      "MultiPolygon"
    ].includes(json.type) &&
    Array.isArray(json.coordinates)
  );
}

/**
 * Returns the points in a MultiPoint as separate Point features.
 */
export function explodeMultiPoint(feature: Feature): Feature[] {
  return feature.geometry?.type === "MultiPoint"
    ? feature.geometry.coordinates.map((coordinates) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates
        } as Point,
        properties: feature.properties
      }))
    : [];
}

export function toFeatureCollection(
  json: any
): FeatureCollectionWithCrs | undefined {
  if (isFeatureCollection(json)) return json; // It's already a feature collection, do nothing

  if (isFeature(json)) {
    // Move CRS data from Feature to FeatureCollection
    if ("crs" in json && isJsonObject((json as any).crs)) {
      const crs = (json as any).crs;
      delete (json as any).crs;

      const fc = featureCollection([json]) as FeatureCollectionWithCrs;
      fc.crs = crs;
      return fc;
    }

    return featureCollection([json]) as FeatureCollectionWithCrs;
  }

  if (isGeometries(json))
    return featureCollection([feature(json)]) as FeatureCollectionWithCrs;
  if (Array.isArray(json) && json.every((item) => isFeature(item))) {
    return featureCollection(json) as FeatureCollectionWithCrs;
  }
  if (Array.isArray(json) && json.every((item) => isGeometries(item))) {
    return featureCollection(
      json.map((item) => feature(item))
    ) as FeatureCollectionWithCrs;
  }
}
