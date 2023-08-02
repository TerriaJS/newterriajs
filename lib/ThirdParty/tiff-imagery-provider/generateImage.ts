import { getRange, decimal2rgb } from "./utils";
import { MultiBandRenderOptions } from "./TIFFImageryProvider";

export type GenerateImageOptions = {
  width: number;
  height: number;
  renderOptions?: MultiBandRenderOptions;
  bands: Record<
    number,
    {
      min: number;
      max: number;
    }
  >;
  noData?: number;
};

export async function generateImage(
  data: Float32Array[],
  opts: GenerateImageOptions
) {
  const { width, height, renderOptions, bands, noData } = opts;
  const imageData = new Uint8ClampedArray(width * height * 4);

  function ifNoDataFunc(...vals: number[]) {
    for (let i = 0; i < vals.length; i++) {
      const val = vals[i];
      if (isNaN(val) || val === noData) {
        return true;
      }
    }
    return false;
  }

  const { r, g, b } = renderOptions ?? {};
  const ranges = [r, g, b].map((item) => getRange(bands, item));

  const redData = data[0];
  const greenData = data[1];
  const blueData = data[2];

  for (let i = 0; i < data[0].length; i++) {
    const red = redData[i];
    const green = greenData[i];
    const blue = blueData[i];
    imageData[i * 4] = decimal2rgb((red - ranges[0].min) / ranges[0].range);
    imageData[i * 4 + 1] = decimal2rgb(
      (green - ranges[1].min) / ranges[1].range
    );
    imageData[i * 4 + 2] = decimal2rgb(
      (blue - ranges[2].min) / ranges[2].range
    );
    imageData[i * 4 + 3] = ifNoDataFunc(red, green, blue) ? 0 : 255;
  }

  const result = new ImageData(imageData, width, height);

  return result;
}
