import { action, runInAction } from "mobx";
import {
  GeomType,
  PolygonSymbolizer,
  Feature as ProtomapsFeature
} from "protomaps-leaflet";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import TimeInterval from "terriajs-cesium/Source/Core/TimeInterval";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import isDefined from "../Core/isDefined";
import { isJsonNumber } from "../Core/Json";
import ProtomapsImageryProvider from "../Map/ImageryProvider/ProtomapsImageryProvider";
import { TerriaFeatureData } from "../Models/Feature/FeatureData";
import TableStyle from "./TableStyle";
import { isConstantStyleMap } from "./TableStyleMap";

export default function createRegionMappedImageryProvider(
  style: TableStyle,
  currentTime: JulianDate | undefined
): ImageryProvider | undefined {
  if (!style.isRegions()) {
    return undefined;
  }

  const regionColumn = style.regionColumn;
  const regionType = regionColumn.regionType;
  if (regionType === undefined) {
    return undefined;
  }

  const terria = style.tableModel.terria;
  const colorColumn = style.colorColumn;
  const valueFunction =
    colorColumn !== undefined ? colorColumn.valueFunctionForType : () => null;
  const colorMap = style.colorMap;
  const valuesAsRegions = regionColumn.valuesAsRegions;
  const outlineStyleMap = style.outlineStyleMap.styleMap;

  let currentTimeRows: number[] | undefined;

  // If time varying, get row indices which match
  if (currentTime && style.timeIntervals && style.moreThanOneTimeInterval) {
    currentTimeRows = style.timeIntervals.reduce<number[]>(
      (rows, timeInterval, index) => {
        if (timeInterval && TimeInterval.contains(timeInterval, currentTime!)) {
          rows.push(index);
        }
        return rows;
      },
      []
    );
  }

  const getRowNumber = (_zoom: number, f?: ProtomapsFeature) => {
    const regionId = f?.props[regionType.uniqueIdProp];
    return isJsonNumber(regionId)
      ? getImageryLayerFilteredRow(
          style,
          currentTimeRows,
          valuesAsRegions.regionIdToRowNumbersMap.get(regionId)
        )
      : undefined;
  };

  const showFeature = (zoom: number, f?: ProtomapsFeature) =>
    isDefined(getRowNumber(zoom, f));

  const getColorValue = (zoom: number, f?: ProtomapsFeature) => {
    const rowNumber = getRowNumber(zoom, f);
    return colorMap
      .mapValueToColor(isDefined(rowNumber) ? valueFunction(rowNumber) : null)
      .toCssColorString();
  };

  const getOutlineColorValue = (zoom: number, f?: ProtomapsFeature) => {
    const defaultOutlineColor = runInAction(() => terria.baseMapContrastColor);
    const rowNumber = getRowNumber(zoom, f);
    if (!isDefined(rowNumber)) return defaultOutlineColor;

    return (
      (isConstantStyleMap(outlineStyleMap)
        ? outlineStyleMap.style.color
        : outlineStyleMap.mapRowIdToStyle(rowNumber ?? -1).color) ??
      defaultOutlineColor
    );
  };

  const getOutlineWidthValue = (zoom: number, f?: ProtomapsFeature) => {
    const rowNumber = getRowNumber(zoom, f);
    if (!isDefined(rowNumber)) return 1;

    return (
      (isConstantStyleMap(outlineStyleMap)
        ? outlineStyleMap.style.width
        : outlineStyleMap.mapRowIdToStyle(rowNumber ?? -1).width) ?? 1
    );
  };

  return new ProtomapsImageryProvider({
    terria,
    // Use the URL as the id, this is needed for backward compatibility with MapboxImageryProvider, for when picking features (as it uses the URL as the id)
    id: regionType.server,
    data: regionType.server,
    minimumZoom: regionType.serverMinZoom,
    maximumNativeZoom: regionType.serverMaxNativeZoom,
    maximumZoom: regionType.serverMaxZoom,
    idProperty: regionType.uniqueIdProp,
    paintRules: [
      // Polygon features
      {
        dataLayer: regionType.layerName,
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
      }
    ],
    labelRules: [],

    processPickedFeatures: async (features) =>
      features
        .map((feature) =>
          getImageryLayerFeatureInfo(style, feature, currentTimeRows)
        )
        .filter(isDefined)
  });
}

