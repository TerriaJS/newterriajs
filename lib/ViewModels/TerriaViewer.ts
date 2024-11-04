import { isEqual } from "lodash-es";
import {
  action,
  computed,
  IComputedValue,
  IObservableValue,
  IReactionDisposer,
  observable,
  reaction,
  runInAction,
  untracked,
  makeObservable
} from "mobx";
import { fromPromise, FULFILLED, IPromiseBasedObservable } from "mobx-utils";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import MappableMixin from "../ModelMixins/MappableMixin";
import CameraView from "../Models/CameraView";
import GlobeOrMap from "../Models/GlobeOrMap";
import NoViewer from "../Models/NoViewer";
import Terria from "../Models/Terria";
import ViewerMode from "../Models/ViewerMode";

// Async loading of Leaflet and Cesium

const leafletFromPromise = computed(
  () =>
    fromPromise(import("../Models/Leaflet").then((Leaflet) => Leaflet.default)),
  { keepAlive: true }
);

const cesiumFromPromise = computed(
  () =>
    fromPromise(import("../Models/Cesium").then((Cesium) => Cesium.default)),
  { keepAlive: true }
);

const cesium2dFromPromise = computed(
  () =>
    fromPromise(import("../Models/Cesium").then((Cesium) => Cesium.default)),
  { keepAlive: true }
);

// Viewer options. Designed to be easily serialisable
interface ViewerOptions {
  useTerrain: boolean;
  [key: string]: string | number | boolean;
}

const viewerOptionsDefaults: ViewerOptions = {
  useTerrain: true
};
/**
 * A class that deals with initialising, destroying and switching between viewers
 * Each map-view should have it's own TerriaViewer (main viewer, preview map, etc.)
 */
export default class TerriaViewer {
  readonly terria: Terria;

  @observable
  private _baseMap: MappableMixin.Instance | undefined;

  get baseMap() {
    return this._baseMap;
  }

  async setBaseMap(baseMap?: MappableMixin.Instance) {
    if (!baseMap) return;

    const result = await baseMap.loadMapItems();
    if (result.error) {
      result.raiseError(this.terria, {
        title: {
          key: "models.terria.loadingBaseMapErrorTitle",
          parameters: {
            name:
              (CatalogMemberMixin.isMixedInto(baseMap)
                ? baseMap.name
                : baseMap.uniqueId) ?? "Unknown item"
          }
        }
      });
    } else {
      runInAction(() => (this._baseMap = baseMap));
    }
  }

  // This is a "view" of a workbench/other
  readonly items:
    | IComputedValue<MappableMixin.Instance[]>
    | IObservableValue<MappableMixin.Instance[]>;

  @observable
  viewerMode: ViewerMode | undefined = ViewerMode.Cesium;

  // Set by UI
  @observable
  viewerOptions: ViewerOptions = viewerOptionsDefaults;

  // Disable all mouse (& keyboard) interaction
  @observable
  disableInteraction: boolean = false;

  _homeCamera: CameraView = new CameraView(Rectangle.MAX_VALUE);

  @computed
  get homeCamera() {
    return this._homeCamera;
  }
  set homeCamera(cameraView: CameraView) {
    if (isEqual(this._homeCamera.rectangle, Rectangle.MAX_VALUE)) {
      this.currentViewer.zoomTo(cameraView, 0.0);
    }
    this._homeCamera = cameraView;
  }

  @observable
  mapContainer: string | HTMLElement | undefined;

  /**
   * The distance between two pixels at the bottom center of the screen.
   * Set in lib/ReactViews/Map/Legend/DistanceLegend.jsx
   */
  @observable scale: number = 1;

  readonly beforeViewerChanged = new CesiumEvent();
  readonly afterViewerChanged = new CesiumEvent();

  constructor(terria: Terria, items: IComputedValue<MappableMixin.Instance[]>) {
    makeObservable(this);
    this.terria = terria;
    this.items = items;

    if (!this.viewerChangeTracker) {
      this.viewerChangeTracker = reaction(
        () => this.currentViewer,
        () => {
          this.afterViewerChanged.raiseEvent();
        }
      );
    }
  }

