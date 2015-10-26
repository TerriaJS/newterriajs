'use strict';

/*global require*/
var proj4 = require('proj4');
var Cartesian2 = require('terriajs-cesium/Source/Core/Cartesian2');
var Cartographic = require('terriajs-cesium/Source/Core/Cartographic');
var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var CesiumTerrainProvider = require('terriajs-cesium/Source/Core/CesiumTerrainProvider');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var Intersections2D = require('terriajs-cesium/Source/Core/Intersections2D');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var EarthGravityModel1996 = require('../Map/EarthGravityModel1996');
var loadView = require('../Core/loadView');

var LocationBarViewModel = function(options) {
    if (!defined(options) || !defined(options.terria)) {
        throw new DeveloperError('options.terria is required.');
    }
    if (!defined(options.mapElement)) {
        throw new DeveloperError('options.mapElement is required.');
    }

    this.terria = options.terria;
    this.mapElement = options.mapElement;
    this.geoidModel = defaultValue(options.geoidModel, new EarthGravityModel1996(this.terria.baseUrl + 'data/WW15MGH.DAC'));
    this.useProjection = defaultValue(options.useProjection, false);

    this.latitude = '43.199°S';
    this.longitude = '154.461°E';
    this.elevation = '28m';
    this.utmZone = '56';
    this.northing = '5216050.13';
    this.easting = '618699.50';
    this.proj4longlat = '+proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees +no_defs';
    this.proj4utm = '+proj=utm +ellps=GRS80 +units=m +no_defs';

    knockout.track(this, ['latitude', 'longitude', 'elevation', 'useProjection', 'northing', 'easting', 'utmZone']);

    var that = this;
    this.mapElement.addEventListener('mousemove', function(e) {
        var rect = that.mapElement.getBoundingClientRect();
        var position = new Cartesian2(e.clientX - rect.left, e.clientY - rect.top);

        if (defined( that.terria.cesium)) {
            updateCoordinatesFromCesium(that, position);
        } else if (defined( that.terria.leaflet)) {
            updateCoordinatesFromLeaflet(that, position);
        }
    }, false);
};

LocationBarViewModel.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/LocationBar.html', 'utf8'), container, this);
};

LocationBarViewModel.prototype.toggleProjection = function() {
    this.useProjection = !this.useProjection;
};

LocationBarViewModel.create = function(options) {
    var result = new LocationBarViewModel(options);
    result.show(options.container);
    return result;
};

function updateCoordinatesFromCesium(viewModel, position) {
    var scene = viewModel.terria.cesium.scene;

    var camera = scene.camera;
    var pickRay = camera.getPickRay(position);

    var globe = scene.globe;
    var pickedTriangle = globe.pickTriangle(pickRay, scene);
    if (defined(pickedTriangle)) {
        // Get a fast, accurate-ish height every time the mouse moves.
        var ellipsoid = globe.ellipsoid;

        var v0 = ellipsoid.cartesianToCartographic(pickedTriangle.v0);
        var v1 = ellipsoid.cartesianToCartographic(pickedTriangle.v1);
        var v2 = ellipsoid.cartesianToCartographic(pickedTriangle.v2);
        var intersection = ellipsoid.cartesianToCartographic(pickedTriangle.intersection);

        var barycentric = Intersections2D.computeBarycentricCoordinates(
            intersection.longitude, intersection.latitude,
            v0.longitude, v0.latitude,
            v1.longitude, v1.latitude,
            v2.longitude, v2.latitude);

        if (barycentric.x >= -1e-15 && barycentric.y >= -1e-15 && barycentric.z >= -1e-15) {
            var height = barycentric.x * v0.height +
                         barycentric.y * v1.height +
                         barycentric.z * v2.height;
            intersection.height = height;
        }

        var geometricError = globe.terrainProvider.getLevelMaximumGeometricError(pickedTriangle.tile.level);
        var approximateHeight = intersection.height;
        var minHeight = Math.max(pickedTriangle.tile.data.minimumHeight, approximateHeight - geometricError);
        var maxHeight = Math.min(pickedTriangle.tile.data.maximumHeight, approximateHeight + geometricError);
        var minHeightGeoid = minHeight - (viewModel.geoidModel ? viewModel.geoidModel.minimumHeight : 0.0);
        var maxHeightGeoid = maxHeight + (viewModel.geoidModel ? viewModel.geoidModel.maximumHeight : 0.0);
        var errorBar = Math.max(Math.abs(approximateHeight - minHeightGeoid), Math.abs(maxHeightGeoid - approximateHeight));

        cartographicToFields(viewModel, intersection, errorBar);

        debounceSampleAccurateHeight(viewModel, globe, intersection);
    } else {
        viewModel.latitude = undefined;
        viewModel.longitude = undefined;
        viewModel.elevation = undefined;
        viewModel.utmZone = undefined;
        viewModel.easting = undefined;
        viewModel.northing = undefined;
    }
}

