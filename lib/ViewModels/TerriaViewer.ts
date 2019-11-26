import {
  computed,
  IComputedValue,
  IObservableValue,
  observable,
  action,
  runInAction
} from "mobx";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import CameraView from "../Models/CameraView";
import GlobeOrMap from "../Models/GlobeOrMap";
import Mappable from "../Models/Mappable";
import NoViewer from "../Models/NoViewer";
import Terria from "../Models/Terria";
import ViewerMode from "../Models/ViewerMode";

// A class that deals with initialising, destroying and switching between viewers
// Each map-view should have it's own TerriaViewer

// Viewer options. Designed to be easily serialisable
interface ViewerOptions {
  useTerrain: boolean;
  [key: string]: string | number | boolean;
}

const viewerOptionsDefaults: ViewerOptions = {
  useTerrain: true
};

export default class TerriaViewer {
  readonly terria: Terria;

  @observable
  baseMap: Mappable | undefined;

  // This is a "view" of a workbench/other
  readonly items: IComputedValue<Mappable[]> | IObservableValue<Mappable[]>;

  @observable
  viewerMode: ViewerMode | undefined = ViewerMode.Cesium;

  // Set by UI
  @observable
  viewerOptions: ViewerOptions = viewerOptionsDefaults;

  // Disable all mouse (& keyboard) interaction
  @observable
  disableInteraction: boolean = false;

  @observable
  homeCamera: CameraView = new CameraView(Rectangle.MAX_VALUE);

  @observable
  mapContainer: string | HTMLElement | undefined;

  /**
   * Is the user using the keyboard to interact with the app?
   */
  @observable keyboardInterfaceModeActive = false;

  // TODO: hook these up
  readonly beforeViewerChanged = new CesiumEvent();
  readonly afterViewerChanged = new CesiumEvent();

  constructor(terria: Terria, items: IComputedValue<Mappable[]>) {
    this.terria = terria;
    this.items = items;
  }

  @computed
  get attached(): boolean {
    return this.mapContainer !== undefined;
  }

  private _lastViewer: GlobeOrMap | undefined;

  @computed({
    keepAlive: true
  })
  get currentViewer(): GlobeOrMap {
    const currentView = this.destroyCurrentViewer();

    const viewerMode = this.attached ? this.viewerMode : undefined;
    console.log(`Creating a viewer: ${viewerMode}`);

    let newViewer: GlobeOrMap;
    if (this.mapContainer && viewerMode === ViewerMode.Leaflet) {
      const Leaflet = this._getLeafletIfLoaded();
      newViewer = new Leaflet(this, this.mapContainer);
    } else if (this.mapContainer && viewerMode === ViewerMode.Cesium) {
      const Cesium = this._getCesiumIfLoaded();
      newViewer = new Cesium(this, this.mapContainer);
    } else {
      newViewer = new NoViewer(this);
    }

    this._lastViewer = newViewer;

    newViewer.zoomTo(currentView || this.homeCamera, 0.0);

    return newViewer;
  }

  @observable
  private _Cesium: typeof import("../Models/Cesium").default | undefined;
  private _cesiumPromise: Promise<void> | undefined;

  private _getCesiumIfLoaded() {
    if (this._Cesium) {
      return this._Cesium;
    } else {
      if (!this._cesiumPromise) {
        this._cesiumPromise = import("../Models/Cesium").then(Cesium => {
          runInAction(() => {
            this._Cesium = Cesium.default;
          });
        });
      }
      return NoViewer;
    }
  }

  @observable
  private _Leaflet: typeof import("../Models/Leaflet").default | undefined;
  private _leafletPromise: Promise<void> | undefined;

  private _getLeafletIfLoaded() {
    if (this._Leaflet) {
      return this._Leaflet;
    } else {
      if (!this._leafletPromise) {
        this._leafletPromise = import("../Models/Leaflet").then(Leaflet => {
          runInAction(() => {
            this._Leaflet = Leaflet.default;
          });
        });
      }
      return NoViewer;
    }
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

  private destroyCurrentViewer() {
    let currentView: CameraView | undefined;
    if (this._lastViewer !== undefined) {
      console.log(`Destroying a viewer`);
      currentView = this._lastViewer.getCurrentCameraView();
      this._lastViewer.destroy();
      this._lastViewer = undefined;
    }
    return currentView;
  }
}
