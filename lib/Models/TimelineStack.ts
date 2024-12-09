import {
  action,
  autorun,
  computed,
  IReactionDisposer,
  observable,
  makeObservable
} from "mobx";
import Clock from "terriajs-cesium/Source/Core/Clock";
import ClockRange from "terriajs-cesium/Source/Core/ClockRange";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import filterOutUndefined from "../Core/filterOutUndefined";
import ReferenceMixin from "../ModelMixins/ReferenceMixin";
import TimeVarying, {
  DATE_SECONDS_PRECISION
} from "../ModelMixins/TimeVarying";
import DefaultTimelineModel from "./DefaultTimelineModel";
import CommonStrata from "./Definition/CommonStrata";
import Terria from "./Terria";

/**
 * Manages a stack of all the time-varying datasets currently attached to the timeline. Provides
 * access to the current top dataset so that it can be displayed to the user.
 *
 * @constructor
 */
export default class TimelineStack {
  /**
   * The stratum of each layer in the stack in which to store the current time as the clock ticks.
   */
  tickStratumId: string = CommonStrata.user;

  @observable
  items: TimeVarying[] = [];

  @observable
  defaultTimeVarying: TimeVarying | undefined;

  private _disposeClockAutorun: IReactionDisposer | undefined;
  private _disposeTickSubscription: CesiumEvent.RemoveCallback | undefined;

  constructor(
    readonly terria: Terria,
    readonly clock: Clock
  ) {
    makeObservable(this);
  }

  activate(): void {
    // Keep the Cesium clock in sync with the top layer's clock.
    this._disposeClockAutorun = autorun(() => {
      const topLayer = this.top;
      if (!topLayer || !topLayer.currentTimeAsJulianDate) {
        this.clock.shouldAnimate = false;
        return;
      }

      this.clock.currentTime = JulianDate.clone(
        topLayer.currentTimeAsJulianDate,
        this.clock.currentTime
      );
      this.clock.startTime = offsetIfUndefined(
        -43200.0,
        topLayer.currentTimeAsJulianDate,
        topLayer.startTimeAsJulianDate,
        this.clock.startTime
      );
      this.clock.stopTime = offsetIfUndefined(
        43200.0,
        topLayer.currentTimeAsJulianDate,
        topLayer.stopTimeAsJulianDate,
        this.clock.stopTime
      );
      if (topLayer.multiplier !== undefined) {
        this.clock.multiplier = topLayer.multiplier;
      } else {
        this.clock.multiplier = 60.0;
      }
      this.clock.shouldAnimate = !topLayer.isPaused;
      this.clock.clockRange = ClockRange.LOOP_STOP;

      if (this._disposeTickSubscription === undefined) {
        // We should start synchronizing only after first run of this autorun so that
        // the clock parameters are set correctly.
        this._disposeTickSubscription = this.clock.onTick.addEventListener(
          () => {
            this.syncToClock(this.tickStratumId);
          }
        );
      }
    });
  }

  deactivate(): void {
    if (this._disposeClockAutorun) {
      this._disposeClockAutorun();
    }
    if (this._disposeTickSubscription) {
      this._disposeTickSubscription();
      this._disposeTickSubscription = undefined;
    }
  }

  /**
   * The topmost time-series layer, or undefined if there is no such layer in the stack.
   */
  @computed
  get top(): TimeVarying | undefined {
    // Find the first item with a current, start, and stop time.
    // Use the default if there isn't one.
    return (
      this.items.find((item) => {
        const dereferenced: TimeVarying =
          ReferenceMixin.isMixedInto(item) && item.target
            ? (item.target as TimeVarying)
            : item;
        return (
          dereferenced.currentTimeAsJulianDate !== undefined &&
          dereferenced.startTimeAsJulianDate !== undefined &&
          dereferenced.stopTimeAsJulianDate !== undefined
        );
      }) || this.defaultTimeVarying
    );
  }

  @computed
  get itemIds(): readonly string[] {
    return filterOutUndefined(this.items.map((item) => item.uniqueId));
  }