  get attached(): boolean {
    return this.mapContainer !== undefined;
  }

  private _lastViewer: GlobeOrMap | undefined;

  viewerChangeTracker: IReactionDisposer | undefined = undefined;

  /**
   * Promise for async loading of current `viewerMode`
   * Starts when TerriaViewer is attached to a div and `viewerMode` is set
   */
  @computed
  get viewerLoadPromise(): Promise<void> {
    return Promise.resolve(this._currentViewerConstructorPromise).then(
      () => {}
    );
  }

  /**
   * Get a mobx-utils promise to a constructor for currentViewer. Start loading
   * Leaflet or Cesium depending on `viewerMode` if attached to a div
   */
  @computed
  get _currentViewerConstructorPromise() {
    let viewerFromPromise: IPromiseBasedObservable<
      new (
        terriaViewer: TerriaViewer,
        container: string | HTMLElement
      ) => GlobeOrMap
    > = fromPromise.resolve(NoViewer) as IPromiseBasedObservable<
      typeof NoViewer
    >;
    if (this.attached && this.viewerMode === ViewerMode.Leaflet) {
      viewerFromPromise = leafletFromPromise.get();
    } else if (this.attached && this.viewerMode === ViewerMode.Cesium) {
      viewerFromPromise = cesiumFromPromise.get();
    } else if (this.attached && this.viewerMode === ViewerMode.Cesium2D) {
      viewerFromPromise = cesium2dFromPromise.get();
    }
    return viewerFromPromise;
  }

  @computed({
    keepAlive: true
  })
  get currentViewer(): GlobeOrMap {
    // Use untracked on everything to ensure the viewer isn't recreated
    //  except when the viewer is required to change, the currently required
    //  viewer class finishes loading from an async chunk or the map container
    //  is changed

    const currentView = untracked(() => this.destroyCurrentViewer());

    let newViewer: GlobeOrMap;
    try {
      // If a div is attached and a viewer is ready, use it
      if (
        this.attached &&
        this._currentViewerConstructorPromise.state === FULFILLED
      ) {
        const SomeViewer = this._currentViewerConstructorPromise.value;
        newViewer = untracked(() => new SomeViewer(this, this.mapContainer!));
      } else {
        newViewer = untracked(() => new NoViewer(this));
      }
    } catch (error) {
      // Switch viewerMode inside computed. Could change viewers to
      //  guarantee no throw in constructor and instead have a `start()`
      //  method that can throw. Then call that `start()` method inside
      //  a reaction (reaction would also deal with viewer fallback).
      // Using this approach might remove the need for `untracked`
      setTimeout(
        action(() => {
          this.terria.raiseErrorToUser(error);
          this.viewerMode =
            this.viewerMode === ViewerMode.Cesium
              ? ViewerMode.Leaflet
              : undefined;
        }),
        0
      );
      newViewer = untracked(() => new NoViewer(this));
    }

    this._lastViewer = newViewer;
    newViewer.zoomTo(currentView || untracked(() => this.homeCamera), 0.0);

    return newViewer;
  }

  // Pull out attaching logic into it's own step. This allows constructing a TerriaViewer
  // before its UI element is mounted in React to set basemap, items, viewermode
  @action
  attach(mapContainer?: string | HTMLElement) {
    this.mapContainer = mapContainer;
  }

  @action
  detach() {
    // Detach from a container
    this.mapContainer = undefined;
    this.destroyCurrentViewer();
  }

  destroy() {
    this.detach();
  }

  private destroyCurrentViewer() {
    let currentView: CameraView | undefined;
    if (this._lastViewer !== undefined) {
      this.beforeViewerChanged.raiseEvent();
      currentView = this._lastViewer.getCurrentCameraView();
      this._lastViewer.destroy();
      this._lastViewer = undefined;
    }
    return currentView;
  }
}
