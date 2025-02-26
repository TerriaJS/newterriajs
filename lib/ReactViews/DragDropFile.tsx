import classNames from "classnames";
import { action, runInAction } from "mobx";
import { observer } from "mobx-react";
import { DragEvent, MouseEvent, FC, useRef } from "react";
import { Trans } from "react-i18next";
import {
  Category,
  DataSourceAction
} from "../Core/AnalyticEvents/analyticEvents";
import isDefined from "../Core/isDefined";
import Result from "../Core/Result";
import CatalogMemberMixin, { getName } from "../ModelMixins/CatalogMemberMixin";
import MappableMixin from "../ModelMixins/MappableMixin";
import addUserFiles from "../Models/Catalog/addUserFiles";
import Styles from "./drag-drop-file.scss";
import { useViewState } from "./Context";
import { raiseFileDragDropEvent } from "../ViewModels/FileDragDropListener";
import type { BaseModel } from "../Models/Definition/Model";

const DragDropFile: FC = observer(() => {
  const viewState = useViewState();
  const targetRef = useRef<EventTarget>();

  const handleDrop = async (e: DragEvent) => {
    e.persist();
    e.preventDefault();
    e.stopPropagation();

    for (let i = 0; i < e.dataTransfer.files.length; i++) {
      // Log event to analytics for each file dropped (sometimes multiple files dropped in one DragEvent)
      const fileType =
        e.dataTransfer.files[i].type ||
        e.dataTransfer.files[i].name.split(".").pop(); // use file extension if type property is empty

      viewState.terria.analytics?.logEvent(
        Category.dataSource,
        DataSourceAction.addFromDragAndDrop,
        `File Type: ${fileType}, File Size(B): ${e.dataTransfer.files[i].size}`
      );
    }

    try {
      const addedCatalogItems: BaseModel[] | undefined = await addUserFiles(
        e.dataTransfer.files,
        viewState.terria,
        viewState
      );

      if (isDefined(addedCatalogItems) && addedCatalogItems.length > 0) {
        runInAction(() => (viewState.myDataIsUploadView = false));
        if (viewState.explorerPanelIsVisible) {
          (
            await viewState.viewCatalogMember(addedCatalogItems[0])
          ).throwIfError(`Failed to view ${getName(addedCatalogItems[0])}`);
          viewState.openUserData();
        } else {
          // update last batch of uploaded files
          runInAction(
            () =>
              (viewState.lastUploadedFiles = addedCatalogItems.map((item) =>
                CatalogMemberMixin.isMixedInto(item) ? item.name : item.uniqueId
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
        ).raiseError(viewState.terria);

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
            viewState.terria.currentViewer.zoomTo(firstZoomableItem, 1)
          );
        }
      }

      runInAction(() => (viewState.isDraggingDroppingFile = false));
    } catch (e) {
      viewState.terria.raiseErrorToUser(e, "Failed to upload files");
    }
  };

  const handleDragEnter = action((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    targetRef.current = e.target;
  });

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDragLeave = action((e: MouseEvent) => {
    e.preventDefault();
    if (e.screenX === 0 && e.screenY === 0) {
      viewState.isDraggingDroppingFile = false;
    }
    if (e.target === document || e.target === targetRef.current) {
      viewState.isDraggingDroppingFile = false;
    }
  });

  const handleMouseLeave = action(() => {
    viewState.isDraggingDroppingFile = false;
  });

  return (
    <div
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onMouseLeave={handleMouseLeave}
      className={classNames(Styles.dropZone, {
        [Styles.isActive]: viewState.isDraggingDroppingFile
      })}
    >
      {viewState.isDraggingDroppingFile ? (
        <div className={Styles.inner}>
          <Trans i18nKey="dragDrop.text">
            <h3 className={Styles.heading}>Drag & Drop</h3>
            <div className={Styles.caption}>
              Your data anywhere to view on the map
            </div>
          </Trans>
        </div>
      ) : null}
    </div>
  );
});

export default DragDropFile;
