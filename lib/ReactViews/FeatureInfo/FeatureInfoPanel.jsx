"use strict";

import defined from "terriajs-cesium/Source/Core/defined";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import FeatureInfoCatalogItem from "./FeatureInfoCatalogItem";
import { featureBelongsToCatalogItem } from "../../Map/PickedFeatures.ts";
import DragWrapper from "../DragWrapper";
import Loader from "../Loader";
import { Component } from "react";
import PropTypes from "prop-types";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import { withTranslation } from "react-i18next";
import Icon from "../../Styled/Icon";
import {
  LOCATION_MARKER_DATA_SOURCE_NAME,
  addMarker,
  removeMarker,
  isMarkerVisible
} from "../../Models/LocationMarkerUtils";
import prettifyCoordinates from "../../Map/prettifyCoordinates";
import i18next from "i18next";
import Styles from "./feature-info-panel.scss";
import classNames from "classnames";
import { observer, disposeOnUnmount } from "mobx-react";
import { action, reaction, runInAction } from "mobx";

@observer
class FeatureInfoPanel extends Component {
  static propTypes = {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    printView: PropTypes.bool,
    t: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      left: null,
      right: null,
      top: null,
      bottom: null
    };
  }

  componentDidMount() {
    const { t } = this.props;
    const createFakeSelectedFeatureDuringPicking = true;
    const terria = this.props.terria;
    disposeOnUnmount(
      this,
      reaction(
        () => terria.pickedFeatures,
        pickedFeatures => {
          if (!defined(pickedFeatures)) {
            terria.selectedFeature = undefined;
          } else {
            if (createFakeSelectedFeatureDuringPicking) {
              const fakeFeature = new Entity({
                id: t("featureInfo.pickLocation")
              });
              fakeFeature.position = pickedFeatures.pickPosition;
              terria.selectedFeature = fakeFeature;
            } else {
              terria.selectedFeature = undefined;
            }
            if (defined(pickedFeatures.allFeaturesAvailablePromise)) {
              pickedFeatures.allFeaturesAvailablePromise.then(() => {
                if (this.props.viewState.featureInfoPanelIsVisible === false) {
                  // Panel is closed, refrain from setting selectedFeature
                  return;
                }

                // We only show features that are associated with a catalog item, so make sure the one we select to be
                // open initially is one we're actually going to show.
                const featuresShownAtAll = pickedFeatures.features.filter(x =>
                  defined(determineCatalogItem(terria.workbench, x))
                );
                let selectedFeature = featuresShownAtAll.filter(
                  featureHasInfo
                )[0];
                if (
                  !defined(selectedFeature) &&
                  featuresShownAtAll.length > 0
                ) {
                  // Handles the case when no features have info - still want something to be open.
                  selectedFeature = featuresShownAtAll[0];
                }
                runInAction(() => {
                  terria.selectedFeature = selectedFeature;
                });
              });
            }
          }
        }
      )
    );
  }

  renderFeatureInfoCatalogItems(catalogItems, featureCatalogItemPairs) {
    return catalogItems
      .filter(catalogItem => defined(catalogItem))
      .map((catalogItem, i) => {
        // From the pairs, select only those with this catalog item, and pull the features out of the pair objects.
        const features = featureCatalogItemPairs
          .filter(pair => pair.catalogItem === catalogItem)
          .map(pair => pair.feature);
        return (
          <FeatureInfoCatalogItem
            key={i}
            viewState={this.props.viewState}
            catalogItem={catalogItem}
            features={features}
            terria={this.props.terria}
            onToggleOpen={this.toggleOpenFeature}
            printView={this.props.printView}
          />
        );
      });
  }

  @action.bound
  close() {
    this.props.viewState.featureInfoPanelIsVisible = false;

    // give the close animation time to finish before unselecting, to avoid jumpiness
    setTimeout(
      action(() => {
        this.props.terria.pickedFeatures = undefined;
        this.props.terria.selectedFeature = undefined;
      }),
      200
    );
  }

  @action.bound
  toggleCollapsed(event) {
    this.props.viewState.featureInfoPanelIsCollapsed = !this.props.viewState
      .featureInfoPanelIsCollapsed;
  }

  @action.bound
  toggleOpenFeature(feature) {
    const terria = this.props.terria;
    if (feature === terria.selectedFeature) {
      terria.selectedFeature = undefined;
    } else {
      terria.selectedFeature = feature;
    }
  }

  getMessageForNoResults() {
    const { t } = this.props;
    if (this.props.terria.workbench.items.length > 0) {
      // feature info shows up becuase data has been added for the first time
      if (this.props.viewState.firstTimeAddingData) {
        runInAction(() => {
          this.props.viewState.firstTimeAddingData = false;
        });
        return t("featureInfo.clickMap");
      }
      // if clicking on somewhere that has no data
      return t("featureInfo.noDataAvailable");
    } else {
      return t("featureInfo.clickToAddData");
    }
  }

  addManualMarker(longitude, latitude) {
    const { t } = this.props;
    addMarker(this.props.terria, {
      name: t("featureInfo.userSelection"),
      location: {
        latitude: latitude,
        longitude: longitude
      }
    });
  }

  pinClicked(longitude, latitude) {
    if (!isMarkerVisible(this.props.terria)) {
      this.addManualMarker(longitude, latitude);
    } else {
      removeMarker(this.props.terria);
    }
  }

  // locationUpdated(longitude, latitude) {
  //   if (
  //     defined(latitude) &&
  //     defined(longitude) &&
  //     isMarkerVisible(this.props.terria)
  //   ) {
  //     removeMarker(this.props.terria);
  //     this.addManualMarker(longitude, latitude);
  //   }
  // }

  filterIntervalsByFeature(catalogItem, feature) {
    try {
      catalogItem.setTimeFilterFeature(
        feature,
        this.props.terria.pickedFeatures
      );
    } catch (e) {
      this.props.terria.raiseErrorToUser(e);
    }
  }

  renderLocationItem(cartesianPosition) {
    const cartographic = Ellipsoid.WGS84.cartesianToCartographic(
      cartesianPosition
    );
    if (cartographic === undefined) {
      return <></>;
    }
    const latitude = CesiumMath.toDegrees(cartographic.latitude);
    const longitude = CesiumMath.toDegrees(cartographic.longitude);
    const pretty = prettifyCoordinates(longitude, latitude);
    // this.locationUpdated(longitude, latitude);

    const that = this;
    const pinClicked = function() {
      that.pinClicked(longitude, latitude);
    };

    const locationButtonStyle = isMarkerVisible(this.props.terria)
      ? Styles.btnLocationSelected
      : Styles.btnLocation;

    return (
      <div className={Styles.location}>
        <span>Lat / Lon&nbsp;</span>
        <span>
          {pretty.latitude + ", " + pretty.longitude}
          {!this.props.printView && (
            <button
              type="button"
              onClick={pinClicked}
              className={locationButtonStyle}
            >
              <Icon glyph={Icon.GLYPHS.location} />
            </button>
          )}
        </span>
      </div>
    );
  }

  render() {
    const { t } = this.props;
    const terria = this.props.terria;
    const viewState = this.props.viewState;

    const {
      catalogItems,
      featureCatalogItemPairs
    } = getFeaturesGroupedByCatalogItems(this.props.terria);
    const featureInfoCatalogItems = this.renderFeatureInfoCatalogItems(
      catalogItems,
      featureCatalogItemPairs
    );
    const panelClassName = classNames(Styles.panel, {
      [Styles.isCollapsed]: viewState.featureInfoPanelIsCollapsed,
      [Styles.isVisible]: viewState.featureInfoPanelIsVisible,
      [Styles.isTranslucent]: viewState.explorerPanelIsVisible
    });

    const filterableCatalogItems = catalogItems
      .filter(
        catalogItem =>
          defined(catalogItem) && catalogItem.canFilterTimeByFeature
      )
      .map(catalogItem => {
        const features = featureCatalogItemPairs.filter(
          pair => pair.catalogItem === catalogItem
        );
        return {
          catalogItem: catalogItem,
          feature: defined(features[0]) ? features[0].feature : undefined
        };
      })
      .filter(pair => defined(pair.feature));

    let position;
    if (
      defined(terria.selectedFeature) &&
      defined(terria.selectedFeature.position)
    ) {
      // If the clock is avaliable then use it, otherwise don't.
      const clock = terria.timelineClock?.currentTime;

      // If there is a selected feature then use the feature location.
      position = terria.selectedFeature.position.getValue(clock);
      if (position === undefined) {
        // For discretely time varying features, we'll only have values for integer values of clock
        position = terria.selectedFeature.position.getValue(Math.floor(clock));
      }

      // If position is invalid then don't use it.
      // This seems to be fixing the symptom rather then the cause, but don't know what is the true cause this ATM.
      if (
        position === undefined ||
        isNaN(position.x) ||
        isNaN(position.y) ||
        isNaN(position.z)
      ) {
        position = undefined;
      }
    }
    if (!defined(position)) {
      // Otherwise use the location picked.
      if (
        defined(terria.pickedFeatures) &&
        defined(terria.pickedFeatures.pickPosition)
      ) {
        position = terria.pickedFeatures.pickPosition;
      }
    }

    const locationElements = (
      <If condition={position}>
        <li>{this.renderLocationItem(position)}</li>
      </If>
    );
    return (
      <DragWrapper>
        <div
          className={panelClassName}
          aria-hidden={!viewState.featureInfoPanelIsVisible}
        >
          {!this.props.printView && (
            <div className={Styles.header}>
              <div
                className={classNames("drag-handle", Styles.btnPanelHeading)}
              >
                <span>{t("featureInfo.panelHeading")}</span>
                <button
                  type="button"
                  onClick={this.toggleCollapsed}
                  className={Styles.btnToggleFeature}
                >
                  {this.props.viewState.featureInfoPanelIsCollapsed ? (
                    <Icon glyph={Icon.GLYPHS.closed} />
                  ) : (
                    <Icon glyph={Icon.GLYPHS.opened} />
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={this.close}
                className={Styles.btnCloseFeature}
                title={t("featureInfo.btnCloseFeature")}
              >
                <Icon glyph={Icon.GLYPHS.close} />
              </button>
            </div>
          )}
          <ul className={Styles.body}>
            {this.props.printView && locationElements}
            <Choose>
              <When
                condition={
                  viewState.featureInfoPanelIsCollapsed ||
                  !viewState.featureInfoPanelIsVisible
                }
              />
              <When
                condition={
                  defined(terria.pickedFeatures) &&
                  terria.pickedFeatures.isLoading
                }
              >
                <li>
                  <Loader />
                </li>
              </When>
              <When
                condition={
                  !featureInfoCatalogItems ||
                  featureInfoCatalogItems.length === 0
                }
              >
                <li className={Styles.noResults}>
                  {this.getMessageForNoResults()}
                </li>
              </When>
              <Otherwise>{featureInfoCatalogItems}</Otherwise>
            </Choose>
            {!this.props.printView && locationElements}
            {filterableCatalogItems.map(pair => (
              <button
                key={pair.catalogItem.id}
                type="button"
                onClick={this.filterIntervalsByFeature.bind(
                  this,
                  pair.catalogItem,
                  pair.feature
                )}
                className={Styles.satelliteSuggestionBtn}
              >
                {t("featureInfo.satelliteSuggestionBtn", {
                  catalogItemName: pair.catalogItem.name
                })}
              </button>
            ))}
          </ul>
        </div>
      </DragWrapper>
    );
  }
}

/**
 * Returns an object of {catalogItems, featureCatalogItemPairs}.
 */
function getFeaturesGroupedByCatalogItems(terria) {
  if (!defined(terria.pickedFeatures)) {
    return { catalogItems: [], featureCatalogItemPairs: [] };
  }
  const features = terria.pickedFeatures.features;
  const featureCatalogItemPairs = []; // Will contain objects of {feature, catalogItem}.
  const catalogItems = []; // Will contain a list of all unique catalog items.

  features.forEach(feature => {
    // Why was this here? Surely changing the feature objects is not a good side-effect?
    // if (!defined(feature.position)) {
    //     feature.position = terria.pickedFeatures.pickPosition;
    // }
    const catalogItem = determineCatalogItem(terria.workbench, feature);
    featureCatalogItemPairs.push({
      catalogItem: catalogItem,
      feature: feature
    });
    if (catalogItems.indexOf(catalogItem) === -1) {
      // Note this works for undefined too.
      catalogItems.push(catalogItem);
    }
  });

  return { catalogItems, featureCatalogItemPairs };
}

export function determineCatalogItem(workbench, feature) {
  // If the feature is a marker return a fake item
  if (feature.entityCollection && feature.entityCollection.owner) {
    const dataSource = feature.entityCollection.owner;
    if (dataSource.name === LOCATION_MARKER_DATA_SOURCE_NAME) {
      return {
        name: i18next.t("featureInfo.locationMarker")
      };
    }
  }

  if (feature._catalogItem && workbench.items.includes(feature._catalogItem)) {
    return feature._catalogItem;
  }

  // Expand child members of composite catalog items.
  // This ensures features from each child model are treated as belonging to
  // that child model, not the parent composite model.
  const items = workbench.items.map(recurseIntoMembers).reduce(flatten, []);
  return items.find(item => featureBelongsToCatalogItem(feature, item));
}

function recurseIntoMembers(catalogItem) {
  const { memberModels } = catalogItem;
  if (memberModels) {
    return memberModels.map(recurseIntoMembers).reduce(flatten, []);
  }
  return [catalogItem];
}

function flatten(acc, cur) {
  acc.push(...cur);
  return acc;
}

/**
 * Determines whether the passed feature has properties or a description.
 */
function featureHasInfo(feature) {
  return defined(feature.properties) || defined(feature.description);
}
export { FeatureInfoPanel };
export default withTranslation()(FeatureInfoPanel);
