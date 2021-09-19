"use strict";

import classNames from "classnames";
import { action, runInAction, observable, computed } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import Slider from "rc-slider";
import { Component } from "react";
import { withTranslation } from "react-i18next";
import ImagerySplitDirection from "terriajs-cesium/Source/Scene/ImagerySplitDirection";
import DefaultTimelineModel from "../../../Models/DefaultTimelineModel";
// eslint-disable-next-line no-unused-vars
import Terria from "../../../Models/Terria";
import ViewerMode from "../../../Models/ViewerMode";
// eslint-disable-next-line no-unused-vars
import ViewState from "../../../ReactViewModels/ViewState";
import Icon from "../../../Styled/Icon";
import MenuPanel from "../../StandardUserInterface/customizable/MenuPanel";
// import { provideRef } from "../../HOCs/provideRef";
import withTerriaRef from "../../HOCs/withTerriaRef";
import DropdownStyles from "./panel.scss";
import Styles from "./setting-panel.scss";
// The basemap and viewer setting panel
/**
 * @typedef {object} Props
 * @prop {Terria} terria
 * @prop {ViewState} viewState
 *
 * @extends {React.Component<Props>}
 */

const sides = {
  left: "settingPanel.terrain.left",
  both: "settingPanel.terrain.both",
  right: "settingPanel.terrain.right"
};

@observer
class SettingPanel extends Component {
  static propTypes = {
    terria: PropTypes.object.isRequired,
    refFromHOC: PropTypes.object,
    // allBaseMaps: PropTypes.array,
    viewState: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  };

  /**
   * @param {Props} props
   */
  constructor(props) {
    super(props);
  }

  @observable _hoverBaseMap = null;

  @computed
  get activeMapName() {
    return this._hoverBaseMap
      ? this._hoverBaseMap
      : this.props.terria.mainViewer.baseMap
      ? this.props.terria.mainViewer.baseMap.name
      : "(None)";
  }

  selectBaseMap(baseMap, event) {
    event.stopPropagation();
    this.props.terria.mainViewer.setBaseMap(baseMap);
    // this.props.terria.baseMapContrastColor = baseMap.contrastColor;

    // We store the user's chosen basemap for future use, but it's up to the instance to decide
    // whether to use that at start up.
    if (baseMap) {
      const baseMapId = baseMap.uniqueId;
      if (baseMapId) {
        this.props.terria.setLocalProperty("basemap", baseMapId);
      }
    }
  }

  mouseEnterBaseMap(baseMap) {
    runInAction(() => {
      this._hoverBaseMap = baseMap.item.name;
    });
  }

  mouseLeaveBaseMap() {
    runInAction(() => {
      this._hoverBaseMap = null;
    });
  }

  @action
  selectViewer(viewer, event) {
    const mainViewer = this.props.terria.mainViewer;
    event.stopPropagation();
    if (viewer === "3d" || viewer === "3dsmooth") {
      mainViewer.viewerMode = "cesium";
      mainViewer.viewerOptions.useTerrain = viewer === "3d";
    } else if (viewer === "2d") {
      mainViewer.viewerMode = "leaflet";
    } else {
      console.error(`Trying to select ViewerMode ${viewer} that doesn't exist`);
    }
    // We store the user's chosen viewer mode for future use.
    this.props.terria.setLocalProperty("viewermode", viewer);
    this.props.terria.currentViewer.notifyRepaintRequired();
  }

  @action
  showTerrainOnSide(side, event) {
    event.stopPropagation();

    switch (side) {
      case sides.left:
        this.props.terria.terrainSplitDirection = ImagerySplitDirection.LEFT;
        this.props.terria.showSplitter = true;
        break;
      case sides.right:
        this.props.terria.terrainSplitDirection = ImagerySplitDirection.RIGHT;
        this.props.terria.showSplitter = true;
        break;
      case sides.both:
        this.props.terria.terrainSplitDirection = ImagerySplitDirection.NONE;
        break;
    }

    this.props.terria.currentViewer.notifyRepaintRequired();
  }

