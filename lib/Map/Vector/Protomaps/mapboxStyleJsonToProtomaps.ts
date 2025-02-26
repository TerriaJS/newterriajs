import {
  CenteredTextSymbolizer,
  CircleSymbolizer,
  Feature,
  Filter,
  LineLabelSymbolizer,
  LineSymbolizer,
  PolygonSymbolizer,
  exp
} from "protomaps-leaflet";
import JsonValue from "../../../Core/Json";
import TerriaError from "../../../Core/TerriaError";

/** This file is adapted from from https://github.com/protomaps/protomaps-leaflet/blob/a08304417ef36fef03679976cd3e5a971fec19a2/src/compat/json_style.ts
 * License: BSD-3-Clause
 * Copyright 2021-2024 Protomaps LLC
 * Full license https://github.com/protomaps/protomaps-leaflet/blob/main/LICENSE
 */

function number(val: JsonValue, defaultValue: number) {
  return typeof val === "number" ? val : defaultValue;
}

export function filterFn(arr: any[]): Filter {
  // hack around "$type"
  if (arr.includes("$type")) {
    return (_) => true;
  }
  if (arr[0] === "==") {
    return (_, f) => f.props[arr[1]] === arr[2];
  }
  if (arr[0] === "!=") {
    return (_, f) => f.props[arr[1]] !== arr[2];
  }
  if (arr[0] === "!") {
    const sub = filterFn(arr[1]);
    return (z, f) => !sub(z, f);
  }
  if (arr[0] === "<") {
    return (_, f) => number(f.props[arr[1]], Infinity) < arr[2];
  }
  if (arr[0] === "<=") {
    return (_, f) => number(f.props[arr[1]], Infinity) <= arr[2];
  }
  if (arr[0] === ">") {
    return (_, f) => number(f.props[arr[1]], -Infinity) > arr[2];
  }
  if (arr[0] === ">=") {
    return (_, f) => number(f.props[arr[1]], -Infinity) >= arr[2];
  }
  if (arr[0] === "in") {
    return (_, f) => arr.slice(2, arr.length).includes(f.props[arr[1]]);
  }
  if (arr[0] === "!in") {
    return (_, f) => !arr.slice(2, arr.length).includes(f.props[arr[1]]);
  }
  if (arr[0] === "has") {
    return (_, f) => arr[1] in f.props;
  }
  if (arr[0] === "!has") {
    return (_, f) => !(arr[1] in f.props);
  }
  if (arr[0] === "all") {
    const parts = arr.slice(1, arr.length).map((e) => filterFn(e));
    return (z, f) =>
      parts.every((p) => {
        return p(z, f);
      });
  }
  if (arr[0] === "any") {
    const parts = arr.slice(1, arr.length).map((e) => filterFn(e));
    return (z, f) =>
      parts.some((p) => {
        return p(z, f);
      });
  }
  console.log("Unimplemented filter: ", arr[0]);
  return (_) => false;
}

export function numberFn(obj: any): (z: number, f?: Feature) => number {
  if (obj.base && obj.stops) {
    return (z: number) => {
      return exp(obj.base, obj.stops)(z - 1);
    };
  }
  if (
    obj[0] === "interpolate" &&
    obj[1][0] === "exponential" &&
    obj[2][0] === "zoom"
  ) {
    const slice = obj.slice(3);
    const stops: number[][] = [];
    for (let i = 0; i < slice.length; i += 2) {
      stops.push([slice[i], slice[i + 1]]);
    }
    return (z: number) => {
      return exp(obj[1][1], stops)(z - 1);
    };
  }
  if (obj[0] === "step" && obj[1][0] === "get") {
    const slice = obj.slice(2);
    const prop = obj[1][1];
    return (_: number, f?: Feature) => {
      const val = f?.props[prop];
      if (typeof val === "number") {
        if (val < slice[1]) return slice[0];
        for (let i = 1; i < slice.length; i += 2) {
          if (val <= slice[i]) return slice[i + 1];
        }
      }
      return slice[slice.length - 1];
    };
  }
  console.log("Unimplemented numeric fn: ", obj);
  return (_) => 1;
}

export function numberOrFn(
  obj: any,
  defaultValue = 0
): number | ((z: number, f?: Feature) => number) {
  if (!obj) return defaultValue;
  if (typeof obj === "number") {
    return obj;
  }
  // If feature f is defined, use numberFn, otherwise use defaultValue
  return (z: number, f?: Feature) => (f ? numberFn(obj)(z, f) : defaultValue);
}

export function widthFn(width_obj: any, gap_obj: any) {
  const w = numberOrFn(width_obj, 1);
  const g = numberOrFn(gap_obj);
  return (z: number, f?: Feature) => {
    const tmp = typeof w === "number" ? w : w(z, f);
    if (g) {
      return tmp + (typeof g === "number" ? g : g(z, f));
    }
    return tmp;
  };
}

interface FontSub {
  face: string;
  weight?: number;
  style?: string;
}

