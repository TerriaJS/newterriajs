import { SingleBandRenderOptions } from "../TIFFImageryProvider";
import { colorscales } from "./colorscales";

export type TypedArray =
  | Uint8Array
  | Int8Array
  | Uint16Array
  | Int16Array
  | Uint32Array
  | Int32Array
  | Float32Array
  | Float64Array;

export interface DataSet {
  textureData: WebGLTexture;
  width: number;
  height: number;
  data: TypedArray;
  id: string;
}

export type RenderColorType = "continuous" | "discrete";

export type ColorScaleNames = keyof typeof colorscales;

export type PlotOptions = {
  /**
   * The canvas to render to.
   */
  canvas?: HTMLCanvasElement | OffscreenCanvas;

  /**
   * The raster data to render.
   */
  data?: TypedArray;

  /**
   * The width of the input raster.
   */
  width?: number;

  /**
   * The height of the input raster.
   */
  height?: number;

  /**
   * A list of named datasets. Each must have 'id', 'data', 'width' and 'height'.
   */
  datasets?: {
    id: string;
    data: TypedArray;
    width: number;
    height: number;
  }[];

  /**
   * The no-data value that shall always be hidden.
   */
  noDataValue?: number;

  /**
   * Transformation matrix.
   */
  matrix?: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number
  ];

  /**
   * Plotty can also function with pure javascript but it is much slower then using WebGL rendering.
   */
  useWebGL?: boolean;
} & SingleBandRenderOptions;
