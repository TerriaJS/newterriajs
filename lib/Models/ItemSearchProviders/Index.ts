import JsonValue, {
  assertNumber,
  assertObject,
  assertString
} from "../../Core/Json";
import EnumIndex, { EnumValue } from "./EnumIndex";
import NumericIndex from "./NumericIndex";
import TextIndex from "./TextIndex";
import { IndexType, indexTypes } from "./Types";

export { default as EnumIndex } from "./EnumIndex";
export { default as NumericIndex } from "./NumericIndex";
export { IndexType, indexTypes } from "./Types";

// IndexRoot holds the indexes for each property and top level options
export type IndexRoot = {
  resultsDataUrl: string; // Url of the CSV data file.
  idProperty: string; // Name of the property to be used as ID
  indexes: Record<string, Index>; // A map from property name to its `Index` definition.
};

export type Index = NumericIndex | EnumIndex | TextIndex;

export type ID = number;

const indexParsers: Record<IndexType, (json: any) => Index> = {
  numeric: parseNumericIndex,
  enum: parseEnumIndex,
  text: parseTextIndex
};

export function parseIndexRoot(json: JsonValue): IndexRoot {
  assertObject(json, "IndexRoot");
  assertString(json.resultsDataUrl, "resultsDataUrl");
  assertString(json.idProperty, "idProperty");
  assertObject(json.indexes, "indexes");
  const indexes: Record<string, Index> = Object.entries(json.indexes).reduce(
    (indexes: Record<string, Index>, [property, index]) => {
      indexes[property] = parseIndex(index);
      return indexes;
    },
    {}
  );
  return {
    resultsDataUrl: json.resultsDataUrl,
    idProperty: json.idProperty,
    indexes
  };
}

export function parseIndexType(json: JsonValue): IndexType {
  assertString(json, "IndexType");
  if (indexTypes.includes(json)) return json as IndexType;
  throw new Error(
    `Expected index type to be ${indexTypes.join("|")}, got ${json}`
  );
}

function parseIndex(json: JsonValue): Index {
  assertObject(json, "Index");
  assertString(json.type, "type");
  const parser = indexParsers[json.type as IndexType];
  if (parser) return parser(json);
  throw new Error(
    `Expected index type to be ${indexTypes.join("|")}, got ${json.type}`
  );
}

function parseNumericIndex(json: JsonValue): NumericIndex {
  assertObject(json, "NumericIndex");
  assertObject(json.range, "range");
  assertNumber(json.range.max, "range.max");
  assertNumber(json.range.min, "range.min");
  assertString(json.url, "url");
  return new NumericIndex(json.url, {
    min: json.range.min,
    max: json.range.max
  });
}

function parseEnumIndex(json: JsonValue): EnumIndex {
  assertObject(json, "EnumIndex");
  assertObject(json.values);
  const values: Record<string, EnumValue> = Object.entries(json.values).reduce(
    (values: Record<string, EnumValue>, [id, value]) => {
      values[id] = parseEnumValue(value);
      return values;
    },
    {}
  );
  return new EnumIndex(values);
}

function parseEnumValue(json: JsonValue): EnumValue {
  assertObject(json, "EnumValue");
  assertNumber(json.count);
  assertString(json.url);
  return {
    count: json.count,
    url: json.url
  };
}

function parseTextIndex(json: JsonValue): TextIndex {
  assertObject(json, "EnumIndex");
  assertString(json.url);
  return new TextIndex(json.url);
}
