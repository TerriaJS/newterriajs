import { runInAction } from "mobx";
import {
  CircleSymbolizer,
  Feature,
  GeomType,
  JsonValue,
  LabelRule,
  LineSymbolizer,
  PaintRule,
  PolygonSymbolizer,
  Feature as ProtomapsFeature
} from "protomaps-leaflet";
import TimeInterval from "terriajs-cesium/Source/Core/TimeInterval";
import { isJsonNumber } from "../../../Core/Json";
import { NotNull, NotUndefined } from "../../../Core/TypeModifiers";
import GeoJsonMixin, {
  FEATURE_ID_PROP,
  getStyleReactiveDependencies
} from "../../../ModelMixins/GeojsonMixin";
import TableStyleMap, {
  isConstantStyleMap
} from "../../../Table/TableStyleMap";
import { TableStyleMapSymbolTraits } from "../../../Traits/TraitsClasses/Table/StyleMapTraits";
import { GEOJSON_SOURCE_LAYER_NAME } from "./ProtomapsGeojsonSource";

/** Helper function to create a function which can be used to generate styles for a given rowID. This ensures that nothing is read outside reactive context */
function getStyleValueFn<
  T extends TableStyleMapSymbolTraits,
  Key extends keyof T,
  Value extends NotUndefined<NotNull<T[keyof T]>>
>(
  tableStyleMap: TableStyleMap<T>,
  trait: Key,
  defaultValue: Value,
  useRowId = true,
  transformValue?: (v: Value) => Value
): (z: number, f?: ProtomapsFeature) => Value {
  const styleMap = runInAction(() => tableStyleMap.styleMap);

  if (isConstantStyleMap(styleMap)) {
    return () => {
      const value = styleMap.style[trait];
      if (value === undefined) {
        return defaultValue;
      }
      return transformValue ? transformValue(value as Value) : (value as Value);
    };
  }

  if (useRowId) {
    return (_: number, f?: ProtomapsFeature) => {
      const rowId = isJsonNumber(f?.props[FEATURE_ID_PROP])
        ? (f?.props[FEATURE_ID_PROP] as number)
        : -1;
      const value = styleMap.mapRowIdToStyle(rowId)[trait];
      if (value === undefined) {
        return defaultValue;
      }
      return transformValue ? transformValue(value as Value) : (value as Value);
    };
  }

  const columnName = runInAction(() => tableStyleMap.traits.column);

  return (_: number, f?: ProtomapsFeature) => {
    const value = styleMap.mapValueToStyle(f?.props[columnName ?? ""])[trait];
    if (value === undefined) {
      return defaultValue;
    }
    return transformValue ? transformValue(value as Value) : (value as Value);
  };
}

/** Convert TableStyle to protomaps paint/label rules.
 * It currently supports
 * - ColorMap (for fill/stroke)
 * - OutlineStyleMap (color, width and dash)
 * - PointStyleMap (fill, stroke, radius - which uses height)
 */
