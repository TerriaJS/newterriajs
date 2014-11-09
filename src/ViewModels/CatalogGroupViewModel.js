'use strict';

/*global require*/

var clone = require('../../third_party/cesium/Source/Core/clone');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var freezeObject = require('../../third_party/cesium/Source/Core/freezeObject');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var RuntimeError = require('../../third_party/cesium/Source/Core/RuntimeError');

var createCatalogMemberFromType = require('./createCatalogMemberFromType');
var CatalogMemberViewModel = require('./CatalogMemberViewModel');
var inherit = require('../Core/inherit');
var runWhenDoneLoading = require('./runWhenDoneLoading');

/**
 * A group of data items and other groups in the {@link CatalogViewModel}.  A group can contain
 * {@link CatalogMemberViewModel|CatalogMemberViewModels} or other
 * {@link CatalogGroupViewModel|CatalogGroupViewModels}.
 *
 * @alias CatalogGroupViewModel
 * @constructor
 * @extends CatalogMemberViewModel
 * 
 * @param {ApplicationViewModel} application The application.
 */
var CatalogGroupViewModel = function(application) {
    CatalogMemberViewModel.call(this, application);

    /**
     * Gets or sets a value indicating whether the group is currently expanded and showing
     * its children.  This property is observable.
     * @type {Boolean}
     */
    this.isOpen = false;

    /**
     * Gets or sets a value indicating whether the group is currently loading.  This property
     * is observable.
     * @type {Boolean}
     */
    this.isLoading = false;

    /**
     * Gets the collection of items in this group.  This property is observable.
     * @type {CatalogMemberViewModel[]}
     */
    this.items = [];

    knockout.track(this, ['isOpen', 'isLoading', 'items']);

    var that = this;

    knockout.getObservable(this, 'isOpen').subscribe(function(newValue) {
        // Load this group's items (if we haven't already) when it is opened.
        if (newValue) {
            that.load();
        }
    });

    knockout.getObservable(this, 'isLoading').subscribe(function(newValue) {
        // Call load() again immediately after finishing loading, if the group is still open.  Normally this will do nothing,
        // but if the URL has changed since we started, it will kick off loading the new URL.
        // If this spins you into a stack overflow, verify that your derived-class load method only
        // loads when it actually needs to do so!
        if (newValue === false && that.isOpen) {
            that.load();
        }
    });
};

inherit(CatalogMemberViewModel, CatalogGroupViewModel);

defineProperties(CatalogGroupViewModel.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf CatalogGroupViewModel.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'group';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, such as 'Web Map Service (WMS)'.
     * @memberOf CatalogGroupViewModel.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Group';
        }
    },

    /**
     * Gets the set of functions used to update individual properties in {@link CatalogMemberViewModel#updateFromJson}.
     * When a property name in the returned object literal matches the name of a property on this instance, the value
     * will be called as a function and passed a reference to this instance, a reference to the source JSON object
     * literal, and the name of the property.
     * @memberOf CatalogGroupViewModel.prototype
     * @type {Object}
     */
    updaters : {
        get : function() {
            return CatalogGroupViewModel.defaultUpdaters;
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link CatalogMemberViewModel#serializeToJson}.
     * When a property name on the view-model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the view-model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf CatalogGroupViewModel.prototype
     * @type {Object}
     */
    serializers : {
        get : function() {
            return CatalogGroupViewModel.defaultSerializers;
        }
    },

    /**
     * Gets the set of names of the properties to be serialized for this object when {@link CatalogMemberViewModel#serializeToJson} is called
     * and the `serializeForSharing` flag is set in the options.
     * @memberOf CatalogGroupViewModel.prototype
     * @type {String[]}
     */
    propertiesForSharing : {
        get : function() {
            return CatalogGroupViewModel.defaultPropertiesForSharing;
        }
    }
});

/**
 * Gets or sets the set of default updater functions to use in {@link CatalogMemberViewModel#updateFromJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMemberViewModel#updaters} property.
 * @type {Object}
 */
CatalogGroupViewModel.defaultUpdaters = clone(CatalogMemberViewModel.defaultUpdaters);

