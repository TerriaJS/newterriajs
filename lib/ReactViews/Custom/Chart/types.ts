import type { scaleLinear, scaleTime } from "@visx/scale";

export type XScale =
  | ReturnType<typeof scaleLinear<number>>
  | ReturnType<typeof scaleTime<number>>;
export type YScale = ReturnType<typeof scaleLinear<number>>;

export interface Scales {
  x: XScale;
  y: YScale;
}

export type ChartZoomFunction = (scales: {
  x: (arg0: number | Date) => number;
  y: (arg0: number) => number;
}) => void;

export interface ChartZoomHandle {
  doZoom: ChartZoomFunction;
}