/**
 * Filters row numbers by time (if applicable) - for a given region mapped ImageryLayer
 */
const getImageryLayerFilteredRow = action(
  (
    style: TableStyle,
    currentTimeRows: number[] | undefined,
    rowNumbers: number | readonly number[] | undefined
  ): number | undefined => {
    if (!isDefined(rowNumbers)) return;

    if (!isDefined(currentTimeRows)) {
      return Array.isArray(rowNumbers) ? rowNumbers[0] : rowNumbers;
    }

    if (
      typeof rowNumbers === "number" &&
      currentTimeRows.includes(rowNumbers)
    ) {
      return rowNumbers;
    } else if (Array.isArray(rowNumbers)) {
      const matchingTimeRows: number[] = rowNumbers.filter((row) =>
        currentTimeRows!.includes(row)
      );
      if (matchingTimeRows.length <= 1) {
        return matchingTimeRows[0];
      }
      // In a time-varying dataset, intervals may
      // overlap at their endpoints (i.e. the end of one interval is the start of the next).
      // In that case, we want the later interval to apply.
      return matchingTimeRows.reduce((latestRow, currentRow) => {
        const currentInterval = style.timeIntervals?.[currentRow]?.stop;
        const latestInterval = style.timeIntervals?.[latestRow]?.stop;
        if (
          currentInterval &&
          latestInterval &&
          JulianDate.lessThan(latestInterval, currentInterval)
        ) {
          return currentRow;
        }
        return latestRow;
      }, matchingTimeRows[0]);
    }
  }
);

/**
 * Get ImageryLayerFeatureInfo for a given ImageryLayer input and feature.
 */

const getImageryLayerFeatureInfo = (
  style: TableStyle,
  feature: ImageryLayerFeatureInfo,
  currentTimeRows: number[] | undefined
) => {
  if (isDefined(style.regionColumn?.regionType?.uniqueIdProp)) {
    const regionType = style.regionColumn!.regionType!;
    const regionRows =
      style.regionColumn!.valuesAsRegions.regionIdToRowNumbersMap.get(
        feature.properties[regionType.uniqueIdProp]
      ) ?? [];

    const rowId = getImageryLayerFilteredRow(
      style,
      currentTimeRows,
      regionRows
    );

    if (!isDefined(rowId)) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    style.tableModel.tableColumns;

    const rowObject = style.tableModel.tableColumns.reduce<{
      [key: string]: string | number | null;
    }>((obj, column) => {
      obj[column.name] = column.valueFunctionForType(rowId);

      return obj;
    }, {});

    // Preserve values from d and insert feature properties after entries from d
    const featureData = Object.assign(
      {},
      rowObject,
      feature.properties,
      rowObject
    );

    if (isDefined(regionType.nameProp)) {
      feature.name = featureData[regionType.nameProp] as string;
    }

    featureData.id = feature.properties[regionType.uniqueIdProp];
    feature.properties = featureData;
    const terriaFeatureData: TerriaFeatureData = {
      rowIds: isJsonNumber(regionRows) ? [regionRows] : [...regionRows],
      type: "terriaFeatureData"
    };
    feature.data = terriaFeatureData;

    feature.configureDescriptionFromProperties(featureData);
    feature.configureNameFromProperties(featureData);

    // Set name of feature to region name if it exists
    if (
      isDefined(regionType.nameProp) &&
      typeof featureData[regionType.nameProp] === "string"
    )
      feature.name = featureData[regionType.nameProp];

    return feature;
  }

  return undefined;
};
