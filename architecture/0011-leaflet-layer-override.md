# 11. Leaflet Layer Override

Date: 2023-06-26

## Status

Proposed

## Context

In order to support Cloud Optimised Geotiffs, we have encountered a situation where a Cesium Imagery Provider cannot provide imagery for both the Cesium viewer and the Leaflet viewer. We succesfully implemented display of COGs on the Cesium canvas with a library [TIFFImageryProvider](https://github.com/hongfaqiu/TIFFImageryProvider). However, this cannot be efficiently adapted to provide tiles for the Leaflet viewer. This is because Cesium is flexible with tiling schemes, but Leaflet is not.

## Decision

All mappable items now have an optional property to override the Imagery Provider when creating a Leaflet layer. This is currently `ImageryParts.overrideCreateLeafletLayer` and should return a `TerriaLeafletLayer` - a Leaflet layer with the required Terria enhancements such as Splitter support, Feature Picking support etc.

When this property is specified, the Imagery Provider for the map item will still be set up when adding an item, and used in 3D mode to draw to the canvas. But the new ovveride function can specify a different way to draw to the Leaflet canvas. In the case of Cloud Optimised Geotiff catalog items, the overide function says that we should use the [Georaster Layer for Leaflet](https://github.com/GeoTIFF/georaster-layer-for-leaflet) library to create a Leaflet layer.

## Consequences

- This is less efficient than using the Imaery Provider to make requests for both 2D and 3D mode. In some situations, data will be re-requested if a user is switching between modes.
- It is also more difficult for code maintenance, as functionality like Feature Picking must be implemented twice.
