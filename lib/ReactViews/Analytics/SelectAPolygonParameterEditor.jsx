import createReactClass from "create-react-class";
import { reaction, runInAction } from "mobx";
import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import defined from "terriajs-cesium/Source/Core/defined";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Result from "../../Core/Result";
import featureDataToGeoJson from "../../Map/featureDataToGeoJson";
import CommonStrata from "../../Models/Definition/CommonStrata";
import GeoJsonCatalogItem from "../../Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import MapInteractionMode from "../../Models/MapInteractionMode";
import Styles from "./parameter-editors.scss";

const SelectAPolygonParameterEditor = createReactClass({
  propTypes: {
    previewed: PropTypes.object,
    parameter: PropTypes.object,
    viewState: PropTypes.object,
    t: PropTypes.func.isRequired
  },

  setDisplayValue(e) {
    SelectAPolygonParameterEditor.setDisplayValue(e, this.props.parameter);
  },

  selectExistingPolygonOnMap() {
    this.selectAPolygonParameterEditorCore.selectOnMap(
      this.props.previewed.terria,
      this.props.viewState,
      this.props.parameter
    );
  },

  render() {
    const { t } = this.props;
    return (
      <div>
        <input className={Styles.field} type="text" value={this.state.value} />
        <button
          type="button"
          onClick={this.selectExistingPolygonOnMap}
          className={Styles.btnSelector}
        >
          {t("analytics.selectExistingPolygon")}
        </button>
      </div>
    );
  }
});

/**
 * Prompts the user to select a point on the map.
 */
export function selectOnMap(terria, viewState, parameter) {
  // Cancel any feature picking already in progress.
  terria.pickedFeatures = undefined;

  let pickedFeaturesSubscription;
  const pickPolygonMode = new MapInteractionMode({
    message:
      '<div>Select existing polygon<div style="font-size:12px"><p><i>If there are no polygons to select, add a layer that provides polygons.</i></p></div></div>',
    onCancel: function() {
      terria.mapInteractionModeStack.pop();
      viewState.openAddData();
      if (pickedFeaturesSubscription) {
        pickedFeaturesSubscription.dispose();
      }
    }
  });
  terria.mapInteractionModeStack.push(pickPolygonMode);

  reaction(
    () => pickPolygonMode.pickedFeatures,
    async (pickedFeatures, reaction) => {
      pickedFeaturesSubscription = reaction;
      if (pickedFeatures.allFeaturesAvailablePromise) {
        await pickedFeatures.allFeaturesAvailablePromise;
      }

      if (!defined(pickedFeatures.pickPosition)) {
        return [];
      }

      const catalogItems = pickedFeatures.features
        .map(function(feature) {
          let geojson;
          if (feature.data) {
            geojson = featureDataToGeoJson(feature.data);
            if (
              defined(geojson) &&
              !defined(geojson.id) &&
              defined(feature.id)
            ) {
              geojson.id = feature.id;
            }
          } else if (defined(feature.polygon)) {
            const positions = feature.polygon.hierarchy
              .getValue()
              .positions.map(function(position) {
                const cartographic = Ellipsoid.WGS84.cartesianToCartographic(
                  position
                );
                return [
                  CesiumMath.toDegrees(cartographic.longitude),
                  CesiumMath.toDegrees(cartographic.latitude)
                ];
              });

            geojson = {
              id: feature.id,
              type: "Feature",
              properties: feature.properties
                ? feature.properties.getValue(terria.timelineClock)
                : undefined,
              geometry: {
                coordinates: [[positions]],
                type: "MultiPolygon"
              }
            };
          }

          if (defined(geojson)) {
            const catalogItem = new GeoJsonCatalogItem(createGuid(), terria);
            catalogItem.setTrait(CommonStrata.user, "geoJsonData", geojson);
            return catalogItem;
          }
        })
        .filter(item => defined(item));

      const result = Result.combine(
        await Promise.all(catalogItems.map(model => model.loadMapItems())),
        "Failed to load picked polygons"
      );

      if (result.error) {
        terria.raiseErrorToUser(result.error, "Failed to select polygons");
      } else {
        runInAction(() => {
          parameter.setValue(
            CommonStrata.user,
            catalogItems.map(item => item.readyData)
          );
          terria.mapInteractionModeStack.pop();
          viewState.openAddData();
        });
      }

      if (pickedFeaturesSubscription) {
        pickedFeaturesSubscription.dispose();
      }
    }
  );

  viewState.explorerPanelIsVisible = false;
}

export function getDisplayValue(value) {
  if (!defined(value) || value === "") {
    return "";
  }
  return value
    .map(function(featureData) {
      return featureData.id;
    })
    .join(", ");
}

export default withTranslation()(SelectAPolygonParameterEditor);
