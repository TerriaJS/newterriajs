import { runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import defined from "terriajs-cesium/Source/Core/defined";
import { DataSourceAction } from "../../Core/AnalyticEvents/analyticEvents";
import MappableMixin from "../../ModelMixins/MappableMixin";
import toggleItemOnMapFromCatalog, {
  Op as ToggleOnMapOp
} from "../DataCatalog/toggleItemOnMapFromCatalog";
import measureElement from "../HOCs/measureElement";
import SharePanel from "../Map/Panels/SharePanel/SharePanel";
import DataPreviewMap from "./DataPreviewMap";
import Description from "./Description";
import Styles from "./mappable-preview.scss";
import WarningBox from "./WarningBox";

/**
 * @typedef {object} Props
 * @prop {Terria} terria
 * @prop {MappableMixin.Instance} previewed
 * @prop {ViewState} viewState
 *
 */

/**
 * CatalogItem preview that is mappable (as opposed to say, an analytics item that can't be displayed on a map without
 * configuration of other parameters.
 * @extends {React.Component<Props>}
 */
@observer
class MappablePreview extends React.Component {
  static propTypes = {
    previewed: PropTypes.object.isRequired,
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    widthFromMeasureElementHOC: PropTypes.number,
    t: PropTypes.func.isRequired
  };

  async toggleOnMap(_event) {
    if (defined(this.props.viewState.storyShown)) {
      runInAction(() => (this.props.viewState.storyShown = false));
    }

    const keepCatalogOpen = true; //event.shiftKey || event.ctrlKey;

    await toggleItemOnMapFromCatalog(
      this.props.viewState,
      this.props.previewed,
      keepCatalogOpen,
      {
        [ToggleOnMapOp.Add]: DataSourceAction.addFromPreviewButton,
        [ToggleOnMapOp.Remove]: DataSourceAction.removeFromPreviewButton
      }
    );
  }

  backToMap() {
    this.props.viewState.explorerPanelIsVisible = false;
  }

  render() {
    const { t } = this.props;
    const catalogItem = this.props.previewed;
    return (
      <div className={Styles.root}>
        {MappableMixin.isMixedInto(catalogItem) &&
          !catalogItem.disablePreview && (
            <DataPreviewMap
              terria={this.props.terria}
              previewed={catalogItem}
              showMap={
                !this.props.viewState.explorerPanelAnimating ||
                this.props.viewState.useSmallScreenInterface
              }
            />
          )}
        <button
          type="button"
          onClick={this.toggleOnMap.bind(this)}
          className={Styles.btnAdd}
        >
          {this.props.terria.workbench.contains(catalogItem)
            ? t("preview.removeFromMap")
            : t("preview.addToMap")}
        </button>
        <div className={Styles.previewedInfo}>
          <div
            className={Styles.titleAndShareWrapper}
            ref={(component) => (this.refToMeasure = component)}
          >
            <h3 className={Styles.h3}>{catalogItem.name}</h3>
            {!catalogItem.hasLocalData &&
              !this.props.viewState.useSmallScreenInterface && (
                <div className={Styles.shareLinkWrapper}>
                  <SharePanel
                    catalogShare
                    catalogShareWithoutText
                    modalWidth={this.props.widthFromMeasureElementHOC}
                    terria={this.props.terria}
                    viewState={this.props.viewState}
                  />
                </div>
              )}
          </div>
          {catalogItem.loadMetadataResult?.error && (
            <WarningBox
              error={catalogItem.loadMetadataResult?.error}
              viewState={this.props.viewState}
            />
          )}
          {catalogItem.loadMapItemsResult?.error && (
            <WarningBox
              error={catalogItem.loadMapItemsResult?.error}
              viewState={this.props.viewState}
            />
          )}
          <Description item={catalogItem} />
        </div>
      </div>
    );
  }
}

export default withTranslation()(measureElement(MappablePreview));
