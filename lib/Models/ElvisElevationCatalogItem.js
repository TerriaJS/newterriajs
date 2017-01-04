'use strict';

/*global require*/
var CatalogItem = require('./CatalogItem');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var GeoJsonCatalogItem = require('./GeoJsonCatalogItem');
var inherit = require('../Core/inherit');
var ShortReportSection = require('./ShortReportSection');
var Mustache = require('mustache');
var inputsTableTemplate = require('./ElvisElevationInputsTableTemplate.xml');
var outputsTableTemplate = require('./ElvisElevationOutputsTableTemplate.xml');

/**
 * A catalog item representing the result of invoking the elevation function.
 *
 * @alias ElvisElevationCatalogItem
 * @constructor
 * @extends CatalogItem
 *
 * @param {Terria} terria The Terria instance.
 */
function ElvisElevationCatalogItem(terria) {
    this._geoJsonItem = undefined;

    /**
     * Gets or sets the parameters to the WPS function.
     * All parameter names must be entered in lowercase in order to be consistent with references in TerrisJS code.
     * @type {FunctionParameter[]}
     */
    this.parameters = undefined;

    /**
     * Gets or sets the result of calling the elevation function for elevation.
     * @type {Object}
     */
    this.elevationResult = undefined;

    /**
     * Gets or sets the result of calling the elevation function for water table.
     * @type {Object}
     */
    this.waterResult = undefined;

    /**
     * Name of chart to create
     * @type {Object}
     */
    this.chartName = undefined;

    CatalogItem.call(this, terria);
}

inherit(CatalogItem, ElvisElevationCatalogItem);

defineProperties(ElvisElevationCatalogItem.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf ElvisElevationCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'elevation-result';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Elevation Result'.
     * @memberOf ElvisElevationCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Elevation Result';
        }
    },

    /**
     * Gets the data source associated with this catalog item.
     * @memberOf ElvisElevationCatalogItem.prototype
     * @type {DataSource}
     */
    dataSource : {
        get : function() {
            return defined(this._geoJsonItem) ? this._geoJsonItem.dataSource : undefined;
        }
    }
});

ElvisElevationCatalogItem.prototype._load = function() {
    if (defined(this._geoJsonItem)) {
        this._geoJsonItem._hide();
        this._geoJsonItem._disable();
        this._geoJsonItem = undefined;
    }

    if (!defined(this.elevationResult)) {
        return;
    }

    var distance = this.parameters[0].getLineDistance();
    var distanceVsElevationCsv = resultToDistanceVsElevationCsv(this.elevationResult, this.waterResult, distance);
    var chartOptions = ' title="' + this.chartName + '" column-units="Distance (m), Meters, Meters" ';

    var content = '<collapsible open="true">';
    content += '<chart key=\'elevationchart\' data=\'' + distanceVsElevationCsv + '\' styling="histogram"' + chartOptions + '></chart>';
    content += '</collapsible>';

    this.shortReportSections.push(new ShortReportSection({
        content: content
    }));

    var inputsSection = Mustache.render(inputsTableTemplate, {lineString: this.parameters[0].formatValueAsString(),
                                                              count: 500,
                                                              distance: this.parameters[0].getLineDistance()});
    var outputsSection = Mustache.render(outputsTableTemplate, {distanceVsElevationCsv: distanceVsElevationCsv,
                                                                chartOptions: chartOptions});

    var section = this.findInfoSection('Inputs');
    if (!defined(section)) {
        this.info.push({
            name: 'Inputs',
            content: inputsSection
        });
    }

    if (!defined(this.featureInfoTemplate)) {
        this.featureInfoTemplate =
            '#### Inputs\n\n' +
            inputsSection + '\n\n' +
            '#### Outputs\n\n' +
            outputsSection;
    }

    var geojson = {
        "type":"FeatureCollection",
        "features": [
            {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: getCoordsForGeoJson(this.elevationResult)
                },
                properties: {
                    name: "Elevation"
                }
            }
        ],
        "totalFeatures": 1
    };

    this._geoJsonItem = new GeoJsonCatalogItem(this.terria);
    this._geoJsonItem.name = this.name;
    this._geoJsonItem.data = geojson;
    var that = this;
    return this._geoJsonItem.load().then(function() {
        if (!defined(that.rectangle)) {
            that.rectangle = that._geoJsonItem.rectangle;
        }
    });
};

ElvisElevationCatalogItem.prototype._enable = function() {
    if (defined(this._geoJsonItem)) {
        this._geoJsonItem._enable();
    }
};

ElvisElevationCatalogItem.prototype._disable = function() {
    if (defined(this._geoJsonItem)) {
        this._geoJsonItem._disable();
    }
};

ElvisElevationCatalogItem.prototype._show = function() {
    if (defined(this._geoJsonItem)) {
        this._geoJsonItem._show();
    }
};

ElvisElevationCatalogItem.prototype._hide = function() {
    if (defined(this._geoJsonItem)) {
        this._geoJsonItem._hide();
    }
};

function resultToDistanceVsElevationCsv(elevationResult, waterResult, distance) {
    var distanceIncrement = distance/elevationResult.length;
    var currentDistance = distanceIncrement;
    var csv = 'Distance,Elevation';
    if (defined(waterResult)) {
        csv += ',Water Table';
    }
    csv += '\n';
    for (var i = 0; i < elevationResult.length; ++i) {
        csv += currentDistance + ',' + elevationResult[i].z;
        if (defined(waterResult) &&
            (Math.abs(elevationResult[i].x - waterResult[i].x) < 0.01) &&
            (Math.abs(elevationResult[i].y - waterResult[i].y) < 0.01)) {
            if (waterResult[i].z === 'null') {
                csv += ',';
            } else {
                csv += ',' + waterResult[i].z;
            }
        }
        csv += '\n';
        currentDistance += distanceIncrement;
    }
    return csv;
}

function getCoordsForGeoJson(obj) {
    var listOfCoords = [];
    for (var i = 0; i < obj.length; ++i) {
        var coords = [obj[i].x, obj[i].y, obj[i].z];
        listOfCoords.push(coords);
    }
    return listOfCoords;
}

module.exports = ElvisElevationCatalogItem;
