# TerriaJS

[![Build Status](https://github.com/TerriaJS/terriajs/actions/workflows/ci.yml/badge.svg?branch=main&event=push)](https://github.com/TerriaJS/terriajs/actions/workflows/ci.yml)
[![NPM Version](https://img.shields.io/npm/v/terriajs)](https://www.npmjs.com/package/terriajs)
[![Docs](https://img.shields.io/badge/docs-online-blue.svg)](https://docs.terria.io/)

![Terria logo](terria-logo.png "Terria logo")

TerriaJS is a library for building rich, web-based geospatial data explorers, used to drive [National Map](https://nationalmap.gov.au), [Digital Earth Australia Map](https://maps.dea.ga.gov.au/), [NSW Spatial Digital Twin](https://nsw.digitaltwin.terria.io/) and [NEII Viewer](https://neii.gov.au/viewer/) (and many others). It uses [Cesium](https://cesiumjs.org) and WebGL for a full 3D globe in the browser with no plugins. It gracefully falls back to 2D with [Leaflet](https://leafletjs.com/) on systems that can't run Cesium. It can handle catalogs of tens of thousands of layers, with dozens of geospatial file and web service types supported. It is almost entirely JavaScript in the browser, meaning it can even be deployed as a static website, making it simple and cheap to host.

---

**We have just released a brand new version of Terria &mdash; verson 8!**

We've put together a list of things we've removed from version 8 and some steps to help you migrate to the new version in our [migration guide](https://docs.terria.io/guide/contributing/migration-guide/)

**Not ready to move to version 8 yet? You can find terriajs version 7 here:** https://github.com/TerriaJS/terriajs/tree/terriajs7

---

### Features

- Nested catalog of layers which can be independently enabled to create mashups of many layers.
- Supports GeoJSON, KML, CSV (point and region-mapped), GPX, GeoRSS, CZML and zipped shapefile file types natively.
- Supports WMS, WFS, WMTS, Esri MapServer, Esri FeatureServer, Bing Maps, Carto Maps, Cesium Ion Imagery, OpenStreetMap-style raster tiles, Mapbox, SDMX, 3D Tiles and GTFS and Sensor Observation Service item types.
- Supports querying WMS, WFS, Esri MapServer, CSW, CKAN, Socrata, OpenDataSoft and SDMX services for groups of items.
- 3D globe (Cesium) or 2D mode (Leaflet). 3D objects supported in CZML format.
- Time dimensions supported for CSV, CZML, WMS. Automatically animate layers, or slide the time control forward and backward.
- Drag-and-drop files from your desktop to the browser, for instant visualisation (no file upload to server required).
- All ASGS (Australian Statistical Geographic Standard) region types (LGA, SA2, commonwealth electoral district etc) supported for [CSV region mapping](https://github.com/TerriaJS/nationalmap/wiki/csv-geo-au), plus several others: Primary Health Networks, Statistical Local Areas, ISO 3 letter country codes, etc.
- Users can generate a reusable URL link of their current map view, to quickly share mashups of web-hosted data.
- The interface is internationalised and translations are available for French, Italian and Japanese. Partial translations have also been contributed for other languages (see [TerriaJS weblate](https://hosted.weblate.org/engage/terriajs/))

![Terria screenshot](terria-screenshot.png "Terria screenshot")

### Who's using TerriaJS?

#### Sites developed by Data61

- [National Map](https://nationalmap.gov.au)
- [NSW Spatial Digital Twin](https://nsw.digitaltwin.terria.io)
- [Digital Earth Australia Map](https://maps.dea.ga.gov.au)
- [Digital Earth Africa Map](https://maps.digitalearth.africa)
- [NEII Viewer](https://neii.org.au/viewer)
- [GeoGLAM Rangeland and Pasture Productivity](https://map.geo-rapp.org/)

#### Not Data61

Sites we're aware of that are using TerriaJS. These are not endorsements or testimonials.

- [AURIN Map](http://map.aurin.org.au/)
- [Portale del suolo](http://www.sardegnaportalesuolo.it/webgis/)
- [Find & Connect Map of Children's Homes](https://map.findandconnect.gov.au/)
- [GeoPlatform Mapping](https://terriamap.geoplatform.gov/)

### Technical

- NodeJS v20 and later are supported
- Built in TypeScript & ES2020+ JavaScript, compiled with Babel to ES5.
- Supports modern browsers (recent versions of Microsoft Edge, Mozilla Firefox & Google Chrome).
- [TerriaJS Server component](https://github.com/TerriajS/TerriaJS-Server) runs in NodeJS and provides proxying for web services that don't support CORS or require authentication. Instead of using TerriaJS-Sever proxy service, an alternative proxying service URL can be specified. See [Specify an alternative proxy server URL](/doc/connecting-to-data/cross-origin-resource-sharing.md)
- Dependencies are [managed in NPM](https://www.npmjs.com/~terria) and assembled using WebPack.

### Getting Started

The easiest way to build your own Terria-based map is using the TerriaMap starting point. This gives you the HTML structure, server and build processes you need to get a site up and running immediately.

See [Getting Started](https://docs.terria.io/guide/getting-started/) in the [Documentation](https://docs.terria.io/guide/) for all the details.

### Components and naming

- **[Terria™](http://terria.io)** is the overall name for the spatial data platform and the team that built TerriaJS.
- **TerriaJS** is this TypeScript/JavaScript library consisting of the 2D/3D map, catalog management and many spatial data connectors.
- **[Cesium](https://github.com/TerriaJS/Cesium)** is the 3D WebGL rendering library used by TerriaJS, which provides many low-level functions for loading and displaying imagery and spatial formats such as GeoJSON and KML.
- **[TerriaMap](https://github.com/TerriaJS/TerriaMap)** is a complete website starting point, using TerriaJS.
- **[TerriaJS-Server](https://github.com/TerriaJS/TerriaJS-Server)** is a NodeJS-based server that provides proxying and support services for TerriaJS.
- **[NationalMap](https://github.com/NICTA/NationalMap)** is the flagship Terria deployment, and the origin of the TerriaJS library.

#### Related components

- **[TerriaMapStatic](https://github.com/terriajs/terriamap-static)**, a pre-built version of TerriaMap, which can be deployed as a static HTML website, such as on Github Pages.

### Big Thanks

Hosting and contribution framework for community translations of TerriaJS provided by [Weblate](https://weblate.org/en/) under the Libre plan for open source software. See our translation progress for different languages:

<a href="https://hosted.weblate.org/engage/terriajs/">
<img src="https://hosted.weblate.org/widgets/terriajs/-/terriajsnext/multi-auto.svg" alt="Translation status" />
</a>

### Join the community

Get in touch!

- Join the [Github Discussion](https://github.com/TerriaJS/terriajs/discussions)
- Raise issues in the [Github issue tracker](https://github.com/TerriaJS/terriajs/issues/new)
