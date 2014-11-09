'use strict';

/*global require*/

var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var RuntimeError = require('../../third_party/cesium/Source/Core/RuntimeError');

var createCatalogMemberFromType = require('./createCatalogMemberFromType');
var CatalogGroupViewModel = require('./CatalogGroupViewModel');

/**
 * The view model for the geospatial data catalog.
 *
 * @param {ApplicationViewModel} application The application.
 *
 * @alias CatalogViewModel
 * @constructor
 */
var CatalogViewModel = function(application) {
    if (!defined(application)) {
        throw new DeveloperError('application is required');
    }

    this._application = application;

    this._group = new CatalogGroupViewModel(application);
    this._group.name = 'Root Group';

    /**
     * Gets or sets a flag indicating whether the catalog is currently loading.
     * @type {Boolean}
     */
    this.isLoading = false;

    knockout.track(this, ['isLoading']);

    knockout.defineProperty(this, 'userAddedDataGroup', {
        get : function() {
            var group;

            var groups = this.group.items;
            for (var i = 0; i < groups.length; ++i) {
                group = groups[i];
                if (group.name === 'User-Added Data') {
                    return group;
                }
            }

            group = new CatalogGroupViewModel(this.application);
            group.name = 'User-Added Data';
            group.description = 'The group for data that was added by the user via the Add Data panel.';
            this.group.add(group);

            return group;
        }
    });
};

defineProperties(CatalogViewModel.prototype, {
    /**
     * Gets the application.
     * @memberOf CatalogViewModel.prototype
     * @type {ApplicationViewModel}
     */
    application : {
        get : function() {
            return this._application;
        }
    },

    /**
     * Gets the catalog's top-level group.
     * @memberOf CatalogViewModel.prototype
     * @type {CatalogGroupViewModel}
     */
    group : {
        get : function() {
            return this._group;
        }
    }
});

/**
 * Updates the catalog from a JSON object-literal description of the available collections.
 * Existing collections with the same name as a collection in the JSON description are
 * updated.  If the description contains a collection with a name that does not yet exist,
 * it is created.
 *
 * @param {Object} json The JSON description.  The JSON should be in the form of an object literal, not a string.
 * @param {Object} [options] Object with the following properties:
 * @param {Boolean} [options.onlyUpdateExistingItems] true to only update existing items and never create new ones, or false is new items
 *                                                    may be created by this update.
 * @param {Boolean} [options.isUserSupplied] If specified, sets the {@link CatalogMemberViewModel#isUserSupplied} property of updated catalog members
 *                                           to the given value.  If not specified, the property is left unchanged.
 */
CatalogViewModel.prototype.updateFromJson = function(json, options) {
    if (!(json instanceof Array)) {
        throw new DeveloperError('JSON catalog description must be an array of groups.');
    }

    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    var onlyUpdateExistingItems = defaultValue(options.onlyUpdateExistingItems, false);

    for (var groupIndex = 0; groupIndex < json.length; ++groupIndex) {
        var group = json[groupIndex];

        if (!defined(group.name)) {
            throw new RuntimeError('A group must have a name.');
        }

        // Find an existing group with the same name, if any.
        var existingGroup = this.group.findFirstItemByName(group.name);
        if (!defined(existingGroup)) {
            // Skip this item entirely if we're not allowed to create it.
            if (onlyUpdateExistingItems) {
                continue;
            }

            if (!defined(group.type)) {
                throw new RuntimeError('A group must have a type.');
            }

            existingGroup = createCatalogMemberFromType(group.type, this.application);

            this.group.add(existingGroup);
        }

        existingGroup.updateFromJson(group, options);
    }

    this.application.nowViewing.sortByNowViewingIndices();
};

/**
 * Serializes the catalog to JSON.
 *
 * @param {Object} [options] Object with the following properties:
 * @param {Boolean} [options.enabledItemsOnly=false] true if only enabled data items (and their groups) should be serialized,
 *                  or false if all data items should be serialized.
 * @param {CatalogMemberViewModel[]} [options.itemsSkippedBecauseTheyAreNotEnabled] An array that, if provided, is populated on return with
 *        all of the data items that were not serialized because they were not enabled.  The array will be empty if
 *        options.enabledItemsOnly is false.
 * @param {Boolean} [options.skipItemsWithLocalData=false] true if items with a serializable 'data' property should be skipped entirely.
 *                  This is useful to avoid creating a JSON data structure with potentially very large embedded data.
 * @param {CatalogMemberViewModel[]} [options.itemsSkippedBecauseTheyHaveLocalData] An array that, if provided, is populated on return
 *        with all of the data items that were not serialized because they have a serializable 'data' property.  The array will be empty
 *        if options.skipItemsWithLocalData is false.
 * @param {Boolean} [options.serializeForSharing=false] true to only serialize properties that are typically necessary for sharing this member
 *                                                      with other users, such as {@link CatalogGroupViewModel#isOpen}, {@link CatalogItemViewModel#isEnabled},
 *                                                      {@link CatalogItemViewModel#isLegendVisible}, and {@link ImageryLayerViewModel#opacity},
 *                                                      rather than serializing all properties needed to completely recreate the catalog.
 * @param {Boolean} [options.userSuppliedOnly=false] true to only serialize catalog members (and their containing groups) that have been identified as having been
 *                  supplied by the user ({@link CatalogMemberViewModel#isUserSupplied} is true); false to serialize all catalog members.
 * @return {Object} The serialized JSON object-literal.
 */
CatalogViewModel.prototype.serializeToJson = function(options) {
    this.application.nowViewing.recordNowViewingIndices();

    var json = {};
    CatalogGroupViewModel.defaultSerializers.items(this.group, json, 'items', options);
    return json.items;
};

module.exports = CatalogViewModel;
