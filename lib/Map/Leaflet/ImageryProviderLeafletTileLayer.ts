import i18next from "i18next";
import L, { TileEvent } from "leaflet";
import {
  autorun,
  computed,
  IReactionDisposer,
  observable,
  makeObservable
} from "mobx";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import CesiumCredit from "terriajs-cesium/Source/Core/Credit";
import defined from "terriajs-cesium/Source/Core/defined";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import TileProviderError from "terriajs-cesium/Source/Core/TileProviderError";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import SplitDirection from "terriajs-cesium/Source/Scene/SplitDirection";
import isDefined from "../../Core/isDefined";
import TerriaError from "../../Core/TerriaError";
import Leaflet from "../../Models/Leaflet";
import getUrlForImageryTile from "../ImageryProvider/getUrlForImageryTile";
import { ProviderCoords } from "../PickedFeatures/PickedFeatures";

const swScratch = new Cartographic();
const neScratch = new Cartographic();
const swTileCoordinatesScratch = new Cartesian2();
const neTileCoordinatesScratch = new Cartesian2();

class Credit extends CesiumCredit {
  _shownInLeaflet?: boolean;
  _shownInLeafletLastUpdate?: boolean;
}

export default class ImageryProviderLeafletTileLayer extends L.TileLayer {
  readonly tileSize = 256;
  readonly errorEvent = new CesiumEvent();

  private initialized = false;
  private _usable = false;
  private _delayedUpdate?: number;
  private _zSubtract = 0;
  private _requestImageError: TileProviderError | undefined;
  private _previousCredits: Credit[] = [];
  private _leafletUpdateInterval: number;

  @observable splitDirection = SplitDirection.NONE;
  @observable splitPosition: number = 0.5;

  constructor(
    private leaflet: Leaflet,
    readonly imageryProvider: ImageryProvider,
    options: L.TileLayerOptions = {}
  ) {
    super(undefined as any, {
      ...options,
      updateInterval: defined((imageryProvider as any)._leafletUpdateInterval)
        ? (imageryProvider as any)._leafletUpdateInterval
        : 100
    });
    makeObservable(this);
    this.imageryProvider = imageryProvider;

    // Handle splitter rection (and disposing reaction)
    let disposeSplitterReaction: IReactionDisposer | undefined;
    this.on("add", () => {
      if (!disposeSplitterReaction) {
        disposeSplitterReaction = this._reactToSplitterChange();
      }
    });
    this.on("remove", () => {
      if (disposeSplitterReaction) {
        disposeSplitterReaction();
        disposeSplitterReaction = undefined;
      }
    });

    this._leafletUpdateInterval = defined(
      (imageryProvider as any)._leafletUpdateInterval
    )
      ? (imageryProvider as any)._leafletUpdateInterval
      : 100;

    // Hack to fix "Space between tiles on fractional zoom levels in Webkit browsers" (https://github.com/Leaflet/Leaflet/issues/3575#issuecomment-688644225)
    this.on("tileloadstart", (event: TileEvent) => {
      event.tile.style.width = this.getTileSize().x + 0.5 + "px";
      event.tile.style.height = this.getTileSize().y + 0.5 + "px";
    });
  }

  _reactToSplitterChange() {
    return autorun(() => {
      const container = this.getContainer();
      if (container === null) {
        return;
      }

      if (this.splitDirection === SplitDirection.LEFT) {
        const { left: clipLeft } = this._clipsForSplitter;
        container.style.clip = clipLeft;
      } else if (this.splitDirection === SplitDirection.RIGHT) {
        const { right: clipRight } = this._clipsForSplitter;
        container.style.clip = clipRight;
      } else {
        container.style.clip = "auto";
      }
    });
  }

  @computed
  get _clipsForSplitter() {
    let clipLeft = "";
    let clipRight = "";
    let clipPositionWithinMap;
    let clipX;

    if (this.leaflet.size && this.leaflet.nw && this.leaflet.se) {
      clipPositionWithinMap = this.leaflet.size.x * this.splitPosition;
      clipX = Math.round(this.leaflet.nw.x + clipPositionWithinMap);
      clipLeft =
        "rect(" +
        [this.leaflet.nw.y, clipX, this.leaflet.se.y, this.leaflet.nw.x].join(
          "px,"
        ) +
        "px)";
      clipRight =
        "rect(" +
        [this.leaflet.nw.y, this.leaflet.se.x, this.leaflet.se.y, clipX].join(
          "px,"
        ) +
        "px)";
    }
    return {
      left: clipLeft,
      right: clipRight,
      clipPositionWithinMap: clipPositionWithinMap,
      clipX: clipX
    };
  }

  _tileOnError(_done: unknown, _tile: unknown, _e: unknown) {
    // Do nothing, we'll handle tile errors separately.
  }

