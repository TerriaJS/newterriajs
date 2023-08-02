declare module "geoblaze" {
  export function identify(
    raster: string | HTMLImageElement | ImageData,
    lngLat: [number, number]
  ): number[];
  // Add any additional functions or types you need from the geoblaze module here
}
