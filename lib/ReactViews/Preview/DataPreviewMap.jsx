"use strict";
import classNames from "classnames";
import {
  action,
  autorun,
  computed,
  observable,
  runInAction,
  makeObservable
} from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import { Component } from "react";
import { withTranslation } from "react-i18next";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import filterOutUndefined from "../../Core/filterOutUndefined";
import MappableMixin, { ImageryParts } from "../../ModelMixins/MappableMixin";
import CommonStrata from "../../Models/Definition/CommonStrata";
import CreateModel from "../../Models/Definition/CreateModel";
import GeoJsonCatalogItem from "../../Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import ViewerMode from "../../Models/ViewerMode";
import MappableTraits from "../../Traits/TraitsClasses/MappableTraits";
import TerriaViewer from "../../ViewModels/TerriaViewer";
import Styles from "./data-preview-map.scss";

class AdaptForPreviewMap extends MappableMixin(CreateModel(MappableTraits)) {
  previewed;

  constructor(...args) {
    super(...args);
    makeObservable(this);
  }

  async forceLoadMapItems() {}

  // Make all imagery 0 or 100% opacity
  @computed
  get mapItems() {
    return (
      this.previewed?.mapItems.map((m) =>
        ImageryParts.is(m)
          ? {
              ...m,
              alpha: m.alpha !== 0.0 ? 1.0 : 0.0,
              show: true
            }
          : m
      ) ?? []
    );
  }
}

/**
 * Leaflet-based preview map that sits within the preview.
 */

/**
 * @typedef {object} Props
 * @prop {Terria} terria
 * @prop {Mappable} previewed
 * @prop {boolean} showMap
 *
 */

// TODO: Can this.props.previewed be undefined?
/**
 *
 * @extends {React.Component<Props>}
 */
@observer
class DataPreviewMap extends Component {
  @observable
  isZoomedToExtent = false;

  /**
   * @type {TerriaViewer}
   * @readonly
   */
  previewViewer;

  static propTypes = {
    terria: PropTypes.object.isRequired,
    previewed: PropTypes.object,
    showMap: PropTypes.bool,
    t: PropTypes.func.isRequired
  };

  @computed
  get previewBadgeState() {
    if (this.props.previewed?.isLoading) return "loading";
    if (
      this.props.previewed?.loadMetadataResult?.error ||
      this.props.previewed?.loadMapItemsResult?.error
    )
      return "dataPreviewError";
    if (this.props.previewed?.mapItems?.length === 0)
      return "noPreviewAvailable";

    return "dataPreview";
  }

  constructor(props) {
    super(props);

    makeObservable(this);

    /**
     * @param {HTMLElement | null} container
     */
    this.containerRef = action((container) => {
      if (this.previewViewer.attached) {
        this.previewViewer.detach();
      }
      if (container !== null) {
        this.initPreview(container);
      }
    });
    this.previewViewer = new TerriaViewer(
      this.props.terria,
      computed(() => {
        const previewItem = new AdaptForPreviewMap();
        previewItem.previewed = this.props.previewed;
        // Can previewed be undefined?
        return filterOutUndefined([
          previewItem,
          this.boundingRectangleCatalogItem
        ]);
      })
    );
    runInAction(() => {
      this.previewViewer.viewerMode = ViewerMode.Leaflet;
      this.previewViewer.disableInteraction = true;
      this.previewViewer.homeCamera = this.props.terria.mainViewer.homeCamera;
    });
    // Not yet implemented
    // previewViewer.hideTerriaLogo = true;
    // previewViewer.homeView = terria.homeView;
    // previewViewer.initialView = terria.homeView;
  }

