import createReactClass from "create-react-class";
import { observer } from "mobx-react";
import { runInAction } from "mobx";
import PropTypes from "prop-types";
import defined from "terriajs-cesium/Source/Core/defined";
import addedByUser from "../../Core/addedByUser";
import getPath from "../../Core/getPath";
import CommonStrata from "../../Models/Definition/CommonStrata";
import CatalogGroup from "./CatalogGroup";
import CatalogItem from "./CatalogItem";

const DataCatalogReference = observer(
  createReactClass({
    displayName: "DataCatalogReference",

    propTypes: {
      reference: PropTypes.object.isRequired,
      viewState: PropTypes.object.isRequired,
      onActionButtonClicked: PropTypes.func,
      terria: PropTypes.object,
      isTopLevel: PropTypes.bool
    },

    async setPreviewedItem() {
      await this.props.viewState.viewCatalogMember(
        this.props.reference,
        true,
        CommonStrata.user
      );
    },

    async add(event) {
      const keepCatalogOpen = event.shiftKey || event.ctrlKey;

      if (this.props.onActionButtonClicked) {
        this.props.onActionButtonClicked(this.props.reference);
        return;
      }

      if (defined(this.props.viewState.storyShown)) {
        runInAction(() => {
          this.props.viewState.storyShown = false;
        });
      }

      if (
        defined(this.props.reference.invoke) ||
        this.props.viewState.useSmallScreenInterface
      ) {
        await this.setPreviewedItem();
      } else {
        try {
          if (!this.props.terria.workbench.contains(this.props.reference)) {
            this.props.terria.timelineStack.addToTop(this.props.reference);
            await this.props.terria.workbench.add(this.props.reference);
          } else {
            this.props.terria.timelineStack.remove(this.props.reference);
            await this.props.terria.workbench.remove(this.props.reference);
          }

          if (
            this.props.terria.workbench.contains(this.props.reference) &&
            !keepCatalogOpen
          ) {
            this.props.viewState.closeCatalog();
          }
        } catch (e) {
          this.props.terria.raiseErrorToUser(e, undefined, true);
        }
      }
    },

    isSelected() {
      return addedByUser(this.props.reference)
        ? this.props.viewState.userDataPreviewedItem === this.props.reference
        : this.props.viewState.previewedItem === this.props.reference;
    },

    render() {
      const reference = this.props.reference;
      const path = getPath(reference, " -> ");

      return (
        <Choose>
          <When condition={reference.isGroup}>
            <CatalogGroup
              text={reference.name || "..."}
              isPrivate={reference.isPrivate}
              title={path}
              onClick={this.setPreviewedItem}
              topLevel={this.props.isTopLevel}
              loading={this.props.reference.isLoadingReference}
              open={this.props.reference.isLoadingReference}
            />
          </When>
          <When condition={reference.isFunction}>
            <CatalogItem
              onTextClick={this.setPreviewedItem}
              selected={this.isSelected()}
              text={reference.name || "..."}
              isPrivate={reference.isPrivate}
              title={path}
              btnState={
                this.props.reference.isLoadingReference ? "loading" : "stats"
              }
              onBtnClick={this.setPreviewedItem}
            />
          </When>
          <Otherwise>
            <CatalogItem
              onTextClick={this.setPreviewedItem}
              selected={this.isSelected()}
              text={reference.name || "..."}
              isPrivate={reference.isPrivate}
              title={path}
              btnState={
                this.props.reference.isLoadingReference ? "loading" : "add"
              }
              onBtnClick={this.add}
            />
          </Otherwise>
        </Choose>
      );
    }
  })
);

module.exports = DataCatalogReference;
