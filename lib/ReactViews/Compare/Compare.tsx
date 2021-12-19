import { action, runInAction } from "mobx";
import { observer } from "mobx-react";
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import ImagerySplitDirection from "terriajs-cesium/Source/Scene/ImagerySplitDirection";
import filterOutUndefined from "../../Core/filterOutUndefined";
import CatalogMemberMixin from "../../ModelMixins/CatalogMemberMixin";
import MappableMixin from "../../ModelMixins/MappableMixin";
import SplitItemReference from "../../Models/Catalog/CatalogReferences/SplitItemReference";
import {
  Comparable,
  CompareConfig,
  isComparableItem
} from "../../Models/Comparable";
import CommonStrata from "../../Models/Definition/CommonStrata";
import hasTraits from "../../Models/Definition/hasTraits";
import { BaseModel } from "../../Models/Definition/Model";
import Terria from "../../Models/Terria";
import Workbench from "../../Models/Workbench";
import ViewState from "../../ReactViewModels/ViewState";
import { GLYPHS } from "../../Styled/Icon";
import Text from "../../Styled/Text";
import MappableTraits from "../../Traits/TraitsClasses/MappableTraits";
import SplitterTraits from "../../Traits/TraitsClasses/SplitterTraits";
import CompareItemControls from "./CompareItemControls";
import DatePicker from "./DatePicker";
import ItemList from "./ItemList";
import ItemSelector from "./ItemSelector";
import LocationDateFilter from "./LocationDateFilter";
import { Panel, PanelMenu } from "./Panel";
import { ExplorerWindowElementName } from "../ExplorerWindow/ExplorerWindow";

export type PropsType = {
  viewState: ViewState;
  compareConfig: CompareConfig;
};

/**
 * This component implements the workflow for comparing 2 datasets.
 *
 * When comparing the same item, we clone the original item, showing one on the left
 * and the other on the right. When the component unmounts, we remove all the
 * clones. The truth that we are cloning the original item is hidden from the user.
 * This adds a bit of complexity in ensuring that the clone dataset does not appear in
 * any of the selectors.
 */