export function getFont(obj: any, fontSubMap: Record<string, FontSub>) {
  const fontFaces: FontSub[] = [];
  for (const wanted_face of obj["text-font"]) {
    if (wanted_face in fontSubMap) {
      fontFaces.push(fontSubMap[wanted_face]);
    }
  }
  if (fontFaces.length === 0) fontFaces.push({ face: "sans-serif" });

  const text_size = obj["text-size"];
  // for fallbacks, use the weight and style of the first font
  let weight = "";
  if (fontFaces.length && fontFaces[0].weight)
    weight = `${fontFaces[0].weight} `;
  let style = "";
  if (fontFaces.length && fontFaces[0].style) style = `${fontFaces[0].style} `;

  if (typeof text_size === "number") {
    return (_: number) =>
      `${style}${weight}${text_size}px ${fontFaces
        .map((f) => f.face)
        .join(", ")}`;
  }
  if (text_size.stops) {
    let base = 1.4;
    if (text_size.base) base = text_size.base;
    else text_size.base = base;
    const t = numberFn(text_size);
    return (z: number, f?: Feature) => {
      return `${style}${weight}${t(z, f)}px ${fontFaces
        .map((f) => f.face)
        .join(", ")}`;
    };
  }
  if (text_size[0] === "step") {
    const t = numberFn(text_size);
    return (z: number, f?: Feature) => {
      return `${style}${weight}${t(z, f)}px ${fontFaces
        .map((f) => f.face)
        .join(", ")}`;
    };
  }
  console.log("Can't parse font: ", obj);
  return (_: number) => "12px sans-serif";
}

/** Convert mapbox style json to Protomaps paint and label rules.
 * This supports a very small subset of mapbox style spec:
 */
export function mapboxStyleJsonToProtomaps(
  obj: any,
  fontSubMap: Record<string, FontSub>
) {
  if (!obj || !obj.layers) return undefined;

  const paintRules = [];
  const labelRules = [];
  const refs = new Map<string, any>();
  try {
    for (const layer of obj.layers) {
      refs.set(layer.id, layer);

      if (layer.layout && layer.layout.visibility === "none") {
        continue;
      }

      if (layer.ref) {
        const referenced = refs.get(layer.ref);
        layer.type = referenced.type;
        layer.filter = referenced.filter;
        layer.source = referenced.source;
        layer["source-layer"] = referenced["source-layer"];
      }

      let filter = undefined;
      if (layer.filter) {
        filter = filterFn(layer.filter);
      }

      // ignore background-color?
      if (layer.type === "fill") {
        paintRules.push({
          dataLayer: layer["source-layer"],
          filter: filter,
          symbolizer: new PolygonSymbolizer({
            fill: layer.paint["fill-color"],
            opacity: layer.paint["fill-opacity"]
          })
        });
      } else if (layer.type === "fill-extrusion") {
        // simulate fill-extrusion with plain fill
        paintRules.push({
          dataLayer: layer["source-layer"],
          filter: filter,
          symbolizer: new PolygonSymbolizer({
            fill: layer.paint["fill-extrusion-color"],
            opacity: layer.paint["fill-extrusion-opacity"]
          })
        });
      } else if (layer.type === "line") {
        // simulate gap-width
        if (layer.paint["line-dasharray"]) {
          paintRules.push({
            dataLayer: layer["source-layer"],
            filter: filter,
            symbolizer: new LineSymbolizer({
              width: widthFn(
                layer.paint["line-width"],
                layer.paint["line-gap-width"]
              ),
              dash: layer.paint["line-dasharray"],
              dashColor: layer.paint["line-color"]
            })
          });
        } else {
          paintRules.push({
            dataLayer: layer["source-layer"],
            filter: filter,
            symbolizer: new LineSymbolizer({
              color: layer.paint["line-color"],
              width: widthFn(
                layer.paint["line-width"],
                layer.paint["line-gap-width"]
              )
            })
          });
        }
      } else if (layer.type === "symbol") {
        if (layer.layout["symbol-placement"] === "line") {
          labelRules.push({
            dataLayer: layer["source-layer"],
            filter: filter,
            symbolizer: new LineLabelSymbolizer({
              font: getFont(layer.layout, fontSubMap),
              fill: layer.paint["text-color"],
              width: layer.paint["text-halo-width"],
              stroke: layer.paint["text-halo-color"],
              textTransform: layer.layout["text-transform"],
              labelProps: layer.layout["text-field"]
                ? [layer.layout["text-field"]]
                : undefined
            })
          });
        } else {
          labelRules.push({
            dataLayer: layer["source-layer"],
            filter: filter,
            symbolizer: new CenteredTextSymbolizer({
              font: getFont(layer.layout, fontSubMap),
              fill: layer.paint["text-color"],
              stroke: layer.paint["text-halo-color"],
              width: layer.paint["text-halo-width"],
              textTransform: layer.layout["text-transform"],
              labelProps: layer.layout["text-field"]
                ? [layer.layout["text-field"]]
                : undefined
            })
          });
        }
      } else if (layer.type === "circle") {
        paintRules.push({
          dataLayer: layer["source-layer"],
          filter: filter,
          symbolizer: new CircleSymbolizer({
            radius: layer.paint["circle-radius"],
            fill: layer.paint["circle-color"],
            stroke: layer.paint["circle-stroke-color"],
            width: layer.paint["circle-stroke-width"]
          })
        });
      }
    }

    labelRules.reverse();
  } catch (e) {
    TerriaError.from(e, "Error parsing mapbox style").log();
  }
  return { paintRules, labelRules, tasks: [] };
}