  createTile(coords: L.Coords, done: L.DoneCallback) {
    // Create a tile (Image) as normal.
    const tile = super.createTile(coords, done) as HTMLImageElement;

    // By default, Leaflet handles tile load errors by setting the Image to the error URL and raising
    // an error event.  We want to first raise an error event that optionally returns a promise and
    // retries after the promise resolves.

    const _doRequest = (waitPromise?: any) => {
      if (waitPromise) {
        waitPromise
          .then(function () {
            _doRequest();
          })
          .catch((e: unknown) => {
            // The tile has failed irrecoverably, so invoke Leaflet's standard
            // tile error handler.
            (L.TileLayer as any).prototype._tileOnError.call(
              this,
              done,
              tile,
              e
            );
          });
        return;
      }

      // Setting src will trigger a new load or error event, even if the
      // new src is the same as the old one.
      const tileUrl = this.getTileUrl(coords);
      if (isDefined(tileUrl)) {
        tile.src = tileUrl;
      }
    };

    L.DomEvent.on(tile, "error", (e) => {
      const level = (this as any)._getLevelFromZ(coords);
      const message = i18next.t("map.cesium.failedToObtain", {
        x: coords.x,
        y: coords.y,
        level: level
      });
      this._requestImageError = TileProviderError.reportError(
        this._requestImageError!, // TODO: Cesium type definitions incorrectly forbid undefined
        this.imageryProvider,
        this.imageryProvider.errorEvent,
        message,
        coords.x,
        coords.y,
        level,
        e as any
        // TODO: bring terriajs-cesium retry logic to cesium
        //doRequest
      );
    });

    return tile;
  }

  getTileUrl(tilePoint: L.Coords): string {
    const level = this._getLevelFromZ(tilePoint);
    const errorTileUrl = this.options.errorTileUrl || "";
    if (level < 0) {
      return errorTileUrl;
    }

    return (
      getUrlForImageryTile(
        this.imageryProvider,
        tilePoint.x,
        tilePoint.y,
        level
      ) || errorTileUrl
    );
  }

  _getLevelFromZ(tilePoint: L.Coords) {
    return tilePoint.z - this._zSubtract;
  }

  _update(...args: unknown[]) {
    if (!this.initialized) {
      this.initialized = true;

      // Cancel the existing delayed update, if any.
      if (this._delayedUpdate) {
        clearTimeout(this._delayedUpdate);
        this._delayedUpdate = undefined;
      }

      this._delayedUpdate = setTimeout(() => {
        this._delayedUpdate = undefined;

        // If we're no longer attached to a map, do nothing.
        if (!this._map) {
          return;
        }

        const tilingScheme = this.imageryProvider.tilingScheme;
        if (!(tilingScheme instanceof WebMercatorTilingScheme)) {
          this.errorEvent.raiseEvent(
            this,
            i18next.t("map.cesium.notWebMercatorTilingScheme")
          );
          return;
        }

        if (
          tilingScheme.getNumberOfXTilesAtLevel(0) === 2 &&
          tilingScheme.getNumberOfYTilesAtLevel(0) === 2
        ) {
          this._zSubtract = 1;
        } else if (
          tilingScheme.getNumberOfXTilesAtLevel(0) !== 1 ||
          tilingScheme.getNumberOfYTilesAtLevel(0) !== 1
        ) {
          this.errorEvent.raiseEvent(
            this,
            i18next.t("map.cesium.unusalTilingScheme")
          );
          return;
        }

        if (isDefined(this.imageryProvider.maximumLevel)) {
          this.options.maxNativeZoom = this.imageryProvider.maximumLevel;
        }

        if (defined(this.imageryProvider.minimumLevel)) {
          this.options.minNativeZoom = this.imageryProvider.minimumLevel;
        }

        if (isDefined(this.imageryProvider.credit)) {
          (this._map as any).attributionControl.addAttribution(
            getCreditHtml(this.imageryProvider.credit)
          );
        }

        this._usable = true;

        this._update();
      }, this._leafletUpdateInterval) as any;
    }

    if (this._usable) {
      (L.TileLayer as any).prototype._update.apply(this, args);

      this._updateAttribution();
    }
  }

