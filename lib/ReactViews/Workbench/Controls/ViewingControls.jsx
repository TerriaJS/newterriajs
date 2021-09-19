"use strict";
import createReactClass from "create-react-class";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";
import styled from "styled-components";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import defined from "terriajs-cesium/Source/Core/defined";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import ImagerySplitDirection from "terriajs-cesium/Source/Scene/ImagerySplitDirection";
import when from "terriajs-cesium/Source/ThirdParty/when";
import {
  Category,
  DataSourceAction
} from "../../../Core/AnalyticEvents/analyticEvents";
import getDereferencedIfExists from "../../../Core/getDereferencedIfExists";
import getPath from "../../../Core/getPath";
import PickedFeatures from "../../../Map/PickedFeatures";
import ExportableMixin from "../../../ModelMixins/ExportableMixin";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import SearchableItemMixin from "../../../ModelMixins/SearchableItemMixin";
import addUserCatalogMember from "../../../Models/Catalog/addUserCatalogMember";
import SplitItemReference from "../../../Models/Catalog/CatalogReferences/SplitItemReference";
import CommonStrata from "../../../Models/Definition/CommonStrata";
import hasTraits from "../../../Models/Definition/hasTraits";
import getAncestors from "../../../Models/getAncestors";
import AnimatedSpinnerIcon from "../../../Styled/AnimatedSpinnerIcon";
import Box from "../../../Styled/Box";
import { RawButton } from "../../../Styled/Button";
import Icon, { StyledIcon } from "../../../Styled/Icon";
import SplitterTraits from "../../../Traits/TraitsClasses/SplitterTraits";
import { exportData } from "../../Preview/ExportData";
import LazyItemSearchTool from "../../Tools/ItemSearchTool/LazyItemSearchTool";
import WorkbenchButton from "../WorkbenchButton";

const BoxViewingControl = styled(Box).attrs({
  centered: true,
  left: true,
  justifySpaceBetween: true
})``;

const ViewingControlMenuButton = styled(RawButton).attrs({
  // primaryHover: true
})`
  color: ${props => props.theme.textDarker};
  background-color: ${props => props.theme.textLight};

  ${StyledIcon} {
    width: 35px;
  }

  svg {
    fill: ${props => props.theme.textDarker};
    width: 18px;
    height: 18px;
  }
  & > span {
    // position: absolute;
    // left: 37px;
  }

  border-radius: 0;

  width: 114px;
  // ensure we support long strings
  min-height: 32px;
  display: block;

  &:hover,
  &:focus {
    color: ${props => props.theme.textLight};
    background-color: ${props => props.theme.colorPrimary};
    svg {
      fill: ${props => props.theme.textLight};
    }
  }
`;

