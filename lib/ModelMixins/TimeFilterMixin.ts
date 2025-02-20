import {
  action,
  computed,
  observable,
  onBecomeObserved,
  makeObservable,
  override
} from "mobx";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import AbstractConstructor from "../Core/AbstractConstructor";
import filterOutUndefined from "../Core/filterOutUndefined";
import LatLonHeight from "../Core/LatLonHeight";
import runLater from "../Core/runLater";
import {
  ProviderCoords,
  ProviderCoordsMap
} from "../Map/PickedFeatures/PickedFeatures";
import CommonStrata from "../Models/Definition/CommonStrata";
import createStratumInstance from "../Models/Definition/createStratumInstance";
import Model from "../Models/Definition/Model";
import TerriaFeature from "../Models/Feature/Feature";
import TimeFilterTraits, {
  TimeFilterCoordinates
} from "../Traits/TraitsClasses/TimeFilterTraits";
import DiscretelyTimeVaryingMixin from "./DiscretelyTimeVaryingMixin";
import MappableMixin, { ImageryParts } from "./MappableMixin";

type BaseType = Model<TimeFilterTraits> & MappableMixin.Instance;

/**
 * A Mixin for filtering the dates for which imagery is available at a location
 * picked by the user
 *
 * When `timeFilterPropertyName` is set, we look for a property of that name in
 * the feature query response at the picked location. The property value should be
 * an array of dates for which imagery is available at the location. This
 * Mixin is used to implement the Location filter feature for Satellite
 * Imagery.
 */
