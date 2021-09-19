import classNames from "classnames";
import { action, flow, runInAction } from "mobx";
import { observer } from "mobx-react";
import { DragEvent, MouseEvent, Component } from "react";
import { Trans, withTranslation, WithTranslation } from "react-i18next";
import isDefined from "../Core/isDefined";
import CatalogMemberMixin, { getName } from "../ModelMixins/CatalogMemberMixin";
import MappableMixin from "../ModelMixins/MappableMixin";
import addUserFiles from "../Models/Catalog/addUserFiles";
import { BaseModel } from "../Models/Definition/Model";
import Terria from "../Models/Terria";
import ViewState from "../ReactViewModels/ViewState";
import Styles from "./drag-drop-file.scss";
import Result from "../Core/Result";

interface PropsType extends WithTranslation {
  terria: Terria;
  viewState: ViewState;
}

@observer
class DragDropFile extends Component<PropsType> {
  target: EventTarget | undefined;

  async handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();

    const props = this.props;

    try {
      const addedCatalogItems: BaseModel[] | undefined = await addUserFiles(
        e.dataTransfer.files,
        props.terria,
        props.viewState
      );

      if (isDefined(addedCatalogItems) && addedCatalogItems.length > 0) {
        runInAction(() => (props.viewState.myDataIsUploadView = false));
        if (props.viewState.explorerPanelIsVisible) {
          (
            await props.viewState.viewCatalogMember(addedCatalogItems[0])
          ).throwIfError(`Failed to view ${getName(addedCatalogItems[0])}`);
          props.viewState.openUserData();
        } else {
          // update last batch of uploaded files
          runInAction(
            () =>
              (props.viewState.lastUploadedFiles = addedCatalogItems.map(item =>
                CatalogMemberMixin.isMixedInto(item) ? item.name : item.uniqueId
              ))
          );
        }

        // Add load all mapable items
        const mappableItems = addedCatalogItems.filter(
          MappableMixin.isMixedInto
        );

        Result.combine(
          await Promise.all(mappableItems.map(f => f.loadMapItems())),
          "Failed to load uploaded files"
        ).raiseError(props.terria);

        // Zoom to first item
        const firstZoomableItem = mappableItems.find(i =>
          isDefined(i.rectangle)
        );

        isDefined(firstZoomableItem) &&
          runInAction(() =>
            props.terria.currentViewer.zoomTo(firstZoomableItem, 1)
          );
      }

      runInAction(() => (props.viewState.isDraggingDroppingFile = false));
    } catch (e) {
      props.terria.raiseErrorToUser(e, "Failed to upload files");
    }
  }

  @action
  handleDragEnter(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    this.target = e.target;
  }

  handleDragOver(e: DragEvent) {
    e.preventDefault();
  }

  @action
  handleDragLeave(e: MouseEvent) {
    e.preventDefault();
    if (e.screenX === 0 && e.screenY === 0) {
      this.props.viewState.isDraggingDroppingFile = false;
    }
    if (e.target === document || e.target === this.target) {
      this.props.viewState.isDraggingDroppingFile = false;
    }
  }

  @action
  handleMouseLeave() {
    this.props.viewState.isDraggingDroppingFile = false;
  }

  render() {
    return (
      <div
        onDrop={this.handleDrop.bind(this)}
        onDragEnter={this.handleDragEnter.bind(this)}
        onDragOver={this.handleDragOver.bind(this)}
        onDragLeave={this.handleDragLeave.bind(this)}
        onMouseLeave={this.handleMouseLeave.bind(this)}
        className={classNames(Styles.dropZone, {
          [Styles.isActive]: this.props.viewState.isDraggingDroppingFile
        })}
      >
        {isDefined(this.props.viewState.isDraggingDroppingFile) ? (
          <div className={Styles.inner}>
            <Trans i18nKey="dragDrop.text">
              <h3 className={Styles.heading}>Drag & Drop</h3>
              <div className={Styles.caption}>
                Your data anywhere to view on the map
              </div>
            </Trans>
          </div>
        ) : (
          ""
        )}
      </div>
    );
  }
}
module.exports = withTranslation()(DragDropFile);