CatalogGroupViewModel.defaultUpdaters.items = function(viewModel, json, propertyName, options) {
    if (!defined(json.items)) {
        return;
    }

    // If the group is still loading, delay this operation until the loading is complete.
    // Otherwise, these changes could get clobbered by the load.
    runWhenDoneLoading(viewModel, function(viewModel) {
        // TODO: allow JSON to update the order of items as well.

        options = defaultValue(options, defaultValue.EMPTY_OBJECT);
        var onlyUpdateExistingItems = defaultValue(options.onlyUpdateExistingItems, false);

        var items = json.items;
        for (var itemIndex = 0; itemIndex < items.length; ++itemIndex) {
            var item = items[itemIndex];

            // Find an existing item with the same name
            var existingItem = viewModel.findFirstItemByName(item.name);
            if (!defined(existingItem)) {
                // Skip this item entirely if we're not allowed to create it.
                if (onlyUpdateExistingItems) {
                    continue;
                }

                if (!defined(item.type)) {
                    throw new RuntimeError('An item must have a type.');
                }

                existingItem = createCatalogMemberFromType(item.type, viewModel.application);
                viewModel.add(existingItem);
            }

            existingItem.updateFromJson(item, options);
        }
    });
};

CatalogGroupViewModel.defaultUpdaters.isLoading = function(viewModel, json, propertyName) {};

freezeObject(CatalogGroupViewModel.defaultUpdaters);

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMemberViewModel#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMemberViewModel#serializers} property.
 * @type {Object}
 */
CatalogGroupViewModel.defaultSerializers = clone(CatalogMemberViewModel.defaultSerializers);

CatalogGroupViewModel.defaultSerializers.items = function(viewModel, json, propertyName, options) {
    var items = json.items = [];

    for (var i = 0; i < viewModel.items.length; ++i) {
        var item = viewModel.items[i].serializeToJson(options);
        if (defined(item)) {
            items.push(item);
        }
    }
};

CatalogGroupViewModel.defaultSerializers.isLoading = function(viewModel, json, propertyName, options) {};

freezeObject(CatalogGroupViewModel.defaultSerializers);

/**
 * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogItemViewModel}-derived object with the
 * `serializeForSharing` flag set in the options.
 * @type {String[]}
 */
CatalogGroupViewModel.defaultPropertiesForSharing = clone(CatalogMemberViewModel.defaultPropertiesForSharing);
CatalogGroupViewModel.defaultPropertiesForSharing.push('items');
CatalogGroupViewModel.defaultPropertiesForSharing.push('isOpened');

freezeObject(CatalogGroupViewModel.defaultPropertiesForSharing);

/**
 * When implemented in a derived class, loads the contents of this group, if the contents are not already loaded.  It is safe to
 * call this method multiple times.  The {@link CatalogGroupViewModel#isLoading} flag will be set while the load is in progress.
 * This base-class implementation of this method does nothing because {@link CatalogGroupViewModel} does not do an lazy loading
 * of its content.
 */
CatalogGroupViewModel.prototype.load = function() {
};

/**
 * Adds an item or group to this group.
 * 
 * @param {CatalogMemberViewModel} item The item to add.
 */
CatalogGroupViewModel.prototype.add = function(item) {
    this.items.push(item);
};

/**
 * Removes an item or group from this group.
 * 
 * @param {CatalogMemberViewModel} item The item to remove.
 */
CatalogGroupViewModel.prototype.remove = function(item) {
    this.items.remove(item);
};

/**
 * Toggles the {@link CatalogGroupViewModel#isOpen} property of this group.  If it is open, calling this method
 * will close it.  If it is closed, calling this method will open it.
 */
CatalogGroupViewModel.prototype.toggleOpen = function() {
    this.isOpen = !this.isOpen;
};

/**
 * Finds the first item in this group that has the given name.  The search is case-sensitive.
 * 
 * @param {String} name The name of the item to find.
 * @return {CatalogMemberViewModel} The first item with the given name, or undefined if no item with that name exists.
 */
CatalogGroupViewModel.prototype.findFirstItemByName = function(name) {
    for (var i = 0; i < this.items.length; ++i) {
        if (this.items[i].name === name) {
            return this.items[i];
        }
    }

    return undefined;
};

module.exports = CatalogGroupViewModel;