function TimeFilterMixin<T extends AbstractConstructor<BaseType>>(Base: T) {
  abstract class TimeFilterMixin extends DiscretelyTimeVaryingMixin(Base) {
    @observable _currentTimeFilterFeature?: Entity;

    constructor(...args: any[]) {
      super(...args);

      makeObservable(this);

      // Try to resolve the timeFilterFeature from the co-ordinates that might
      // be stored in the traits. We only have to resolve the time filter
      // feature once to get the list of times.
      const disposeListener = onBecomeObserved(this, "mapItems", () => {
        runLater(
          action(() => {
            if (!MappableMixin.isMixedInto(this)) {
              disposeListener();
              return;
            }

            const coords = coordinatesFromTraits(this.timeFilterCoordinates);
            if (coords) {
              this.setTimeFilterFromLocation(coords);
            }
            disposeListener();
          })
        );
      });
    }

    /**
     * Loads the time filter by querying the imagery layers at the given
     * co-ordinates.
     *
     * @param coordinates.position The lat, lon, height of the location to pick in degrees
     * @param coordinates.tileCoords the x, y, level co-ordinates of the tile to pick
     * @returns Promise that fulfills when the picking is complete.
     *   The promise resolves to `false` if the filter could not be set for some reason.
     */
    @action
    async setTimeFilterFromLocation(coordinates: {
      position: LatLonHeight;
      tileCoords: ProviderCoords;
    }): Promise<boolean> {
      const timeProperty = this.timeFilterPropertyName;
      if (
        this.terria.allowFeatureInfoRequests === false ||
        timeProperty === undefined ||
        !MappableMixin.isMixedInto(this)
      ) {
        return false;
      }

      const pickTileCoordinates = coordinates.tileCoords;
      const pickCartographicPosition = Cartographic.fromDegrees(
        coordinates.position.longitude,
        coordinates.position.latitude,
        coordinates.position.height
      );

      // Pick all imagery provider for this item
      const imageryProviders = filterOutUndefined(
        this.mapItems.map((mapItem) =>
          ImageryParts.is(mapItem) ? mapItem.imageryProvider : undefined
        )
      );
      const picks = await pickImageryProviders(
        imageryProviders,
        pickTileCoordinates,
        pickCartographicPosition
      );

      // Find the first imageryProvider and feature with a matching time property
      let timeFeature: TerriaFeature | undefined;
      let imageryUrl: string | undefined;
      for (let i = 0; i < picks.length; i++) {
        const pick = picks[i];
        const imageryFeature = pick.imageryFeatures.find(
          (f) => f.properties[timeProperty] !== undefined
        );
        imageryUrl = (pick.imageryProvider as any).url;
        if (imageryFeature && imageryUrl) {
          imageryFeature.position =
            imageryFeature.position ?? pickCartographicPosition;
          timeFeature =
            TerriaFeature.fromImageryLayerFeatureInfo(imageryFeature);
          break;
        }
      }

      if (!timeFeature || !imageryUrl) {
        return false;
      }

      // Update time filter
      this.setTimeFilterFeature(timeFeature, {
        [imageryUrl]: {
          ...coordinates.position,
          ...coordinates.tileCoords
        }
      });
      return true;
    }

    get hasTimeFilterMixin() {
      return true;
    }

    @computed
    get canFilterTimeByFeature(): boolean {
      return this.timeFilterPropertyName !== undefined;
    }

    @computed
    private get imageryUrls() {
      if (!MappableMixin.isMixedInto(this)) return [];
      return filterOutUndefined(
        this.mapItems.map(
          // @ts-expect-error url attr
          (mapItem) => ImageryParts.is(mapItem) && mapItem.imageryProvider.url
        )
      );
    }

    @computed
    get featureTimesAsJulianDates() {
      if (
        this._currentTimeFilterFeature === undefined ||
        this._currentTimeFilterFeature.properties === undefined ||
        this.timeFilterPropertyName === undefined
      ) {
        return;
      }

      const featureTimes = this._currentTimeFilterFeature.properties[
        this.timeFilterPropertyName
      ]?.getValue(this.currentTime);

      if (!Array.isArray(featureTimes)) {
        return;
      }

      return filterOutUndefined(
        featureTimes.map((s) => {
          try {
            return s === undefined ? undefined : JulianDate.fromIso8601(s);
          } catch {
            return undefined;
          }
        })
      );
    }

    @override
    get discreteTimesAsSortedJulianDates() {
      const featureTimes = this.featureTimesAsJulianDates;
      if (featureTimes === undefined) {
        return super.discreteTimesAsSortedJulianDates;
      }

      return super.discreteTimesAsSortedJulianDates?.filter((dt) =>
        featureTimes.some((d) => d.equals(dt.time))
      );
    }

    @computed
    get timeFilterFeature() {
      return this._currentTimeFilterFeature;
    }

    @action
    setTimeFilterFeature(feature: Entity, providerCoords?: ProviderCoordsMap) {
      if (!MappableMixin.isMixedInto(this) || providerCoords === undefined)
        return;
      this._currentTimeFilterFeature = feature;

      if (!this.currentTimeAsJulianDate) {
        return;
      }
      if (!feature.position) {
        return;
      }

      const position = feature.position.getValue(this.currentTimeAsJulianDate);
      if (position === undefined) return;
      const cartographic = Ellipsoid.WGS84.cartesianToCartographic(position);
      const featureImageryUrl = this.imageryUrls.find(
        (url) => providerCoords[url]
      );
      const tileCoords = featureImageryUrl && providerCoords[featureImageryUrl];
      if (!tileCoords) return;

      this.setTrait(
        CommonStrata.user,
        "timeFilterCoordinates",
        createStratumInstance(TimeFilterCoordinates, {
          tile: tileCoords,
          longitude: CesiumMath.toDegrees(cartographic.longitude),
          latitude: CesiumMath.toDegrees(cartographic.latitude),
          height: cartographic.height
        })
      );
    }

    @action
    removeTimeFilterFeature() {
      this._currentTimeFilterFeature = undefined;
      this.setTrait(CommonStrata.user, "timeFilterCoordinates", undefined);
    }
  }

  return TimeFilterMixin;
}

namespace TimeFilterMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof TimeFilterMixin>> {}

  export function isMixedInto(model: any): model is Instance {
    return model && model.hasTimeFilterMixin;
  }
}

/**
 * Picks all the imagery providers at the given coordinates and return a
 * promise that resolves to the (imageryProvider, imageryFeatures) pairs.
 */
async function pickImageryProviders(
  imageryProviders: ImageryProvider[],
  pickCoordinates: ProviderCoords,
  pickPosition: Cartographic
): Promise<
  {
    imageryProvider: ImageryProvider;
    imageryFeatures: ImageryLayerFeatureInfo[];
  }[]
> {
  return filterOutUndefined(
    await Promise.all(
      imageryProviders.map((imageryProvider) =>
        imageryProvider
          .pickFeatures(
            pickCoordinates.x,
            pickCoordinates.y,
            pickCoordinates.level,
            pickPosition.longitude,
            pickPosition.latitude
          )
          ?.then((imageryFeatures) => ({ imageryProvider, imageryFeatures }))
      )
    )
  );
}

function coordinatesFromTraits(traits: Model<TimeFilterCoordinates>) {
  const {
    latitude,
    longitude,
    height,
    tile: { x, y, level }
  } = traits;
  if (latitude === undefined || longitude === undefined) return;
  if (x === undefined || y === undefined || level === undefined) return;
  return {
    position: { latitude, longitude, height },
    tileCoords: { x, y, level }
  };
}

export default TimeFilterMixin;
