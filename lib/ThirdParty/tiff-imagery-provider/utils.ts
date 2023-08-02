// @ts-nocheck

export function getMinMax(data: number[], nodata: number) {
  let min: number, max: number;
  for (let j = 0; j < data.length; j += 1) {
    const val = data[j];
    if (val === nodata) continue;
    if (min === undefined && max === undefined) {
      min = max = val;
      continue;
    }
    if (val < min) {
      min = val;
    } else if (val > max) {
      max = val;
    }
  }
  return {
    min,
    max
  };
}

export function decimal2rgb(number: number) {
  return Math.round(number * 255);
}

export function getRange(
  bands: Record<
    number,
    {
      min: number;
      max: number;
    }
  >,
  opts:
    | {
        min?: number;
        max?: number;
        band: number;
      }
    | undefined
) {
  const band = bands[opts.band];
  if (!band) {
    throw new Error(`Invalid band${opts.band}`);
  }
  const min = opts?.min ?? +band.min;
  const max = opts?.max ?? +band.max;
  const range = max - min;
  return { min, max, range };
}

export function generateColorScale(colors: [number, string][] | string[]) {
  let stops: [number, string][];

  if (typeof colors[0] === "string") {
    stops = (colors as string[]).map((color, index) => [
      index / colors.length,
      color
    ]);
  } else {
    stops = colors as [number, string][];
  }

  stops.sort((a, b) => a[0] - b[0]);

  if (stops[0][0] > 0) {
    stops = [stops[0], ...stops];
  }

  if (stops[stops.length - 1][0] > 0) {
    stops = [...stops, stops[stops.length - 1]];
  }

  const colorScale = {
    colors: stops.map((stop) => stop[1]),
    positions: stops.map((stop) => stop[0])
  };

  return colorScale;
}

export function findAndSortBandNumbers(str: string) {
  const regex = /b(\d+)/g;
  const bandNumbers = new Set<number>();
  let match: string[];
  while ((match = regex.exec(str)) !== null) {
    bandNumbers.add(parseInt(match[1]) - 1);
  }
  return Array.from(bandNumbers).sort((a, b) => a - b);
}
