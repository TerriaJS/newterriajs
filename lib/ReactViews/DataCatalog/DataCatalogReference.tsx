import { runInAction } from "mobx";
import { observer } from "mobx-react";
import { MouseEvent } from "react";
import defined from "terriajs-cesium/Source/Core/defined";
import addedByUser from "../../Core/addedByUser";
import { DataSourceAction } from "../../Core/AnalyticEvents/analyticEvents";
import getPath from "../../Core/getPath";
import CatalogMemberMixin from "../../ModelMixins/CatalogMemberMixin";
import ReferenceMixin from "../../ModelMixins/ReferenceMixin";
import Model from "../../Models/Definition/Model";
import Terria from "../../Models/Terria";
import ViewState from "../../ReactViewModels/ViewState";
import CatalogMemberReferenceTraits from "../../Traits/TraitsClasses/CatalogMemberReferenceTraits";
import CatalogGroup from "./CatalogGroup";
import CatalogItem, { ButtonState } from "./CatalogItem";
import toggleItemOnMapFromCatalog, {
  Op as ToggleOnMapOp
} from "./toggleItemOnMapFromCatalog";

interface Props {
  reference: ReferenceMixin.Instance &
    CatalogMemberMixin.Instance &
    Model<CatalogMemberReferenceTraits>;
  viewState: ViewState;
  terria: Terria;
  onActionButtonClicked?: (item: Props["reference"]) => void;
  isTopLevel: boolean;
}

export default observer(function DataCatalogReference({
  reference,
  viewState,
  onActionButtonClicked,
  isTopLevel
}: Props) {
  const setPreviewedItem = () =>
    viewState
      .viewCatalogMember(reference)
      .then((result) => result.raiseError(viewState.terria));

  const add = async (event: MouseEvent<HTMLButtonElement>) => {
    const keepCatalogOpen = event.shiftKey || event.ctrlKey;

    if (onActionButtonClicked) {
      onActionButtonClicked(reference);
      return;
    }

    if (defined(viewState.storyShown)) {
      runInAction(() => {
        viewState.storyShown = false;
      });
    }

    if (reference.isFunction || viewState.useSmallScreenInterface) {
      await setPreviewedItem();
    } else {
      await toggleItemOnMapFromCatalog(viewState, reference, keepCatalogOpen, {
        [ToggleOnMapOp.Add]: DataSourceAction.addFromCatalogue,
        [ToggleOnMapOp.Remove]: DataSourceAction.removeFromCatalogue
      });
    }
  };

  const isSelected = addedByUser(reference)
    ? viewState.userDataPreviewedItem === reference
    : viewState.previewedItem === reference;

  const path = getPath(reference, " -> ");

  let btnState: ButtonState;
  if (reference.isLoading) {
    btnState = ButtonState.Loading;
  } else if (viewState.useSmallScreenInterface) {
    btnState = ButtonState.Preview;
  } else if (reference.isFunction) {
    btnState = ButtonState.Stats;
  } else {
    btnState = ButtonState.Add;
  }

  return reference.isGroup ? (
    <CatalogGroup
      text={reference.name || "..."}
      isPrivate={reference.isPrivate}
      title={path}
      onClick={setPreviewedItem}
      topLevel={isTopLevel}
      loading={reference.isLoadingReference}
      open={reference.isLoadingReference}
    />
  ) : (
    <CatalogItem
      onTextClick={setPreviewedItem}
      selected={isSelected}
      text={reference.name || "..."}
      isPrivate={reference.isPrivate}
      title={path}
      btnState={btnState}
      onBtnClick={reference.isFunction ? setPreviewedItem : add}
    />
  );
});
