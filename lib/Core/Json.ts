type JsonValue =
  | boolean
  | number
  | string
  | null
  | JsonArray
  | JsonObject
  | undefined;
export interface JsonObject {
  [key: string]: JsonValue;
}
export interface JsonArray<T = JsonValue> extends Array<T> {}

export default JsonValue;

export function isJsonObject(value: unknown, deep = true): value is JsonObject {
  return (
    value !== undefined &&
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    (!deep || Object.values(value).every((v) => isJsonValue(v, true)))
  );
}

export function isJsonBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function isJsonNumber(value: unknown): value is number {
  return typeof value === "number";
}

export function isJsonString(value: unknown): value is string {
  return typeof value === "string";
}

export function isJsonValue(value: unknown, deep = true): value is JsonValue {
  return (
    typeof value === "undefined" ||
    value === null ||
    isJsonBoolean(value) ||
    isJsonNumber(value) ||
    isJsonString(value) ||
    isJsonArray(value, deep) ||
    isJsonObject(value, deep)
  );
}

export function isJsonArray(value: unknown, deep = true): value is JsonArray {
  return (
    Array.isArray(value) &&
    (!deep || value.every((child) => isJsonValue(child, true)))
  );
}

export function isJsonObjectArray(
  value: unknown,
  deep = true
): value is JsonArray<JsonObject> {
  return (
    Array.isArray(value) && value.every((child) => isJsonObject(child, deep))
  );
}

export function isJsonStringArray(value: unknown): value is JsonArray<string> {
  return Array.isArray(value) && value.every((child) => isJsonString(child));
}

export function isJsonNumberArray(value: unknown): value is JsonArray<number> {
  return Array.isArray(value) && value.every((child) => isJsonNumber(child));
}

export function assertObject(
  value: any,
  name?: string
): asserts value is JsonObject {
  if (isJsonObject(value)) return;
  throwUnexpectedError("JsonObject", typeof value, name);
}

export function assertString(
  value: any,
  name?: string
): asserts value is string {
  if (typeof value === "string") return;
  throwUnexpectedError("string", typeof value, name);
}

export function assertNumber(
  value: any,
  name?: string
): asserts value is number {
  if (typeof value === "number") return;
  throwUnexpectedError("number", typeof value, name);
}

export function assertArray(
  value: any,
  name?: string
): asserts value is Array<any> {
  if (Array.isArray(value)) return;
  throwUnexpectedError("Array", typeof value, name);
}

function throwUnexpectedError(
  expectedType: string,
  actualType: string,
  name?: string
) {
  const nameToBe = name ? ` ${name} to be` : "";
  throw new Error(`Expected${nameToBe} ${expectedType}, got ${actualType}`);
}