const ViewingControls = observer(
  createReactClass({
    displayName: "ViewingControls",

    propTypes: {
      item: PropTypes.object.isRequired,
      viewState: PropTypes.object.isRequired,
      t: PropTypes.func.isRequired
    },

    getInitialState() {
      return {
        isMapZoomingToCatalogItem: false
      };
    },

    /* eslint-disable-next-line camelcase */
    UNSAFE_componentWillMount() {
      window.addEventListener("click", this.hideMenu);
    },

    componentWillUnmount() {
      window.removeEventListener("click", this.hideMenu);
    },

    hideMenu() {
      runInAction(() => {
        this.props.viewState.workbenchWithOpenControls = undefined;
      });
    },

    removeFromMap() {
      const terria = this.props.viewState.terria;
      terria.workbench.remove(this.props.item);
      terria.removeSelectedFeaturesForModel(this.props.item);
      this.props.viewState.terria.timelineStack.remove(this.props.item);
      this.props.viewState.terria.analytics?.logEvent(
        Category.dataSource,
        DataSourceAction.removeFromWorkbench,
        getPath(this.props.item)
      );
    },

    zoomTo() {
      runInAction(() => {
        const viewer = this.props.viewState.terria.currentViewer;
        const item = this.props.item;
        let zoomToView = item;
        if (
          item.rectangle !== undefined &&
          item.rectangle.east - item.rectangle.west >= 360
        ) {
          zoomToView = this.props.viewState.terria.mainViewer.homeCamera;
          console.log("Extent is wider than world so using homeCamera.");
        }
        this.setState({ isMapZoomingToCatalogItem: true });
        viewer.zoomTo(zoomToView).finally(() => {
          this.setState({ isMapZoomingToCatalogItem: false });
        });
      });
    },

    openFeature() {
      const item = this.props.item;
      const pickedFeatures = new PickedFeatures();
      pickedFeatures.features.push(item.tableStructure.sourceFeature);
      pickedFeatures.allFeaturesAvailablePromise = when();
      pickedFeatures.isLoading = false;
      const xyzPosition = item.tableStructure.sourceFeature.position.getValue(
        item.terria.clock.currentTime
      );
      const ellipsoid = Ellipsoid.WGS84;
      // Code replicated from GazetteerSearchProviderViewModel.
      const bboxRadians = 0.1; // GazetterSearchProviderViewModel uses 0.2 degrees ~ 0.0035 radians. 1 degree ~ 110km. 0.1 radian ~ 700km.

      const latLonPosition = Cartographic.fromCartesian(xyzPosition, ellipsoid);
      const south = latLonPosition.latitude + bboxRadians / 2;
      const west = latLonPosition.longitude - bboxRadians / 2;
      const north = latLonPosition.latitude - bboxRadians / 2;
      const east = latLonPosition.longitude + bboxRadians / 2;
      const rectangle = new Rectangle(west, south, east, north);
      const flightDurationSeconds = 1;
      // TODO: This is bad. How can we do it better?
      setTimeout(function() {
        item.terria.pickedFeatures = pickedFeatures;
        item.terria.currentViewer.zoomTo(rectangle, flightDurationSeconds);
      }, 50);
    },

    splitItem() {
      const { t } = this.props;
      const item = this.props.item;
      const terria = item.terria;

      const splitRef = new SplitItemReference(createGuid(), terria);
      runInAction(async () => {
        if (item.splitDirection === ImagerySplitDirection.NONE) {
          item.setTrait(
            CommonStrata.user,
            "splitDirection",
            ImagerySplitDirection.RIGHT
          );
        }

        splitRef.setTrait(
          CommonStrata.user,
          "splitSourceItemId",
          item.uniqueId
        );
        terria.addModel(splitRef);
        terria.showSplitter = true;

        await splitRef.loadReference();
        runInAction(() => {
          const target = splitRef.target;
          if (target) {
            target.setTrait(
              CommonStrata.user,
              "name",
              t("splitterTool.workbench.copyName", {
                name: item.name
              })
            );

            // Set a direction opposite to the original item
            target.setTrait(
              CommonStrata.user,
              "splitDirection",
              item.splitDirection === ImagerySplitDirection.LEFT
                ? ImagerySplitDirection.RIGHT
                : ImagerySplitDirection.LEFT
            );
          }
        });

        // Add it to terria.catalog, which is required so the new item can be shared.
        addUserCatalogMember(terria, splitRef, {
          open: false
        });
      });
    },

    openDiffTool() {
      // Disable timeline
      // Should we do this? Difference is quite a specific use case
      this.props.item.terria.timelineStack.removeAll();
      this.props.viewState.openTool({
        toolName: "Difference",
        getToolComponent: () =>
          import("../../Tools/DiffTool/DiffTool").then(m => m.default),
        showCloseButton: true,
        params: {
          sourceItem: this.props.item
        }
      });
    },

    searchItem() {
      const { item, viewState } = this.props;
      let itemSearchProvider;
      try {
        itemSearchProvider = item.createItemSearchProvider();
      } catch (error) {
        viewState.terria.raiseErrorToUser(error);
        return;
      }
      this.props.viewState.openTool({
        toolName: "Search Item",
        getToolComponent: () => LazyItemSearchTool,
        showCloseButton: false,
        params: {
          item,
          itemSearchProvider,
          viewState
        }
      });
    },

    async previewItem() {
      let item = this.props.item;
      // If this is a chartable item opened from another catalog item, get the info of the original item.
      if (defined(item.sourceCatalogItem)) {
        item = item.sourceCatalogItem;
      }
      // Open up all the parents (doesn't matter that this sets it to enabled as well because it already is).
      getAncestors(this.props.item)
        .map(item => getDereferencedIfExists(item))
        .forEach(group => {
          runInAction(() => {
            group.setTrait(CommonStrata.user, "isOpen", true);
          });
        });
      this.props.viewState.viewCatalogMember(item);
    },

    exportDataClicked() {
      const item = this.props.item;

      exportData(item).catch(e => {
        this.props.item.terria.raiseErrorToUser(e);
      });
    },

    renderViewingControlsMenu() {
      const { t, item, viewState } = this.props;
      const canSplit =
        !item.terria.configParameters.disableSplitter &&
        hasTraits(item, SplitterTraits, "splitDirection") &&
        !item.disableSplitter &&
        defined(item.splitDirection) &&
        item.terria.currentViewer.canShowSplitter;
      return (
        <ul ref={e => (this.menuRef = e)}>
          <If
            condition={item.tableStructure && item.tableStructure.sourceFeature}
          >
            <li>
              <ViewingControlMenuButton
                onClick={this.openFeature}
                title={t("workbench.openFeatureTitle")}
              >
                <BoxViewingControl>
                  <StyledIcon glyph={Icon.GLYPHS.upload} />
                  <span>{t("workbench.openFeature")}</span>
                </BoxViewingControl>
              </ViewingControlMenuButton>
            </li>
          </If>
          <If condition={canSplit}>
            <li>
              <ViewingControlMenuButton
                onClick={this.splitItem}
                title={t("workbench.splitItemTitle")}
              >
                <BoxViewingControl>
                  <StyledIcon glyph={Icon.GLYPHS.compare} />
                  <span>{t("workbench.splitItem")}</span>
                </BoxViewingControl>
              </ViewingControlMenuButton>
            </li>
          </If>
          <If
            condition={
              viewState.useSmallScreenInterface === false &&
              !item.isShowingDiff &&
              item.canDiffImages
            }
          >
            <li>
              <ViewingControlMenuButton
                onClick={this.openDiffTool}
                title={t("workbench.diffImageTitle")}
              >
                <BoxViewingControl>
                  <StyledIcon glyph={Icon.GLYPHS.difference} />
                  <span>{t("workbench.diffImage")}</span>
                </BoxViewingControl>
              </ViewingControlMenuButton>
            </li>
          </If>
          <If
            condition={ExportableMixin.isMixedInto(item) && item.canExportData}
          >
            <li>
              <ViewingControlMenuButton
                onClick={this.exportDataClicked}
                title={t("workbench.exportDataTitle")}
              >
                <BoxViewingControl>
                  <StyledIcon glyph={Icon.GLYPHS.upload} />
                  <span>{t("workbench.exportData")}</span>
                </BoxViewingControl>
              </ViewingControlMenuButton>
            </li>
          </If>
          <If
            condition={SearchableItemMixin.isMixedInto(item) && item.canSearch}
          >
            <li>
              <ViewingControlMenuButton
                onClick={() => runInAction(() => this.searchItem())}
                title={t("workbench.searchItemTitle")}
              >
                <BoxViewingControl>
                  <StyledIcon glyph={Icon.GLYPHS.search} />
                  <span>{t("workbench.searchItem")}</span>
                </BoxViewingControl>
              </ViewingControlMenuButton>
            </li>
          </If>
          <li>
            <ViewingControlMenuButton
              onClick={this.removeFromMap}
              title={t("workbench.removeFromMapTitle")}
            >
              <BoxViewingControl>
                <StyledIcon glyph={Icon.GLYPHS.cancel} />
                <span>{t("workbench.removeFromMap")}</span>
              </BoxViewingControl>
            </ViewingControlMenuButton>
          </li>
        </ul>
      );
    },

    render() {
      const viewState = this.props.viewState;
      const item = this.props.item;
      const { t } = this.props;
      const showMenu = item.uniqueId === viewState.workbenchWithOpenControls;
      return (
        <Box>
          <ul
            css={`
              list-style: none;
              padding-left: 0;
              margin: 0;
              width: 100%;
              position: relative;
              display: flex;
              justify-content: space-between;

              li {
                display: block;
                float: left;
                box-sizing: border-box;
              }
              & > button:last-child {
                margin-right: 0;
              }
            `}
          >
            <WorkbenchButton
              onClick={this.zoomTo}
              title={t("workbench.zoomToTitle")}
              disabled={
                // disabled if the item cannot be zoomed to or if a zoom is already in progress
                (MappableMixin.isMixedInto(item) && item.disableZoomTo) ||
                this.state.isMapZoomingToCatalogItem === true
              }
              iconElement={() =>
                this.state.isMapZoomingToCatalogItem ? (
                  <AnimatedSpinnerIcon />
                ) : (
                  <Icon glyph={Icon.GLYPHS.search} />
                )
              }
            >
              {t("workbench.zoomTo")}
            </WorkbenchButton>
            <WorkbenchButton
              onClick={this.previewItem}
              title={t("workbench.previewItemTitle")}
              iconElement={() => <Icon glyph={Icon.GLYPHS.about} />}
              disabled={item.disableAboutData}
            >
              {t("workbench.previewItem")}
            </WorkbenchButton>
            <WorkbenchButton
              css="flex-grow:0;"
              onClick={e => {
                event.stopPropagation();
                runInAction(() => {
                  if (viewState.workbenchWithOpenControls === item.uniqueId) {
                    viewState.workbenchWithOpenControls = undefined;
                  } else {
                    viewState.workbenchWithOpenControls = item.uniqueId;
                  }
                });
              }}
              title={t("workbench.showMoreActionsTitle")}
              iconOnly
              iconElement={() => <Icon glyph={Icon.GLYPHS.menuDotted} />}
            />
          </ul>
          {showMenu && (
            <Box
              css={`
                position: absolute;
                z-index: 100;
                right: 0;
                top: 0;
                top: 32px;
                top: 42px;

                padding: 0;
                margin: 0;

                ul {
                  list-style: none;
                }
              `}
            >
              {this.renderViewingControlsMenu()}
            </Box>
          )}
        </Box>
      );
    }
  })
);
module.exports = withTranslation()(ViewingControls);
