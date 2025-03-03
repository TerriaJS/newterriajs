import { runInAction } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { useTranslation } from "react-i18next";
import defined from "terriajs-cesium/Source/Core/defined";
import addedByUser from "../../Core/addedByUser";
import { DataSourceAction } from "../../Core/AnalyticEvents/analyticEvents";
import getPath from "../../Core/getPath";
import CatalogFunctionMixin from "../../ModelMixins/CatalogFunctionMixin";
import CatalogMemberMixin from "../../ModelMixins/CatalogMemberMixin";
import removeUserAddedData from "../../Models/Catalog/removeUserAddedData";
import Terria from "../../Models/Terria";
import ViewState from "../../ReactViewModels/ViewState";
import CatalogItem, { ButtonState } from "./CatalogItem";
import toggleItemOnMapFromCatalog, {
  Op as ToggleOnMapOp
} from "./toggleItemOnMapFromCatalog";

interface Props {
  item: CatalogMemberMixin.Instance;
  viewState: ViewState;
  removable: boolean;
  terria: Terria;
  onActionButtonClicked?: (item: Props["item"]) => void;
}

// Individual dataset

export default observer(function DataCatalogItem({
  item,
  viewState,
  onActionButtonClicked,
  removable
}: Props) {
  const { t } = useTranslation();
  const STATE_TO_TITLE = {
    [ButtonState.Loading]: t("catalogItem.loading"),
    [ButtonState.Remove]: t("catalogItem.removeFromMap"),
    [ButtonState.Add]: t("catalogItem.add"),
    [ButtonState.Trash]: t("catalogItem.trash"),
    [ButtonState.Preview]: t("catalogItem.preview")
  };

  const isSelected = addedByUser(item)
    ? viewState.userDataPreviewedItem === item
    : viewState.previewedItem === item;

  const setPreviewedItem = () =>
    viewState
      .viewCatalogMember(item)
      .then((result) => result.raiseError(viewState.terria));

  const toggleEnable = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const keepCatalogOpen =
      viewState.terria.configParameters.keepCatalogOpen ||
      event.shiftKey ||
      event.ctrlKey;
    await toggleItemOnMapFromCatalog(viewState, item, keepCatalogOpen, {
      [ToggleOnMapOp.Add]: DataSourceAction.addFromCatalogue,
      [ToggleOnMapOp.Remove]: DataSourceAction.removeFromCatalogue
    });
  };
  const onBtnClicked = (event: React.MouseEvent<HTMLButtonElement>) => {
    runInAction(() => {
      if (onActionButtonClicked) {
        onActionButtonClicked(item);
        return;
      }

      if (defined(viewState.storyShown)) {
        viewState.storyShown = false;
      }

      if (
        CatalogFunctionMixin.isMixedInto(item) ||
        viewState.useSmallScreenInterface
      ) {
        setPreviewedItem();
      } else {
        toggleEnable(event);
      }
    });
  };
  const onTrashClicked = () => removeUserAddedData(viewState.terria, item);

  let btnState: ButtonState;
  if (item.isLoading) {
    btnState = ButtonState.Loading;
  } else if (viewState.useSmallScreenInterface) {
    btnState = ButtonState.Preview;
  } else if (item.terria.workbench.contains(item)) {
    btnState = ButtonState.Remove;
  } else if (CatalogFunctionMixin.isMixedInto(item)) {
    btnState = ButtonState.Stats;
  } else {
    btnState = ButtonState.Add;
  }

  return (
    <CatalogItem
      onTextClick={setPreviewedItem}
      selected={isSelected}
      text={item.nameInCatalog!}
      isPrivate={item.isPrivate}
      title={getPath(item, " -> ")}
      btnState={btnState}
      onBtnClick={onBtnClicked}
      // All things are "removable" - meaning add and remove from workbench,
      //    but only user data is "trashable"
      trashable={removable}
      onTrashClick={removable ? onTrashClicked : undefined}
      titleOverrides={STATE_TO_TITLE}
    />
  );
});
