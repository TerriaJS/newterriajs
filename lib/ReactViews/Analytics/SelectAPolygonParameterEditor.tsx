import { Feature as GeoJsonFeature } from "@turf/helpers";
import {
  IReactionPublic,
  isObservableArray,
  reaction,
  runInAction
} from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import filterOutUndefined from "../../Core/filterOutUndefined";
import flatten from "../../Core/flatten";
import { FeatureCollectionWithCrs } from "../../Core/GeoJson";
import isDefined from "../../Core/isDefined";
import Result from "../../Core/Result";
import featureDataToGeoJson from "../../Map/PickedFeatures/featureDataToGeoJson";
import GeoJsonCatalogItem from "../../Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import CommonStrata from "../../Models/Definition/CommonStrata";
import GeoJsonParameter from "../../Models/FunctionParameters/GeoJsonParameter";
import MapInteractionMode from "../../Models/MapInteractionMode";
import Terria from "../../Models/Terria";
import ViewState from "../../ReactViewModels/ViewState";

/**
 * Prompts the user to select a point on the map.
 */
export function selectOnMap(
  terria: Terria,
  viewState: ViewState,
  parameter: GeoJsonParameter
) {
  // Cancel any feature picking already in progress.
  terria.pickedFeatures = undefined;

  let pickedFeaturesSubscription: IReactionPublic;
  const pickPolygonMode = new MapInteractionMode({
    message:
      '<div>Select existing polygon<div style="font-size:12px"><p><i>If there are no polygons to select, add a layer that provides polygons.</i></p></div></div>',
    onCancel: function () {
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
    async (pickedFeatures, _previousValue, reaction) => {
      pickedFeaturesSubscription = reaction;
      if (pickedFeatures?.allFeaturesAvailablePromise) {
        await pickedFeatures.allFeaturesAvailablePromise;
      }

      if (!isDefined(pickedFeatures?.pickPosition)) {
        return [];
      }

      const catalogItems = (pickedFeatures?.features
        .map(function (feature) {
          let geojson: FeatureCollectionWithCrs | GeoJsonFeature | undefined;
          if (feature.data) {
            geojson = featureDataToGeoJson(feature.data);
            // Note featureDataToGeoJson will only ever have a single feature
            // Add an id to it
            const firstFeature = geojson?.features[0];
            if (
              isDefined(firstFeature) &&
              !isDefined(firstFeature.id) &&
              isDefined(feature.id)
            ) {
              firstFeature.id = feature.id;
            }
          } else if (isDefined(feature.polygon)) {
            const positions = feature.polygon.hierarchy
              ?.getValue(terria.timelineClock.currentTime)
              .positions.map((position: Cartesian3) => {
                const cartographic =
                  Ellipsoid.WGS84.cartesianToCartographic(position);
                return [
                  CesiumMath.toDegrees(cartographic.longitude),
                  CesiumMath.toDegrees(cartographic.latitude)
                ];
              });

            geojson = {
              id: feature.id,
              type: "Feature",
              properties: feature.properties
                ? feature.properties.getValue(terria.timelineClock.currentTime)
                : undefined,
              geometry: {
                coordinates: [[positions]],
                type: "MultiPolygon"
              }
            };
          }

          if (isDefined(geojson)) {
            const catalogItem = new GeoJsonCatalogItem(createGuid(), terria);
            catalogItem.setTrait(
              CommonStrata.user,
              "geoJsonData",
              geojson as any
            );
            return catalogItem;
          }
        })
        .filter((item) => isDefined(item)) ?? []) as GeoJsonCatalogItem[];

      const result = Result.combine(
        await Promise.all(catalogItems.map((model) => model.loadMapItems())),
        "Failed to load picked polygons"
      );

      if (result.error) {
        terria.raiseErrorToUser(result.error, "Failed to select polygons");
        terria.mapInteractionModeStack.pop();
      } else {
        const features = flatten(
          filterOutUndefined(
            catalogItems.map((item) => item.readyData?.features)
          )
        ).filter(
          (f) =>
            f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon"
        ) as any;

        runInAction(() => {
          parameter.setValue(CommonStrata.user, features);
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

export function getDisplayValue(value: GeoJsonFeature[]) {
  if (!isDefined(value) || !isObservableArray(value)) {
    return "";
  }
  return value
    .map(function (featureData) {
      return featureData.id;
    })
    .join(", ");
}