  /**
   * Determines if the stack contains a given item.
   * @param item The item to check.
   * @returns True if the stack contains the item; otherwise, false.
   */
  contains(item: TimeVarying): boolean {
    return this.items.indexOf(item) >= 0;
  }

  /**
   * Adds the supplied {@link TimeVarying} to the top of the stack. If the item is already in the stack, it will be moved
   * rather than added twice.
   *
   * @param item
   */
  @action
  addToTop(item: TimeVarying): void {
    const currentIndex = this.items.indexOf(item);
    this.items.unshift(item);
    if (currentIndex > -1) {
      this.items.splice(currentIndex, 1);
    }
  }

  /**
   * Removes a layer from the stack, no matter what its location. If the layer is currently at the top, the value of
   * {@link TimelineStack#topLayer} will change.
   *
   * @param item;
   */
  @action
  remove(item: TimeVarying): void {
    const index = this.items.indexOf(item);
    this.items.splice(index, 1);
  }

  /**
   * Removes all layers.
   */
  @action
  removeAll(): void {
    this.items = [];
  }

  /**
   * Promotes the supplied {@link CatalogItem} to the top of the stack if it is already in the stack. If the item is not
   * already in the stack it won't be added.
   *
   * @param item
   */
  @action
  promoteToTop(item: TimeVarying): void {
    const currentIndex = this.items.indexOf(item);
    if (currentIndex > -1) {
      this.addToTop(item);
    }
  }

  /**
   * Synchronizes all layers in the stack to the current time and the paused state of the provided clock.
   * Synchronizes the {@link TimelineStack#top} to the clock's `startTime`, `endTime`, and `multiplier`.
   * @param stratumId The stratum in which to modify properties.
   * @param clock The clock to sync to.
   */
  @action
  syncToClock(stratumId: string): void {
    const clock = this.clock;
    const currentTime = JulianDate.toIso8601(
      clock.currentTime,
      DATE_SECONDS_PRECISION
    );
    const isPaused = !clock.shouldAnimate;

    if (this.top) {
      this.top.setTrait(
        stratumId,
        "startTime",
        JulianDate.toIso8601(clock.startTime, DATE_SECONDS_PRECISION)
      );
      this.top.setTrait(
        stratumId,
        "stopTime",
        JulianDate.toIso8601(clock.stopTime, DATE_SECONDS_PRECISION)
      );
      this.top.setTrait(stratumId, "multiplier", clock.multiplier);
    }

    for (let i = 0; i < this.items.length; ++i) {
      const layer = this.items[i];
      layer.setTrait(stratumId, "currentTime", currentTime);
      layer.setTrait(stratumId, "isPaused", isPaused);
    }

    if (this.defaultTimeVarying) {
      this.defaultTimeVarying.setTrait(stratumId, "currentTime", currentTime);
      this.defaultTimeVarying.setTrait(stratumId, "isPaused", isPaused);
    }
  }

  @action
  setAlwaysShowTimeline(show = true): void {
    if (!show) {
      this.defaultTimeVarying = undefined;
    } else {
      this.defaultTimeVarying = new DefaultTimelineModel(
        "defaultTimeVarying",
        this.terria
      );
    }
  }

  @computed
  get alwaysShowingTimeline() {
    return (
      this.defaultTimeVarying !== undefined &&
      this.defaultTimeVarying.startTimeAsJulianDate !== undefined &&
      this.defaultTimeVarying.stopTimeAsJulianDate !== undefined &&
      this.defaultTimeVarying.currentTimeAsJulianDate !== undefined
    );
  }
}

function offsetIfUndefined(
  offsetSeconds: number,
  baseTime: JulianDate,
  time: JulianDate | undefined,
  result?: JulianDate
): JulianDate {
  if (time === undefined) {
    return JulianDate.addSeconds(
      baseTime,
      offsetSeconds,
      result || new JulianDate()
    );
  } else {
    return JulianDate.clone(time, result);
  }
}