const Compare: React.FC<PropsType> = observer(props => {
  const { viewState, compareConfig: config } = props;
  const terria = viewState.terria;

  const [t] = useTranslation();
  // The item active in the left panel
  const [leftItem, setLeftItem] = useState<Comparable | undefined>();
  // The item active in the right panel
  const [rightItem, setRightItem] = useState<Comparable | undefined>();
  const [
    showCompareItemsInFrontOfContextItems,
    setShowCompareItemsInFrontOfContextItems
  ] = useState(true);

  useEffect(
    action(function onMount() {
      terria.showSplitter = true;
      // hide MapDataCount
      terria.elements.set("map-data-count", { visible: false });
      terria.elements.set("timeline", { visible: false });
      // Hide all workbench items except the left & right items,
      // but do it only when the user launches the compare workflow
      // otherwise, if we are restoring from share data then respect the
      // current visibility state of items.
      terria.workbench.items.forEach(item => {
        if (
          item.uniqueId !== config.leftPanelItemId &&
          item.uniqueId !== config.rightPanelItemId &&
          viewState.isCompareUserTriggered
        )
          hideItem(item);
      });
      return action(function onUnmount() {
        terria.showSplitter = false;
        terria.elements.set("map-data-count", { visible: true });
        terria.elements.set("timeline", { visible: true });
        viewState.isCompareUserTriggered = false;
      });
    }),
    []
  );

  // Generate a list of comparable items to pass to the dataset selector (excluding the clones)
  const comparableItems: { id: string; name: string }[] = filterOutUndefined(
    terria.workbench.items
      .filter(isComparableItem)
      .filter(item => isCloneItem(item) === false)
      .map(item =>
        item.uniqueId
          ? { id: item.uniqueId, name: item.name ?? item.uniqueId }
          : undefined
      )
  );

  useEffect(
    // Reacts to change of leftPanelItemId and rightPanelItemId by
    // showing/hiding them and updating their split direction.
    action(function setLeftAndRightItems() {
      const leftItem =
        config.leftPanelItemId !== undefined
          ? findComparableItemById(terria.workbench, config.leftPanelItemId)
          : undefined;
      if (leftItem) {
        showItem(leftItem, ImagerySplitDirection.LEFT);
      } else {
        // unsetting because we couldn't find an item with this id
        config.leftPanelItemId = undefined;
      }
      setLeftItem(leftItem);

      const rightItem =
        config.rightPanelItemId !== undefined
          ? findComparableItemById(terria.workbench, config.rightPanelItemId)
          : undefined;
      if (rightItem) {
        showItem(rightItem, ImagerySplitDirection.RIGHT);
      } else {
        // unsetting because we couldn't find an item with this id
        config.rightPanelItemId = undefined;
      }
      setRightItem(rightItem);

      return function cleanup() {
        // remove any clones we have added that are not in use
        if (
          leftItem &&
          isCloneItem(leftItem) &&
          leftItem.uniqueId !== config.leftPanelItemId
        ) {
          removeItem(leftItem);
        }
        if (
          rightItem &&
          isCloneItem(rightItem) &&
          rightItem.uniqueId !== config.rightPanelItemId
        ) {
          removeItem(rightItem);
        }
      };
    }),
    [config.leftPanelItemId, config.rightPanelItemId, comparableItems.length]
  );

  // Generate a list of items that can be shown in both panels.
  // Do not show an item if the item or a clone of it is show in left or right panels
  const contextItems = terria.workbench.items
    .filter(
      item =>
        sourceItemId(terria, item.uniqueId ?? "") !==
          sourceItemId(terria, config.leftPanelItemId ?? "") &&
        sourceItemId(terria, item.uniqueId ?? "") !==
          sourceItemId(terria, config.rightPanelItemId ?? "")
    )
    .filter(item => isCloneItem(item) === false)
    .filter(
      item =>
        MappableMixin.isMixedInto(item) && CatalogMemberMixin.isMixedInto(item)
    ) as (MappableMixin.Instance & CatalogMemberMixin.Instance)[];

  // Change the item on the left panel
  const changeLeftItem = async (leftItemId: string) => {
    // Hide the previous item
    if (leftItem) hideItem(leftItem);

    // If the selected left item is the same as the current right item, clone it.
    const itemId =
      rightItem && leftItemId === rightItem.uniqueId
        ? await cloneItem(rightItem)
        : leftItemId;
    runInAction(() => {
      config.leftPanelItemId = itemId;
    });
  };

  // Change the item on the right panel
  const changeRightItem = async (rightItemId: string) => {
    // Hide the previous item
    if (rightItem) hideItem(rightItem);

    // If the selected right item is the same as the current left item, clone it.
    const itemId =
      leftItem && rightItemId === leftItem.uniqueId
        ? await cloneItem(leftItem)
        : rightItemId;
    runInAction(() => {
      config.rightPanelItemId = itemId;
    });
  };

  useEffect(
    function updateContextItems() {
      contextItems.forEach(
        item =>
          hasTraits(item, SplitterTraits, "splitDirection") &&
          item.setTrait(
            CommonStrata.user,
            "splitDirection",
            ImagerySplitDirection.NONE
          )
      );
    },
    [config, contextItems]
  );

  // Maintains the stacking order of left, right and context items.
  useEffect(
    function sendContextItemsToFrontOrBack() {
      if (showCompareItemsInFrontOfContextItems) {
        leftItem && sendItemToFront(leftItem);
        rightItem && sendItemToFront(rightItem);
      } else {
        leftItem && sendItemToBack(leftItem);
        rightItem && sendItemToBack(rightItem);
      }
    },
    [
      showCompareItemsInFrontOfContextItems,
      leftItem,
      rightItem,
      contextItems.length
    ]
  );

  const toggleContextItem = action(
    (item: MappableMixin.Instance, show: boolean) =>
      show ? showItem(item, ImagerySplitDirection.NONE) : hideItem(item)
  );

  const openCatalogExplorer = action(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      viewState.explorerPanelIsVisible = true;
      viewState.setTopElement(ExplorerWindowElementName);
      // Call to stopPropagation is required to prevent the parent
      // WorkflowPanel from capturing the click and setting itself as the top
      // element. If that happens the ExplorerWindow modal will no longer be
      // the top element and will not hide itself when clicking the workflow
      // panel.
      event.stopPropagation();
    }
  );

  const hideAllContextItems = () => {
    contextItems.forEach(hideItem);
  };

  const entireMapMenuOptions = [
    { text: t("compare.entireMapMenu.browse"), onSelect: openCatalogExplorer },
    showCompareItemsInFrontOfContextItems
      ? {
          text: t("compare.entireMapMenu.sendAllToFront"),
          onSelect: () => setShowCompareItemsInFrontOfContextItems(false),
          disabled: contextItems.length === 0
        }
      : {
          text: t("compare.entireMapMenu.sendAllToBack"),
          onSelect: () => setShowCompareItemsInFrontOfContextItems(true),
          disabled: contextItems.length === 0
        },
    {
      text: t("compare.entireMapMenu.hideAll"),
      onSelect: hideAllContextItems,
      disabled: contextItems.length === 0
    }
  ];

  return (
    <>
      <Container>
        <Panel>
          <InfoText>{t("compare.info")}</InfoText>
        </Panel>
        <Panel icon={GLYPHS.compareLeftPanel} title={t("compare.leftPanel")}>
          <PanelBody>
            <DatasetLabel>{t("compare.dataset.label")}:</DatasetLabel>
            <ItemSelector
              selectableItems={comparableItems}
              selectedItem={
                config.leftPanelItemId
                  ? sourceItemId(terria, config.leftPanelItemId)
                  : undefined
              }
              onChange={changeLeftItem}
            />
            {leftItem && <CompareItemControls item={leftItem} />}
          </PanelBody>
        </Panel>
        <Panel icon={GLYPHS.compareRightPanel} title={t("compare.rightPanel")}>
          <PanelBody>
            <DatasetLabel>{t("compare.dataset.label")}:</DatasetLabel>
            <ItemSelector
              selectableItems={comparableItems}
              selectedItem={
                config.rightPanelItemId
                  ? sourceItemId(terria, config.rightPanelItemId)
                  : undefined
              }
              onChange={changeRightItem}
            />
            {rightItem && <CompareItemControls item={rightItem} />}
          </PanelBody>
        </Panel>
        <Panel
          icon={GLYPHS.compareBothPanels}
          title={t("compare.entireMap.title")}
          menuComponent={<PanelMenu options={entireMapMenuOptions} />}
        >
          {contextItems.length === 0 && (
            <EmptyText>{t("compare.entireMap.emptyText")}</EmptyText>
          )}
          {contextItems.length > 0 && (
            <ItemList
              items={contextItems}
              onChangeSelection={toggleContextItem}
              viewState={viewState}
            />
          )}
        </Panel>
      </Container>
      {terria.elements.get("timeline")?.visible === false && (
        <BottomDockFirstPortal>
          <MapOverlay>
            <Left>
              <DatePicker side="left" item={leftItem} />
            </Left>
            <LocationDateFilter
              viewState={viewState}
              leftItem={leftItem}
              rightItem={rightItem}
            />
            <Right>
              <DatePicker side="right" item={rightItem} />
            </Right>
          </MapOverlay>
        </BottomDockFirstPortal>
      )}
    </>
  );
});

