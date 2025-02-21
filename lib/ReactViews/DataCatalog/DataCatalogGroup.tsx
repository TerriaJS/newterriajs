import React, { useCallback, useEffect, useState } from "react";
import { comparer, reaction } from "mobx";
import { observer } from "mobx-react";
import { useTranslation } from "react-i18next";
import addedByUser from "../../Core/addedByUser";
import getPath from "../../Core/getPath";
import removeUserAddedData from "../../Models/Catalog/removeUserAddedData";
import ViewState from "../../ReactViewModels/ViewState";
import { BaseModel } from "../../Models/Definition/Model";
import CatalogGroup from "./CatalogGroup";
import DataCatalogMember from "./DataCatalogMember";
import {
  addRemoveButtonClicked,
  allMappableMembersInWorkbench
} from "./DisplayGroupHelper";
import Terria from "../../Models/Terria";

interface GroupModel extends BaseModel {
  isOpen?: boolean;
  isPrivate?: boolean;
  isLoading?: boolean;
  isLoadingMembers?: boolean;
  displayGroup?: boolean;
  members: any[];
  memberModels: any[];
  loadMembers: () => void;
  nameInCatalog?: string;
  url?: string;
  uniqueId: string;
}

interface PropsType {
  group: GroupModel;
  viewState: ViewState;
  /** Overrides whether to get the open state of the group from the group model or manage it internally */
  manageIsOpenLocally?: boolean;
  userData?: boolean;
  onActionButtonClicked?: () => void;
  removable?: boolean;
  terria: Terria;
  isTopLevel?: boolean;
}

const DataCatalogGroup: React.FC<PropsType> = observer((props) => {
  const {
    group,
    viewState,
    manageIsOpenLocally = false,
    userData = false,
    onActionButtonClicked,
    removable,
    terria,
    isTopLevel
  } = props;

  const { t } = useTranslation();
  const [isOpenLocal, setIsOpenLocal] = useState(false);

  const isOpen = useCallback(() => {
    if (manageIsOpenLocally) {
      return isOpenLocal;
    }
    return group.isOpen;
  }, [manageIsOpenLocally, isOpenLocal, group.isOpen]);

  const clickGroup = useCallback(async () => {
    if (manageIsOpenLocally) {
      setIsOpenLocal(!isOpenLocal);
    }

    (await viewState.viewCatalogMember(group, !group.isOpen)).raiseError(
      viewState.terria
    );
  }, [manageIsOpenLocally, isOpenLocal, group, viewState]);

  const isSelected = useCallback(() => {
    return addedByUser(group)
      ? viewState.userDataPreviewedItem === group
      : viewState.previewedItem === group;
  }, [group, viewState]);

  const getNameOrPrettyUrl = useCallback(() => {
    // Grab a name via nameInCatalog, if it's a blank string, try and generate one from the url
    const nameInCatalog = group.nameInCatalog || "";
    if (nameInCatalog !== "") {
      return nameInCatalog;
    }

    const url = group.url || "";
    // strip protocol
    return url.replace(/^https?:\/\//, "");
  }, [group]);

  useEffect(() => {
    const cleanupLoadMembersReaction = reaction(
      () => [group, isOpen()],
      ([currentGroup, isCurrentlyOpen]) => {
        if (isCurrentlyOpen && currentGroup) {
          (currentGroup as GroupModel).loadMembers();
        }
      },
      { equals: comparer.shallow, fireImmediately: true }
    );

    return () => cleanupLoadMembersReaction();
  }, [group, isOpen]);

  return (
    <CatalogGroup
      text={getNameOrPrettyUrl()}
      isPrivate={group.isPrivate}
      title={getPath(group, " → ")}
      topLevel={isTopLevel}
      open={isOpen()}
      loading={group.isLoading || group.isLoadingMembers}
      emptyMessage={t("dataCatalog.groupEmpty")}
      onClick={clickGroup}
      removable={removable}
      removeUserAddedData={() => removeUserAddedData(terria, group)}
      selected={isSelected()}
      // Pass these next three props down to deal with displayGroup functionality
      displayGroup={group.displayGroup}
      addRemoveButtonFunction={(event: MouseEvent) => {
        addRemoveButtonClicked(
          group,
          viewState,
          terria,
          event.shiftKey || event.ctrlKey
        );
      }}
      allItemsLoaded={allMappableMembersInWorkbench(
        group.members || [],
        terria
      )}
    >
      {isOpen()
        ? group.memberModels.map((item) => (
            <DataCatalogMember
              key={item.uniqueId}
              member={item}
              terria={terria}
              viewState={viewState}
              userData={userData}
              overrideOpen={manageIsOpenLocally}
              onActionButtonClicked={onActionButtonClicked}
            />
          ))
        : null}
    </CatalogGroup>
  );
});

DataCatalogGroup.displayName = "DataCatalogGroup";

export default DataCatalogGroup;