function updateCoordinatesFromLeaflet(viewModel, position) {
    // TODO: correctly calculate these for Leaflet.
    viewModel.latitude = undefined;
    viewModel.longitude = undefined;
    viewModel.elevation = undefined;
    viewModel.utmZone = undefined;
    viewModel.easting = undefined;
    viewModel.northing = undefined;
}

function cartographicToFields(viewModel, coordinates, errorBar) {
    var lat = CesiumMath.toDegrees(coordinates.latitude);
    var lon = CesiumMath.toDegrees(coordinates.longitude);

    var zone = 1 + Math.floor((lon+180)/6);
    var thisproj4utm = viewModel.proj4utm + ' +zone=' + zone + (lat < 0 ? ' +south' : '');
    var utmPoint = proj4((viewModel.proj4longlat), (thisproj4utm), [lon, lat]);
    viewModel.northing = utmPoint[1].toFixed(2) + 'm';
    viewModel.easting = utmPoint[0].toFixed(2) + 'm';
    viewModel.utmZone = zone;

    viewModel.latitude = Math.abs(lat).toFixed(3) + '°' + (lat < 0.0 ? 'S' : 'N');
    viewModel.longitude = Math.abs(lon).toFixed(3) + '°' + (lon < 0.0 ? 'W' : 'E');

    viewModel.elevation = Math.round(coordinates.height) + (defined(errorBar) ? '±' + Math.round(errorBar) : '') + 'm';
}

var lastHeightSamplePosition = new Cartographic();
var accurateHeightTimer;
var tileRequestInFlight;
var accurateSamplingDebounceTime = 250;

function debounceSampleAccurateHeight(viewModel, globe, position) {
    // After a delay with no mouse movement, get a more accurate height.
    Cartographic.clone(position, lastHeightSamplePosition);

    var terrainProvider = globe.terrainProvider;
    if (terrainProvider instanceof CesiumTerrainProvider) {
        clearTimeout(accurateHeightTimer);
        accurateHeightTimer = setTimeout(function() {
            sampleAccurateHeight(viewModel, terrainProvider, position);
        }, accurateSamplingDebounceTime);
    }
}

function sampleAccurateHeight(viewModel, terrainProvider, position) {
    accurateHeightTimer = undefined;
    if (tileRequestInFlight) {
        // A tile request is already in flight, so reschedule for later.
        accurateHeightTimer = setTimeout(function() {
            sampleAccurateHeight(viewModel, terrainProvider, position);
        }, accurateSamplingDebounceTime);
        return;
    }

    // Find the most detailed available tile at the last mouse position.
    var tilingScheme = terrainProvider.tilingScheme;
    var tiles = terrainProvider._availableTiles;
    var foundTileID;
    var foundLevel;

    for (var level = tiles.length - 1; !foundTileID && level >= 0; --level) {
        var levelTiles = tiles[level];
        var tileID = tilingScheme.positionToTileXY(position, level);
        var yTiles = tilingScheme.getNumberOfYTilesAtLevel(level);
        var tmsY = yTiles - tileID.y - 1;

        // Is this tile ID available from the terrain provider?
        for (var i = 0, len = levelTiles.length; !foundTileID && i < len; ++i) {
            var range = levelTiles[i];
            if (tileID.x >= range.startX && tileID.x <= range.endX && tmsY >= range.startY && tmsY <= range.endY) {
                foundLevel = level;
                foundTileID = tileID;
            }
        }
    }

    if (foundTileID) {
        // This tile has our most accurate available height, so go get it.
        var geoidHeightPromise = viewModel.geoidModel ? viewModel.geoidModel.getHeight(position.longitude, position.latitude) : undefined;
        var terrainPromise = terrainProvider.requestTileGeometry(foundTileID.x, foundTileID.y, foundLevel, false);
        tileRequestInFlight = when.all([geoidHeightPromise, terrainPromise], function(result) {
            var geoidHeight = result[0] || 0.0;
            var terrainData = result[1];
            tileRequestInFlight = undefined;
            if (Cartographic.equals(position, lastHeightSamplePosition)) {
                position.height = terrainData.interpolateHeight(tilingScheme.tileXYToRectangle(foundTileID.x, foundTileID.y, foundLevel), position.longitude, position.latitude) - geoidHeight;
                cartographicToFields(viewModel, position);
            } else {
                // Mouse moved since we started this request, so the result isn't useful.  Try again next time.
            }
        }, function() {
            tileRequestInFlight = undefined;
        });
    }
}

module.exports = LocationBarViewModel;