const Container = styled.div`
  padding-bottom: 4em;
`;

const Left = styled.div``;
const Right = styled.div``;

const BottomDockFirstPortal: React.FC<{}> = props => {
  // defined in BottomDock component
  const portalContainer = document.getElementById("TJS-BottomDockFirstPortal");
  return portalContainer
    ? ReactDOM.createPortal(<>{props.children}</>, portalContainer)
    : null;
};

/**
 * Overlays the children on top of the map
 */
const MapOverlay: React.FC = ({ children }) => {
  return (
    <div
      css={`
        width: 100%;
        /* bottom dock has a grey background, by setting height to 0 we prevent it from showing through */
        /*height: 0px;*/
        /*line-height: 0px;*/
        position: relative;
      `}
    >
      <div
        css={`
          width: 100%;
          position: absolute;
          bottom: 50px;
          display: flex;
          justify-content: center;

          & > ${Left} {
            width: 50%;
            display: flex;
            justify-content: flex-end;
          }

          & > ${Right} {
            width: 50%;
            display: flex;
            justify-content: flex-start;
          }
        `}
      >
        {children}
      </div>
    </div>
  );
};
const MapOverlay2 = styled.div`
  display: flex;
  justify-content: center;

  width: 100%;
  /* bottom dock has a grey background, by setting height to 0 we prevent it from showing through */
  height: 0px;
  line-height: 0px;

  position: relative;
  bottom: 80px;

  & > ${Left} {
    width: 50%;
    display: flex;
    justify-content: flex-end;
  }

  & > ${Right} {
    width: 50%;
    display: flex;
    justify-content: flex-start;
  }
`;