  _updateAttribution() {
    if (!this._usable || !isDefined(this.imageryProvider.getTileCredits)) {
      return;
    }

    for (let i = 0; i < this._previousCredits.length; ++i) {
      this._previousCredits[i]._shownInLeafletLastUpdate =
        this._previousCredits[i]._shownInLeaflet;
      this._previousCredits[i]._shownInLeaflet = false;
    }

    const bounds = this._map.getBounds();
    const zoom = this._map.getZoom() - this._zSubtract;

    const tilingScheme = this.imageryProvider.tilingScheme;

    swScratch.longitude = Math.max(
      CesiumMath.negativePiToPi(CesiumMath.toRadians(bounds.getWest())),
      tilingScheme.rectangle.west
    );
    swScratch.latitude = Math.max(
      CesiumMath.toRadians(bounds.getSouth()),
      tilingScheme.rectangle.south
    );
    let sw = tilingScheme.positionToTileXY(
      swScratch,
      zoom,
      swTileCoordinatesScratch
    );
    if (!isDefined(sw)) {
      sw = swTileCoordinatesScratch;
      sw.x = 0;
      sw.y = tilingScheme.getNumberOfYTilesAtLevel(zoom) - 1;
    }

    neScratch.longitude = Math.min(
      CesiumMath.negativePiToPi(CesiumMath.toRadians(bounds.getEast())),
      tilingScheme.rectangle.east
    );
    neScratch.latitude = Math.min(
      CesiumMath.toRadians(bounds.getNorth()),
      tilingScheme.rectangle.north
    );
    let ne = tilingScheme.positionToTileXY(
      neScratch,
      zoom,
      neTileCoordinatesScratch
    );
    if (!isDefined(ne)) {
      ne = neTileCoordinatesScratch;
      ne.x = tilingScheme.getNumberOfXTilesAtLevel(zoom) - 1;
      ne.y = 0;
    }

    const nextCredits = [];

    for (let j = ne.y; j < sw.y; ++j) {
      for (let i = sw.x; i < ne.x; ++i) {
        const credits = this.imageryProvider.getTileCredits(
          i,
          j,
          zoom
        ) as Credit[];
        if (!defined(credits)) {
          continue;
        }

        for (let k = 0; k < credits.length; ++k) {
          const credit = credits[k];
          if (credit._shownInLeaflet) {
            continue;
          }

          credit._shownInLeaflet = true;
          nextCredits.push(credit);

          if (!credit._shownInLeafletLastUpdate) {
            (this._map as any).attributionControl.addAttribution(
              getCreditHtml(credit)
            );
          }
        }
      }
    }

    // Remove attributions that applied last update but not this one.
    for (let i = 0; i < this._previousCredits.length; ++i) {
      if (!this._previousCredits[i]._shownInLeaflet) {
        (this._map as any).attributionControl.removeAttribution(
          getCreditHtml(this._previousCredits[i])
        );
        this._previousCredits[i]._shownInLeafletLastUpdate = false;
      }
    }

    this._previousCredits = nextCredits;
  }

  getFeaturePickingCoords(
    map: L.Map,
    longitudeRadians: number,
    latitudeRadians: number
  ): Promise<ProviderCoords> {
    const ll = new Cartographic(
      CesiumMath.negativePiToPi(longitudeRadians),
      latitudeRadians,
      0.0
    );
    const level = Math.round(map.getZoom());

    const tilingScheme = this.imageryProvider.tilingScheme;
    const coords = tilingScheme.positionToTileXY(ll, level);
    return Promise.resolve({
      x: coords.x,
      y: coords.y,
      level: level
    });
  }

  async pickFeatures(
    x: number,
    y: number,
    level: number,
    longitudeRadians: number,
    latitudeRadians: number
  ): Promise<ImageryLayerFeatureInfo[] | undefined> {
    try {
      return await this.imageryProvider.pickFeatures(
        x,
        y,
        level,
        longitudeRadians,
        latitudeRadians
      );
    } catch (e) {
      TerriaError.from(
        e,
        `An error ocurred while calling \`ImageryProvider#.pickFeatures\`. \`ImageryProvider.url = ${
          (this.imageryProvider as any).url
        }\``
      ).log();
    }
  }

  onRemove(map: L.Map) {
    if (this._delayedUpdate) {
      clearTimeout(this._delayedUpdate);
      this._delayedUpdate = undefined;
    }

    for (let i = 0; i < this._previousCredits.length; ++i) {
      this._previousCredits[i]._shownInLeafletLastUpdate = false;
      this._previousCredits[i]._shownInLeaflet = false;
      (map as any).attributionControl.removeAttribution(
        getCreditHtml(this._previousCredits[i])
      );
    }

    if (this._usable && defined(this.imageryProvider.credit)) {
      (map as any).attributionControl.removeAttribution(
        getCreditHtml(this.imageryProvider.credit)
      );
    }

    L.TileLayer.prototype.onRemove.apply(this, [map]);

    // Check that this cancels tile requests when dragging the time slider and rapidly creating
    // and destroying layers.  If the image requests for previous times/layers are allowed to hang
    // around, they clog up the pipeline and it takes approximately forever for the browser
    // to get around to downloading the tiles that are actually needed.
    this._abortLoading();
    return this;
  }
}

function getCreditHtml(credit: Credit) {
  return credit.element.outerHTML;
}
