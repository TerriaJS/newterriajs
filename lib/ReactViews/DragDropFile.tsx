import classNames from "classnames";
import { action, runInAction, makeObservable } from "mobx";
import { observer } from "mobx-react";
import { DragEvent, MouseEvent, Component } from "react";
import { Trans, withTranslation, WithTranslation } from "react-i18next";
import {
  Category,
  DataSourceAction
} from "../Core/AnalyticEvents/analyticEvents";
import isDefined from "../Core/isDefined";
import Result from "../Core/Result";
import CatalogMemberMixin, { getName } from "../ModelMixins/CatalogMemberMixin";
import MappableMixin from "../ModelMixins/MappableMixin";
import addUserFiles from "../Models/Catalog/addUserFiles";
import { BaseModel } from "../Models/Definition/Model";
import Styles from "./drag-drop-file.scss";
import { WithViewState, withViewState } from "./Context";
import { raiseFileDragDropEvent } from "../ViewModels/FileDragDropListener";

interface PropsType extends WithTranslation, WithViewState {}

@observer
class DragDropFile extends Component<PropsType> {
  target: EventTarget | undefined;

  constructor(props: PropsType) {
    super(props);
    makeObservable(this);
  }

  async handleDrop(e: DragEvent) {
    e.persist();
    e.preventDefault();
    e.stopPropagation();

    const props = this.props;

    for (let i = 0; i < e.dataTransfer.files.length; i++) {
      // Log event to analytics for each file dropped (sometimes multiple files dropped in one DragEvent)
      const fileType =
        e.dataTransfer.files[i].type ||
        e.dataTransfer.files[i].name.split(".").pop(); // use file extension if type property is empty

      this.props.viewState.terria.analytics?.logEvent(
        Category.dataSource,
        DataSourceAction.addFromDragAndDrop,
        `File Type: ${fileType}, File Size(B): ${e.dataTransfer.files[i].size}`
      );
    }

    try {
      const addedCatalogItems: BaseModel[] | undefined = await addUserFiles(
        e.dataTransfer.files,
        props.viewState.terria,
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
              (props.viewState.lastUploadedFiles = addedCatalogItems.map(
                (item) =>
                  CatalogMemberMixin.isMixedInto(item)
                    ? item.name
                    : item.uniqueId
              ))
          );
        }

        // Add load all mapable items
        const mappableItems = addedCatalogItems.filter(
          MappableMixin.isMixedInto
        );

        Result.combine(
          await Promise.all(mappableItems.map((f) => f.loadMapItems())),
          "Failed to load uploaded files"
        ).raiseError(props.viewState.terria);

        raiseFileDragDropEvent({
          addedItems: mappableItems,
          mouseCoordinates: { clientX: e.clientX, clientY: e.clientY }
        });

        // Zoom to first item
        const firstZoomableItem = mappableItems.find(
          (i) => isDefined(i.rectangle) && i.disableZoomTo === false
        );

        if (isDefined(firstZoomableItem)) {
          runInAction(() =>
            props.viewState.terria.currentViewer.zoomTo(firstZoomableItem, 1)
          );
        }
      }

      runInAction(() => (props.viewState.isDraggingDroppingFile = false));
    } catch (e) {
      props.viewState.terria.raiseErrorToUser(e, "Failed to upload files");
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
        {this.props.viewState.isDraggingDroppingFile ? (
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

export default withTranslation()(withViewState(DragDropFile));