const DatasetLabel = styled(Text).attrs({ medium: true })`
  padding-bottom: 5px;
`;

const PanelBody = styled.div`
  padding: 0.4em;
`;

const EmptyText = styled(Text).attrs({ medium: true })`
  padding: 10px;
`;

/**
 * Find a Comparable item in the workbench with the given id.
 */
function findComparableItemById(
  workbench: Workbench,
  itemId: string
): Comparable | undefined {
  const comparableItem = workbench.items.find(
    item => item.uniqueId === itemId && isComparableItem(item)
  );
  return comparableItem ? (comparableItem as Comparable) : undefined;
}

/**
 * Returns true if the item is a clone of some other item.
 */
function isCloneItem(item: BaseModel): boolean {
  return (
    item instanceof SplitItemReference ||
    item.sourceReference instanceof SplitItemReference
  );
}

/**
 * Create and return a clone of the given item, also add it to the workbench.
 */
async function cloneItem(item: Comparable): Promise<string | undefined> {
  const terria = item.terria;
  const cloneId = createGuid();
  const ref = new SplitItemReference(cloneId, terria);
  ref.setTrait(CommonStrata.user, "splitSourceItemId", item.uniqueId);
  try {
    terria.addModel(ref);
    // Insert below the parent item in the workbench
    await terria.workbench.add(ref /*terria.workbench.indexOf(item) + 1*/);
  } catch (e) {
    return undefined;
  }
  return cloneId;
}

/**
 * If the given id is that of a clone, dereference it and return the id of
 * the original item. Otherwise return the id.
 */
function sourceItemId(terria: Terria, id: string): string | undefined {
  const model = terria.getModelById(BaseModel, id);
  if (!model) return undefined;
  else if (model instanceof SplitItemReference) return model.splitSourceItemId;
  else if (model.sourceReference instanceof SplitItemReference)
    return model.sourceReference.splitSourceItemId;
  else return id;
}

/**
 * Show the item on the given direction
 */
function showItem(item: BaseModel, direction: ImagerySplitDirection) {
  if (hasTraits(item, MappableTraits, "show"))
    item.setTrait(CommonStrata.user, "show", true);
  if (hasTraits(item, SplitterTraits, "splitDirection"))
    item.setTrait(CommonStrata.user, "splitDirection", direction);
}

/**
 * Hide the item
 */
function hideItem(item: BaseModel) {
  if (hasTraits(item, MappableTraits, "show"))
    item.setTrait(CommonStrata.user, "show", false);
  if (hasTraits(item, SplitterTraits, "splitDirection")) {
    item.setTrait(
      CommonStrata.user,
      "splitDirection",
      ImagerySplitDirection.NONE
    );
  }
}

function sendItemToFront(item: BaseModel) {
  const workbench = item.terria.workbench;
  workbench.moveItemToIndex(item, 0);
}

function sendItemToBack(item: BaseModel) {
  const workbench = item.terria.workbench;
  workbench.moveItemToIndex(item, workbench.items.length - 1);
}

/**
 * Remove item from terria
 */
function removeItem(item: BaseModel) {
  item.terria.removeModelReferences(item);
}

const InfoText = styled(Text).attrs({ medium: true, textAlignCenter: true })`
  padding: 1em;
`;

export default Compare;