  /**
   * @param {HTMLElement} container
   */
  @action
  initPreview(container) {
    console.log(
      "Initialising preview map. This might be expensive, so this should only show up when the preview map disappears and reappears"
    );
    this.isZoomedToExtent = false;
    const baseMapItems = this.props.terria.baseMapsModel.baseMapItems;
    // Find preview basemap using `terria.previewBaseMapId`
    const initPreviewBaseMap = baseMapItems.find(
      (baseMap) =>
        baseMap.item.uniqueId ===
        this.props.terria.baseMapsModel.previewBaseMapId
    );
    if (initPreviewBaseMap !== undefined) {
      this.previewViewer.setBaseMap(initPreviewBaseMap.item);
    } else {
      this.previewViewer.setBaseMap(
        baseMapItems.length > 0 ? baseMapItems[0].item : undefined
      );
    }

    this.previewViewer.attach(container);

    this._disposeZoomToExtentSubscription = autorun(() => {
      if (this.isZoomedToExtent) {
        this.previewViewer.currentViewer.zoomTo(this.props.previewed);
      } else {
        this.previewViewer.currentViewer.zoomTo(this.previewViewer.homeCamera);
      }
    });
  }

  componentWillUnmount() {
    if (this._disposeZoomToExtentSubscription) {
      this._disposeZoomToExtentSubscription();
    }
    this.previewViewer.detach();

    if (this._unsubscribeErrorHandler) {
      this._unsubscribeErrorHandler();
      this._unsubscribeErrorHandler = undefined;
    }
  }

  @computed
  get boundingRectangleCatalogItem() {
    const rectangle = this.props.previewed.rectangle;
    if (rectangle === undefined) {
      return undefined;
    }

    let west = rectangle.west;
    let south = rectangle.south;
    let east = rectangle.east;
    let north = rectangle.north;

    if (
      west === undefined ||
      south === undefined ||
      east === undefined ||
      north === undefined
    ) {
      return undefined;
    }

    if (!this.isZoomedToExtent) {
      // When zoomed out, make sure the dataset rectangle is at least 5% of the width and height
      // the home view, so that it is actually visible.
      const minimumFraction = 0.05;
      const homeView = this.previewViewer.homeCamera;
      const minimumWidth =
        CesiumMath.toDegrees(homeView.rectangle.width) * minimumFraction;
      if (east - west < minimumWidth) {
        const center = (east + west) * 0.5;
        west = center - minimumWidth * 0.5;
        east = center + minimumWidth * 0.5;
      }

      const minimumHeight =
        CesiumMath.toDegrees(homeView.rectangle.height) * minimumFraction;
      if (north - south < minimumHeight) {
        const center = (north + south) * 0.5;
        south = center - minimumHeight * 0.5;
        north = center + minimumHeight * 0.5;
      }
    }

    const rectangleCatalogItem = new GeoJsonCatalogItem(
      "__preview-data-extent",
      this.props.terria
    );
    rectangleCatalogItem.setTrait(CommonStrata.user, "geoJsonData", {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            stroke: "#08ABD5",
            "stroke-width": 2,
            "stroke-opacity": 1
          },
          geometry: {
            type: "LineString",
            coordinates: [
              [west, south],
              [west, north],
              [east, north],
              [east, south],
              [west, south]
            ]
          }
        }
      ]
    });
    rectangleCatalogItem.loadMapItems();
    return rectangleCatalogItem;
  }

  @action.bound
  clickMap(_evt) {
    this.isZoomedToExtent = !this.isZoomedToExtent;
  }

  render() {
    const { t } = this.props;
    const previewBadgeLabels = {
      loading: t("preview.loading"),
      noPreviewAvailable: t("preview.noPreviewAvailable"),
      dataPreview: t("preview.dataPreview"),
      dataPreviewError: t("preview.dataPreviewError")
    };
    return (
      <div className={Styles.map} onClick={this.clickMap}>
        {this.props.showMap ? (
          <div
            className={classNames(Styles.terriaPreview)}
            ref={this.containerRef}
          />
        ) : (
          <div
            className={classNames(Styles.terriaPreview, Styles.placeholder)}
          />
        )}
        <label className={Styles.badge}>
          {previewBadgeLabels[this.previewBadgeState]}
        </label>
      </div>
    );
  }
}

export default withTranslation()(DataPreviewMap);
