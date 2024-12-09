import { runInAction } from "mobx";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import isDefined from "../../Core/isDefined";
import {
  isJsonNumber,
  isJsonObject,
  isJsonString,
  JsonObject
} from "../../Core/Json";
import TerriaFeature from "../../Models/Feature/Feature";
import { isTerriaFeatureData } from "../../Models/Feature/FeatureData";
import { FeatureInfoFormat } from "../../Traits/TraitsClasses/FeatureInfoTraits";
import { formatDateTime } from "./mustacheExpressions";

/**
 *
 * If they require .getValue, apply that.
 * If they have bad keys, fix them.
 * If they have formatting, apply it.
 */
export default function getFeatureProperties(
  feature: TerriaFeature,
  currentTime: JulianDate,
  formats?: Record<string, FeatureInfoFormat>
) {
  const properties = propertyGetTimeValues(feature, currentTime);

  if (!properties) return undefined;

  // Try JSON.parse on values that look like JSON arrays or objects
  let result = parseValues(properties);
  if (result === undefined) {
    return undefined;
  }
  result = replaceBadKeyCharacters(result);

  if (formats) {
    applyFormatsInPlace(result, formats);
  }
  return result;
}

/**
 * Gets the values from a Entity's properties object for the time on the current clock.
 */
export function propertyGetTimeValues(
  feature: TerriaFeature,
  currentTime: JulianDate
): JsonObject | undefined {
  // Check if feature.data is TerriaFeatureData with timeIntervalCollection
  // If so - use that instead of feature.properties
  if (isDefined(feature.data)) {
    if (
      isTerriaFeatureData(feature.data) &&
      feature.data.timeIntervalCollection
    )
      return feature.data.timeIntervalCollection.getValue(currentTime);
  }

  if (isDefined(feature.properties)) {
    const result = feature.properties.getValue(currentTime);

    // Fixes a bug where FeatureInfoDownload tries to serialize a circular object
    // the _changedEvent._scope property contains _intervals
    // Serializing the Event is not very useful, anyway
    if (result._intervals && result._intervals._changedEvent) {
      result._intervals._changedEvent = undefined;
    }
    return result;
  }
}

function parseValues(properties: JsonObject) {
  // JSON.parse property values that look like arrays or objects
  const result: JsonObject = {};
  for (const key in properties) {
    if (Object.prototype.hasOwnProperty.call(properties, key)) {
      let val = properties[key];
      if (
        val &&
        (typeof val === "string" || val instanceof String) &&
        /^\s*[[{]/.test(val as string)
      ) {
        try {
          val = JSON.parse(val as string);
        } catch (e) {
          console.warn(
            `Error parsing JSON in feature properties "${key}": ${e}\nWill use string value instead: "${val}"`
          );
        }
      }
      result[key] = val;
    }
  }
  return result;
}

/**
 * Formats values in an object if their keys match the provided formats object.
 * @private
 * @param {Object} properties a map of property labels to property values.
 * @param {Object} formats A map of property labels to the number formats that should be applied for them.
 */
function applyFormatsInPlace(
  properties: JsonObject,
  formats: Record<string, FeatureInfoFormat>
) {
  // Optionally format each property. Updates properties in place, returning nothing.
  for (const key in formats) {
    if (Object.prototype.hasOwnProperty.call(properties, key)) {
      // Default type if not provided is number.
      const value = properties[key];
      if (
        (isJsonNumber(value) && !isDefined(formats[key].type)) ||
        (isDefined(formats[key].type) && formats[key].type === "number")
      ) {
        runInAction(() => {
          // Convert string to number if necessary
          const number = isJsonNumber(value)
            ? value
            : isJsonString(value)
              ? parseFloat(value)
              : undefined;
          // Note we default maximumFractionDigits to 20 (not 3).
          properties[key] = number?.toLocaleString(undefined, {
            maximumFractionDigits: 20,
            useGrouping: true,
            ...formats[key]
          });
        });
      }
      if (isDefined(formats[key].type)) {
        if (formats[key].type === "dateTime" && isJsonString(value)) {
          runInAction(() => {
            properties[key] = formatDateTime(value, formats[key]);
          });
        }
      }
    }
  }
}

/**
 * Recursively replace '.' and '#' in property keys with _, since Mustache cannot reference keys with these characters.
 * @private
 */
function replaceBadKeyCharacters(properties: JsonObject) {
  const result: JsonObject = {};
  for (const key in properties) {
    if (Object.prototype.hasOwnProperty.call(properties, key)) {
      const cleanKey = key.replace(/[.#]/g, "_");
      const value = properties[key];
      result[cleanKey] = isJsonObject(value)
        ? replaceBadKeyCharacters(value)
        : value;
    }
  }
  return result;
}
