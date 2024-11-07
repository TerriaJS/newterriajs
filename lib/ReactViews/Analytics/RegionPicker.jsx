"use strict";

import classNames from "classnames";
import React from "react";

import createReactClass from "create-react-class";

import PropTypes from "prop-types";

import defined from "terriajs-cesium/Source/Core/defined";

import GeoJsonCatalogItem from "../../Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import WebMapServiceCatalogItem from "../../Models/Catalog/Ows/WebMapServiceCatalogItem";
import { withTranslation } from "react-i18next";

import RegionTypeParameterEditor from "./RegionTypeParameterEditor";
import Styles from "./parameter-editors.scss";
import CommonStrata from "../../Models/Definition/CommonStrata";

const knockout = {
  defineProperty() {
    throw new Error("This component needs to be fixed to not use Knockout.");
  },
  getObservable() {
    throw new Error("This component needs to be fixed to not use Knockout.");
  }
};

const RegionPicker = createReactClass({
  displayName: "RegionPicker",

  propTypes: {
    previewed: PropTypes.object,
    parameter: PropTypes.object,
    t: PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      autocompleteVisible: false,
      autocompleteOptions: [],
      autocompleteText: undefined,
      displayValue: ""
    };
  },

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillMount() {
    this._loadingRegionProvider = undefined;
    this._selectedRegionCatalogItem = undefined;
    this._regionNames = [];
    this._regionsCatalogItem = undefined;
    this.regionProvider = undefined;
    this._subscriptions = [];
    this._lastFeature = undefined;
    this._lastPickedFeatures = undefined;

    knockout.defineProperty(this, "regionProvider", {
      get: function () {
        return this.props.parameter.regionProvider;
      }
    });

    this._subscriptions.push(
      knockout
        .getObservable(this, "regionProvider")
        .subscribe(this.addRegionLayer)
    );

    knockout.defineProperty(this, "regionValue", {
      get: function () {
        return this.props.parameter.value;
      },
      set: function (value) {
        if (defined(value) && defined(value.realRegion)) {
          value = value.realRegion;
        }
        this.props.parameter.setValue(CommonStrata.user, value);
      }
    });

    const that = this;
    knockout
      .getObservable(
        this.props.previewed.terria.mapInteractionModeStack[0],
        "pickedFeatures"
      )
      .subscribe(function (pickedFeatures) {
        if (!defined(pickedFeatures)) {
          return;
        }
        that._lastPickedFeatures = pickedFeatures;
        pickedFeatures.allFeaturesAvailablePromise.then(function () {
          if (
            pickedFeatures !== that._lastPickedFeatures ||
            pickedFeatures.features.length === 0
          ) {
            return;
          }
          that.updateFeature(pickedFeatures.features[0]);
        });
      });

    this.addRegionLayer();
    this.updateMapFromValue();
  },

  componentWillUnmount() {
    this._subscriptions.forEach((subscription) => subscription.dispose());
    if (defined(this._regionsCatalogItem)) {
      this._regionsCatalogItem.isEnabled = false;
      this._regionsCatalogItem = undefined;
    }
    if (defined(this._selectedRegionCatalogItem)) {
      this._selectedRegionCatalogItem.isEnabled = false;
      this._selectedRegionCatalogItem = undefined;
    }
  },

  updateFeature(feature) {
    this._lastRegionFeature = feature.data;
    const regionProperty = feature.properties[this.regionProvider.regionProp];
    const regionId =
      typeof regionProperty === "object"
        ? regionProperty.getValue()
        : regionProperty;

    this.regionValue = this.props.parameter.findRegionByID(regionId);

    if (defined(this._selectedRegionCatalogItem)) {
      this._selectedRegionCatalogItem.isEnabled = false;
      this._selectedRegionCatalogItem = undefined;
    }

    if (defined(feature.data) && feature.data.type === "Feature") {
      this._selectedRegionCatalogItem = new GeoJsonCatalogItem(
        this.props.previewed.terria
      );
      this._selectedRegionCatalogItem.name = "Selected Polygon";
      this._selectedRegionCatalogItem.data = feature.data;
      this._selectedRegionCatalogItem.isEnabled = true;
      this._selectedRegionCatalogItem.zoomTo();
    }

    this.setState({
      autocompleteVisible: false,
      autocompleteOptions: [],
      autocompleteText: undefined
    });
  },

  addRegionLayer() {
    if (!defined(this.regionProvider)) {
      return;
    }

    if (this.regionProvider === this._loadingRegionProvider) {
      // The region provider hasn't changed.
      return;
    }

    this._loadingRegionProvider = this.regionProvider;

    const that = this;
    Promise.all([
      that.regionProvider.loadRegionIDs(),
      that.regionProvider.loadRegionNames()
    ]).then(function () {
      if (that.regionProvider !== that._loadingRegionProvider) {
        return;
      }
      that._regionNames = that.regionProvider.regionNames;

      if (defined(that._regionsCatalogItem)) {
        that._regionsCatalogItem.isEnabled = false;
        that._regionsCatalogItem = undefined;
      }

      that._regionsCatalogItem = new WebMapServiceCatalogItem(
        that.props.previewed.terria
      );
      that._regionsCatalogItem.name = "Available Regions";
      that._regionsCatalogItem.url = that.regionProvider.analyticsWmsServer;
      that._regionsCatalogItem.layers =
        that.regionProvider.analyticsWmsLayerName;
      that._regionsCatalogItem.parameters = {
        styles: "border_black_fill_aqua"
      };
      that._regionsCatalogItem.isEnabled = true;

      that._loadingRegionProvider = undefined;
    });
  },

  updateMapFromValue() {
    const { t } = this.props;
    if (!defined(this.regionProvider)) {
      return;
    }

    if (defined(this._selectedRegionCatalogItem)) {
      this._selectedRegionCatalogItem.isEnabled = false;
      this._selectedRegionCatalogItem = undefined;
    }

    const value = this.regionValue;
    const terria = this.props.previewed.terria;

    const that = this;
    this.regionProvider
      .getRegionFeature(terria, value, that._lastRegionFeature)
      .then(function (feature) {
        if (!defined(feature)) {
          return;
        }
        if (defined(that._selectedRegionCatalogItem)) {
          that._selectedRegionCatalogItem.isEnabled = false;
          that._selectedRegionCatalogItem = undefined;
        }

        if (defined(feature) && feature.type === "Feature") {
          that._selectedRegionCatalogItem = new GeoJsonCatalogItem(
            that.props.previewed.terria
          );
          that._selectedRegionCatalogItem.name = t("analytics.selectedPolygon");
          that._selectedRegionCatalogItem.data = feature;
          that._selectedRegionCatalogItem.isEnabled = true;
          that._selectedRegionCatalogItem.zoomTo();
        }
      })
      .catch(function () {
        if (that.props.parameter.value !== value) {
          // Value has already changed.
          return;
        }

        if (defined(that._selectedRegionCatalogItem)) {
          that._selectedRegionCatalogItem.isEnabled = false;
          that._selectedRegionCatalogItem = undefined;
        }
      });
  },

  textChange(e) {
    // Reset region value
    this.regionValue = undefined;

    if (!defined(e.target.value) || !defined(this.regionProvider)) {
      return;
    }

    // if input is empty
    if (!defined(e.target.value)) {
      this.setState({
        autocompleteVisible: false,
        autocompleteOptions: [],
        autocompleteText: undefined
      });
      return;
    }

    // if has text, populate auto complete
    const result = [];
    const regions = this.regionProvider.regions;
    const regionNames = this._regionNames;
    if (regions && regions.length > 0) {
      for (let i = 0; i < regions.length; i++) {
        const name = regionNames[i];
        if (
          name &&
          name.toLowerCase().indexOf(e.target.value.toLowerCase()) >= 0
        ) {
          result.push({
            name: name,
            id: regions[i].id,
            FID: regions[i].FID,
            realRegion: regions[i]
          });
          if (result.length >= 100) {
            break;
          }
        }
      }
    }
    this.setState({
      autocompleteVisible: result.length > 0 && result.length <= 100,
      autocompleteOptions: result,
      autocompleteText: e.target.value
    });
  },

  selectRegion(region) {
    this.regionValue = region;
    // After choosing a region from auto complete
    this.setState({
      autocompleteVisible: false,
      autocompleteOptions: [],
      autocompleteText: undefined
    });
    this.updateMapFromValue();
  },

  render() {
    const { t } = this.props;
    return (
      <div className={Styles.parameterEditor}>
        <RegionTypeParameterEditor
          previewed={this.props.previewed}
          parameter={this.props.parameter.regionTypeParameter}
        />
        <input
          className={Styles.field}
          type="text"
          autoComplete="off"
          value={
            this.state.autocompleteText ||
            getDisplayValue(this.regionValue, this.props.parameter)
          }
          onChange={this.textChange}
          placeholder={t("analytics.regionName")}
        />
        {this.renderOptions()}
      </div>
    );
  },

  renderOptions() {
    const className = classNames({
      [Styles.autocomplete]: true,
      [Styles.isHidden]: !this.state.autocompleteVisible
    });

    return (
      <ul className={className}>
        {this.state.autocompleteOptions.map((op, i) => (
          <li key={i}>
            <button
              type="button"
              className={Styles.autocompleteItem}
              onClick={this.selectRegion.bind(this, op)}
            >
              {op.name}
            </button>
          </li>
        ))}
      </ul>
    );
  }
});

/**
 * Given a value, return it in human readable form for display.
 * @param {Object} value Native format of parameter value.
 * @return {String} String for display
 */
export function getDisplayValue(region, parameter) {
  if (!defined(region)) {
    return "";
  }
  const regionProvider = parameter.regionProvider;
  let val;
  const index = regionProvider.regions.indexOf(region);
  if (index >= 0 && regionProvider.regionNames[index]) {
    val = regionProvider.regionNames[index];
  } else {
    val = region.id;
  }
  if (!defined(val)) {
    return "";
  }
  return regionProvider.regionType + ": " + val;
}

export default withTranslation()(RegionPicker);