  @action
  toggleDepthTestAgainstTerrainEnabled(event) {
    event.stopPropagation();
    this.props.terria.depthTestAgainstTerrainEnabled = !this.props.terria
      .depthTestAgainstTerrainEnabled;
    this.props.terria.currentViewer.notifyRepaintRequired();
  }

  render() {
    if (!this.props.terria.mainViewer) {
      return null;
    }
    const { t } = this.props;
    const viewerModeLabels = {
      "3d": t("settingPanel.viewerModeLabels.CesiumTerrain"),
      "3dsmooth": t("settingPanel.viewerModeLabels.CesiumEllipsoid"),
      "2d": t("settingPanel.viewerModeLabels.Leaflet")
    };
    const qualityLabels = {
      0: t("settingPanel.qualityLabels.maximumPerformance"),
      1: t("settingPanel.qualityLabels.balancedPerformance"),
      2: t("settingPanel.qualityLabels.lowerPerformance")
    };
    const currentViewer =
      this.props.terria.mainViewer.viewerMode === ViewerMode.Cesium
        ? this.props.terria.mainViewer.viewerOptions.useTerrain
          ? "3d"
          : "3dsmooth"
        : "2d";

    const useNativeResolution = this.props.terria.useNativeResolution;
    const nativeResolutionLabel = t("settingPanel.nativeResolutionLabel", {
      resolution1: useNativeResolution
        ? t("settingPanel.native")
        : t("settingPanel.screen"),
      resolution2: useNativeResolution
        ? t("settingPanel.screen")
        : t("settingPanel.native")
    });
    const dropdownTheme = {
      outer: Styles.settingPanel,
      inner: Styles.dropdownInner,
      btn: Styles.btnDropdown,
      icon: "map"
    };

    const isCesiumWithTerrain =
      this.props.terria.mainViewer.viewerMode === ViewerMode.Cesium &&
      this.props.terria.mainViewer.viewerOptions.useTerrain &&
      this.props.terria.currentViewer &&
      this.props.terria.currentViewer.scene &&
      this.props.terria.currentViewer.scene.globe;

    const supportsDepthTestAgainstTerrain = isCesiumWithTerrain;
    const depthTestAgainstTerrainEnabled =
      supportsDepthTestAgainstTerrain &&
      this.props.terria.depthTestAgainstTerrainEnabled;

    const depthTestAgainstTerrainLabel = depthTestAgainstTerrainEnabled
      ? t("settingPanel.terrain.showUndergroundFeatures")
      : t("settingPanel.terrain.hideUndergroundFeatures");

    const viewerModes = [];

    if (
      this.props.terria.configParameters.useCesiumIonTerrain ||
      this.props.terria.configParameters.cesiumTerrainUrl
    ) {
      viewerModes.push("3d");
    }

    viewerModes.push("3dsmooth", "2d");

    const supportsSide = isCesiumWithTerrain;

    let currentSide = sides.both;
    if (supportsSide) {
      switch (this.props.terria.terrainSplitDirection) {
        case ImagerySplitDirection.LEFT:
          currentSide = sides.left;
          break;
        case ImagerySplitDirection.RIGHT:
          currentSide = sides.right;
          break;
      }
    }

    const timelineStack = this.props.terria.timelineStack;
    const alwaysShowTimeline =
      timelineStack.defaultTimeVarying !== undefined &&
      timelineStack.defaultTimeVarying.startTimeAsJulianDate !== undefined &&
      timelineStack.defaultTimeVarying.stopTimeAsJulianDate !== undefined &&
      timelineStack.defaultTimeVarying.currentTimeAsJulianDate !== undefined;

    const alwaysShowTimelineLabel = alwaysShowTimeline
      ? t("settingPanel.timeline.alwaysShowLabel")
      : t("settingPanel.timeline.hideLabel");

    return (
      <MenuPanel
        theme={dropdownTheme}
        btnRef={this.props.refFromHOC}
        btnTitle={t("settingPanel.btnTitle")}
        btnText={t("settingPanel.btnText")}
        viewState={this.props.viewState}
        smallScreen={this.props.viewState.useSmallScreenInterface}
      >
        <div className={classNames(Styles.viewer, DropdownStyles.section)}>
          <label className={DropdownStyles.heading}>
            {" "}
            {t("settingPanel.mapView")}{" "}
          </label>
          <ul className={Styles.viewerSelector}>
            <For each="viewerMode" of={viewerModes}>
              <li key={viewerMode} className={Styles.listItemThreeCols}>
                <button
                  onClick={this.selectViewer.bind(this, viewerMode)}
                  className={classNames(Styles.btnViewer, {
                    [Styles.isActive]: viewerMode === currentViewer
                  })}
                >
                  {viewerModeLabels[viewerMode]}
                </button>
              </li>
            </For>
          </ul>
        </div>
        <If condition={supportsSide}>
          <div className={classNames(Styles.viewer, DropdownStyles.section)}>
            <label className={DropdownStyles.heading}>
              {t("settingPanel.terrain.sideLabel")}
            </label>
            <ul className={Styles.viewerSelector}>
              {Object.values(sides).map(side => (
                <li key={side} className={Styles.listItemThreeCols}>
                  <button
                    onClick={this.showTerrainOnSide.bind(this, side)}
                    className={classNames(Styles.btnViewer, {
                      [Styles.isActive]: side === currentSide
                    })}
                  >
                    {t(side)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </If>
        <If condition={supportsDepthTestAgainstTerrain}>
          <div className={classNames(Styles.viewer, DropdownStyles.section)}>
            <section
              className={Styles.nativeResolutionWrapper}
              title={qualityLabels[this.props.terria.quality]}
            >
              <button
                id="depthTestAgainstTerrain"
                type="button"
                onClick={this.toggleDepthTestAgainstTerrainEnabled.bind(this)}
                title={depthTestAgainstTerrainLabel}
                className={Styles.btnNativeResolution}
              >
                {depthTestAgainstTerrainEnabled ? (
                  <Icon glyph={Icon.GLYPHS.checkboxOn} />
                ) : (
                  <Icon glyph={Icon.GLYPHS.checkboxOff} />
                )}
              </button>
              <label
                title={depthTestAgainstTerrainLabel}
                htmlFor="depthTestAgainstTerrain"
                className={classNames(
                  DropdownStyles.subHeading,
                  Styles.nativeResolutionHeader
                )}
              >
                {t("settingPanel.terrain.hideUnderground")}
              </label>
            </section>
          </div>
        </If>
        <div className={classNames(Styles.baseMap, DropdownStyles.section)}>
          <label className={DropdownStyles.heading}>
            {" "}
            {t("settingPanel.baseMap")}{" "}
          </label>
          <label className={DropdownStyles.subHeading}>
            {this.activeMapName}
          </label>
          <ul className={Styles.baseMapSelector}>
            <For
              each="baseMap"
              index="i"
              of={this.props.terria.baseMapsModel.baseMapItems}
            >
              <li key={i} className={Styles.listItemFourCols}>
                <button
                  className={classNames(Styles.btnBaseMap, {
                    [Styles.isActive]:
                      baseMap.item === this.props.terria.mainViewer.baseMap
                  })}
                  onClick={this.selectBaseMap.bind(this, baseMap.item)}
                  onMouseEnter={this.mouseEnterBaseMap.bind(this, baseMap)}
                  onMouseLeave={this.mouseLeaveBaseMap.bind(this, baseMap)}
                  onFocus={this.mouseEnterBaseMap.bind(this, baseMap)}
                >
                  {baseMap.item === this.props.terria.mainViewer.baseMap ? (
                    <Icon glyph={Icon.GLYPHS.selected} />
                  ) : null}
                  <img
                    alt={baseMap.item ? baseMap.item.name : ""}
                    src={baseMap.image}
                  />
                </button>
              </li>
            </For>
          </ul>
        </div>
        <div className={DropdownStyles.section}>
          <label className={DropdownStyles.heading}>
            {t("settingPanel.timeline.title")}
          </label>
          <section
            className={Styles.nativeResolutionWrapper}
            title={qualityLabels[this.props.terria.quality]}
          >
            <button
              id="alwaysShowTimeline"
              type="button"
              onClick={() => {
                runInAction(() => {
                  if (alwaysShowTimeline) {
                    this.props.terria.timelineStack.defaultTimeVarying = undefined;
                  } else {
                    this.props.terria.timelineStack.defaultTimeVarying = new DefaultTimelineModel();
                  }
                });
              }}
              title={alwaysShowTimelineLabel}
              className={Styles.btnNativeResolution}
            >
              {alwaysShowTimeline ? (
                <Icon glyph={Icon.GLYPHS.checkboxOn} />
              ) : (
                <Icon glyph={Icon.GLYPHS.checkboxOff} />
              )}
            </button>
            <label
              title={alwaysShowTimelineLabel}
              htmlFor="alwaysShowTimeline"
              className={classNames(
                DropdownStyles.subHeading,
                Styles.nativeResolutionHeader
              )}
            >
              {t("settingPanel.timeline.alwaysShow")}
            </label>
          </section>
        </div>
        <If condition={this.props.terria.viewerMode !== ViewerMode.Leaflet}>
          <div className={DropdownStyles.section}>
            <label className={DropdownStyles.heading}>
              {t("settingPanel.imageOptimisation")}
            </label>
            <section
              className={Styles.nativeResolutionWrapper}
              title={qualityLabels[this.props.terria.quality]}
            >
              <button
                id="mapUseNativeResolution"
                type="button"
                onClick={() => {
                  runInAction(() => {
                    this.props.terria.useNativeResolution = !useNativeResolution;
                  });
                }}
                title={nativeResolutionLabel}
                className={Styles.btnNativeResolution}
              >
                {useNativeResolution ? (
                  <Icon glyph={Icon.GLYPHS.checkboxOn} />
                ) : (
                  <Icon glyph={Icon.GLYPHS.checkboxOff} />
                )}
              </button>
              <label
                title={nativeResolutionLabel}
                htmlFor="mapUseNativeResolution"
                className={classNames(
                  DropdownStyles.subHeading,
                  Styles.nativeResolutionHeader
                )}
              >
                {t("settingPanel.nativeResolutionHeader")}
              </label>
            </section>
            <label
              htmlFor="mapQuality"
              className={classNames(DropdownStyles.subHeading)}
            >
              {t("settingPanel.mapQuality")}
            </label>
            <section
              className={Styles.qualityWrapper}
              title={qualityLabels[this.props.terria.quality]}
            >
              <label
                className={classNames(
                  DropdownStyles.subHeading,
                  Styles.qualityLabel
                )}
              >
                {t("settingPanel.qualityLabel")}
              </label>
              <Slider
                id="mapMaximumScreenSpaceError"
                className={Styles.opacitySlider}
                min={1}
                max={3}
                step={0.1}
                value={this.props.terria.baseMaximumScreenSpaceError}
                onChange={val => {
                  runInAction(() => {
                    this.props.terria.baseMaximumScreenSpaceError = val;
                  });
                }}
                marks={{ 2: "" }}
                // Awaiting https://github.com/react-component/slider/pull/420
                // aria-valuetext={qualityLabels[this.props.terria.quality]}
              />
              <label
                className={classNames(
                  DropdownStyles.subHeading,
                  Styles.qualityLabel
                )}
              >
                {t("settingPanel.performanceLabel")}
              </label>
            </section>
          </div>
        </If>
      </MenuPanel>
    );
  }
}

export const SETTING_PANEL_NAME = "MenuBarMapSettingsButton";
export default withTranslation()(
  withTerriaRef(SettingPanel, SETTING_PANEL_NAME)
);
// export default withTranslation()(SettingPanelWithRef);
// export default withTranslation()(SettingPanelWithRef);
