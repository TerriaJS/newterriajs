import Color from "terriajs-cesium/Source/Core/Color";
import isDefined from "../../../Core/isDefined";
import { OutlineSymbolTraits } from "../../../Traits/TraitsClasses/Table/OutlineStyleTraits";
import TablePointSizeStyleTraits from "../../../Traits/TraitsClasses/Table/PointSizeStyleTraits";
import { PointSymbolTraits } from "../../../Traits/TraitsClasses/Table/PointStyleTraits";
import createStratumInstance from "../../Definition/createStratumInstance";
import {
  EsriStyle,
  SupportedEsriSimpleMarkerStyle,
  SupportedLineStyle
} from "./ArcGisFeatureServerStratum";

export function esriStyleToTableStyle(
  esriStyle?: EsriStyle | null,
  label?: string | undefined
) {
  if (!esriStyle) return {};

  return {
    // For esriPMS - just use white color
    // This is so marker icons aren't colored by default
    color:
      esriStyle.type === "esriPMS"
        ? "#FFFFFF"
        : convertEsriColorToCesiumColor(esriStyle.color)?.toCssColorString(),
    pointSize: createStratumInstance(TablePointSizeStyleTraits, {}),
    point: createStratumInstance(PointSymbolTraits, {
      marker:
        esriStyle.type === "esriPMS"
          ? `data:${esriStyle.contentType};base64,${esriStyle.imageData}`
          : convertEsriMarkerToMaki(esriStyle.style),
      // symbol.size is used by "esriSMS"
      // height and width is used by "esriPMS"
      height:
        convertEsriPointSizeToPixels(esriStyle.size) ??
        convertEsriPointSizeToPixels(esriStyle.height),
      width:
        convertEsriPointSizeToPixels(esriStyle.size) ??
        convertEsriPointSizeToPixels(esriStyle.width),
      rotation: esriStyle.angle,
      pixelOffset: [esriStyle.xoffset ?? 0, esriStyle.yoffset ?? 0],
      legendTitle: label || undefined
    }),
    outline:
      esriStyle.outline?.style !== "esriSLSNull"
        ? createStratumInstance(OutlineSymbolTraits, {
            color:
              esriStyle.type === "esriSLS"
                ? convertEsriColorToCesiumColor(
                    esriStyle.color
                  )?.toCssColorString()
                : convertEsriColorToCesiumColor(
                    esriStyle.outline?.color
                  )?.toCssColorString(),
            // Use width if Line style
            width:
              esriStyle.type === "esriSLS"
                ? convertEsriPointSizeToPixels(esriStyle.width)
                : convertEsriPointSizeToPixels(esriStyle.outline?.width),
            legendTitle: label || undefined,
            dash:
              esriStyle.type === "esriSLS"
                ? convertEsriLineStyleToDashArray(esriStyle.style)
                : convertEsriLineStyleToDashArray(esriStyle.outline?.style)
          })
        : undefined
  };
}

function convertEsriMarkerToMaki(
  esri: SupportedEsriSimpleMarkerStyle | string | undefined
): string {
  switch (esri) {
    case "esriSMSCross":
      return "hospital";
    case "esriSMSDiamond":
      return "diamond";
    case "esriSMSSquare":
      return "square";
    case "esriSMSTriangle":
      return "triangle";
    case "esriSMSX":
      return "cross";
    case "esriSMSCircle":
    default:
      return "point";
  }
}

// ESRI uses points for styling while cesium uses pixels
export function convertEsriPointSizeToPixels(pointSize?: number) {
  if (!isDefined(pointSize)) return undefined;
  // 1 px = 0.75 point
  // 1 point = 4/3 point
  return (pointSize * 4) / 3;
}

function convertEsriColorToCesiumColor(
  esriColor?: null | number[] | undefined
): Color | undefined {
  if (!esriColor) return;
  return Color.fromBytes(
    esriColor[0],
    esriColor[1],
    esriColor[2],
    esriColor[3]
  );
}

const defaultDashArray = [4, 3];

const esriLineStyleCesium: Record<SupportedLineStyle, number> = {
  esriSLSNull: 0,
  esriSLSSolid: 255,
  esriSLSDash: 3087, //"   ----" parseInt("110000001111", 2)
  esriSLSDot: 7, //"   -"
  esriSLSDashDot: 2017, //"   ----   -"
  esriSLSDashDotDot: 16273, // '  --------   -   - '
  esriSLSLongDash: 2047, // '   --------'
  esriSLSLongDashDot: 4081, // '   --------   -'
  esriSLSShortDash: 4095, //' ----'
  esriSLSShortDot: 13107, //' ---- -'
  esriSLSShortDashDot: 8179, //' ---- - -'
  esriSLSShortDashDotDot: 16281 //' - - - -'
};

const cesiumDashNumberToDashArray: {
  [key: number]: number[];
} = {
  0: [],
  255: [],
  3087: [6, 6],
  7: [1, 3],
  2017: [4, 3, 1, 3],
  16273: [8, 3, 1, 3, 1, 3],
  2047: [8, 3],
  4081: [8, 3, 1, 3],
  4095: [4, 1],
  13107: [1, 1],
  8179: [4, 1, 1, 1],
  16281: [4, 1, 1, 1, 1, 1]
};

export function convertCesiumDashNumberToDashArray(
  dashPattern: number
): number[] {
  if (cesiumDashNumberToDashArray[dashPattern]) {
    return cesiumDashNumberToDashArray[dashPattern];
  }
  return defaultDashArray;
}

export function convertEsriLineStyleToCesiumDashNumber(styleName: string) {
  if (styleName in esriLineStyleCesium) {
    return esriLineStyleCesium[styleName as SupportedLineStyle];
  }
  return undefined;
}

function convertEsriLineStyleToDashArray(styleName: string | undefined) {
  if (styleName) {
    const dashNumber = convertEsriLineStyleToCesiumDashNumber(styleName);
    if (dashNumber !== undefined) {
      return convertCesiumDashNumberToDashArray(dashNumber);
    }
  }

  return [];
}