export function tableStyleToProtomaps(
  catalogItem: GeoJsonMixin.Instance,
  useRowIds = true,
  includePointSymbols = false
): {
  currentTimeRows?: number[];
  paintRules: PaintRule[];
  labelRules: LabelRule[];
} {
  let currentTimeRows: number[] | undefined;

  // Access all dependencies so reactivity works
  getStyleReactiveDependencies(catalogItem);

  // If time varying, get row indices which match
  // This is used to filter feature[FEATURE_ID_PROP]
  if (
    catalogItem.currentTimeAsJulianDate &&
    catalogItem.activeTableStyle.timeIntervals &&
    catalogItem.activeTableStyle.moreThanOneTimeInterval
  ) {
    currentTimeRows = catalogItem.activeTableStyle.timeIntervals.reduce<
      number[]
    >((rows, timeInterval, index) => {
      if (
        timeInterval &&
        TimeInterval.contains(
          timeInterval,
          catalogItem.currentTimeAsJulianDate!
        )
      ) {
        rows.push(index);
      }
      return rows;
    }, []);
  }

  // NOTE: Make sure we don't access computed properties in style functions, as they will be re-computed for every feature
  const colorValueFunction = runInAction(
    () => catalogItem.activeTableStyle.colorColumn?.valueFunctionForType
  );
  const colorColumnName = runInAction(
    () => catalogItem.activeTableStyle.colorTraits.colorColumn
  );
  const colorMap = runInAction(() => catalogItem.activeTableStyle.colorMap);

  // Style function
  const getColorValue = (_z: number, f?: ProtomapsFeature) => {
    let value: JsonValue | undefined;

    if (useRowIds) {
      const rowId = isJsonNumber(f?.props[FEATURE_ID_PROP])
        ? f?.props[FEATURE_ID_PROP]
        : -1;

      value = colorValueFunction?.(rowId ?? -1);
    } else {
      value = colorColumnName ? f?.props[colorColumnName] : undefined;
    }

    return colorMap.mapValueToColor(value).toCssColorString();
  };

  const useOutlineColorForLineFeatures =
    catalogItem.useOutlineColorForLineFeatures;

  const getOutlineWidthValue = getStyleValueFn(
    catalogItem.activeTableStyle.outlineStyleMap,
    "width",
    catalogItem.defaultStyles.polygonStrokeWidth,
    useRowIds
  );
  const getOutlineColorValue = getStyleValueFn(
    catalogItem.activeTableStyle.outlineStyleMap,
    "color",
    catalogItem.terria.baseMapContrastColor,
    useRowIds
  );
  const getOutlineDashValue = getStyleValueFn(
    catalogItem.activeTableStyle.outlineStyleMap,
    "dash",
    [] as number[],
    useRowIds
  );

  const getPointRadiusValue = getStyleValueFn(
    catalogItem.activeTableStyle.pointStyleMap,
    "height",
    2,
    useRowIds,
    (v) => (3 * v) / 8 // Divide height by 2 to get radius, and then reduce by 25% to make it look better (most of the time protomaps image tiles are scaled up)
  );

  // Filter features by time if applicable
  const showFeature = (_z: number, f?: ProtomapsFeature) =>
    !currentTimeRows ||
    (isJsonNumber(f?.props[FEATURE_ID_PROP]) &&
      currentTimeRows.includes(f?.props[FEATURE_ID_PROP] as number));

  return {
    currentTimeRows,
    labelRules: [],
    paintRules: [
      // Polygon features
      {
        dataLayer: GEOJSON_SOURCE_LAYER_NAME,
        symbolizer: new PolygonSymbolizer({
          fill: getColorValue,
          stroke: getOutlineColorValue,
          width: getOutlineWidthValue
        }),
        minzoom: 0,
        maxzoom: Infinity,
        filter: (zoom, feature) => {
          return (
            feature?.geomType === GeomType.Polygon && showFeature(zoom, feature)
          );
        }
      },

      // Line features
      // Note - line color will use TableColorStyleTraits by default.
      // If useOutlineColorForLineFeatures is true, then line color will use TableOutlineStyle traits

      {
        dataLayer: GEOJSON_SOURCE_LAYER_NAME,
        symbolizer: new LineSymbolizer({
          color: useOutlineColorForLineFeatures
            ? getOutlineColorValue
            : getColorValue,
          width: getOutlineWidthValue,
          dash: getOutlineDashValue as any, // Incorrect type upstream
          dashColor: useOutlineColorForLineFeatures
            ? getOutlineColorValue
            : getColorValue,
          dashWidth: getOutlineWidthValue
        }),
        minzoom: 0,
        maxzoom: Infinity,
        filter: (zoom, feature) => {
          return (
            feature?.geomType === GeomType.Line && showFeature(zoom, feature)
          );
        }
      },

      ...(includePointSymbols
        ? [
            {
              dataLayer: GEOJSON_SOURCE_LAYER_NAME,
              symbolizer: new CircleSymbolizer({
                fill: getColorValue,
                stroke: getOutlineColorValue,
                width: getOutlineWidthValue,
                radius: getPointRadiusValue
              }),
              minzoom: 0,
              maxzoom: Infinity,
              filter: (_: unknown, f: Feature) => f.geomType === GeomType.Point
            }
          ]
        : [])
    ]
  };
}

/** Returns true if any styles have point (or label) styles that aren't supported by protomaps */
export function hasUnsupportedStylesForProtomaps(
  catalogItem: GeoJsonMixin.Instance
): boolean {
  return catalogItem.styles.some((style) => {
    return (
      [...style.point.enum, ...style.point.bin, style.point.null].some(
        (pointStyle) =>
          pointStyle.marker &&
          pointStyle.marker !== "circle" &&
          pointStyle.marker !== "point"
      ) ||
      style.label.enabled ||
      style.trail.enabled
    );
  });
}
