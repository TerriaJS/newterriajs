import i18next from "i18next";
import { action, computed, observable, makeObservable } from "mobx";
import filterOutUndefined from "../Core/filterOutUndefined";
import Result from "../Core/Result";
import TerriaError, { TerriaErrorSeverity } from "../Core/TerriaError";
import CatalogMemberMixin, { getName } from "../ModelMixins/CatalogMemberMixin";
import ChartableMixin from "../ModelMixins/ChartableMixin";
import MappableMixin from "../ModelMixins/MappableMixin";
import ReferenceMixin from "../ModelMixins/ReferenceMixin";
import TimeFilterMixin from "../ModelMixins/TimeFilterMixin";
import LayerOrderingTraits from "../Traits/TraitsClasses/LayerOrderingTraits";
import CommonStrata from "./Definition/CommonStrata";
import hasTraits from "./Definition/hasTraits";
import { BaseModel } from "./Definition/Model";
import MappableTraits from "../Traits/TraitsClasses/MappableTraits";

const keepOnTop = (model: BaseModel) =>
  hasTraits(model, LayerOrderingTraits, "keepOnTop") && model.keepOnTop;
const supportsReordering = (model: BaseModel) =>
  hasTraits(model, LayerOrderingTraits, "supportsReordering") &&
  model.supportsReordering;

export default class Workbench {
  private readonly _items = observable.array<BaseModel>();

  constructor() {
    makeObservable(this);
  }

  /**
   * Gets or sets the list of items on the workbench.
   */
  @computed
  get items(): readonly BaseModel[] {
    return this._items.map(dereferenceModel);
  }
  set items(items: readonly BaseModel[]) {
    // Run items through a set to remove duplicates.
    const setItems = new Set(items);
    this._items.spliceWithArray(
      0,
      this._items.length,
      Array.from(setItems).slice()
    );
  }

  /**
   * Gets the unique IDs of the items in the workbench.
   */
  @computed
  get itemIds(): readonly string[] {
    return filterOutUndefined(this._items.map((item) => item.uniqueId));
  }

  /**
   * Gets the unique IDs of the items in the workbench.
   */
  @computed
  get shouldExpandAll(): boolean {
    return this.items.every((item) => !(item as any).isOpenInWorkbench);
  }

  /**
   * Checks if the workbench contains time-based WMS
   */
  @computed
  get hasTimeWMS(): boolean {
    return this._items.some(
      (item) =>
        item.type === "wms" &&
        TimeFilterMixin.isMixedInto(item) &&
        item.discreteTimesAsSortedJulianDates?.length
    );
  }

  /**
   * Removes a model or its dereferenced equivalent from the workbench.
   * @param item The model.
   */
  @action
  remove(item: BaseModel): void {
    const index = this.indexOf(item);
    if (index >= 0) {
      this._items.splice(index, 1);
    }
  }

  /**
   * Removes all models from the workbench.
   */
  @action
  removeAll(): void {
    this._items.clear();
  }

  /**
   * Collapses all models from the workbench.
   */
  @action
  collapseAll(): void {
    this.items.map((item) => {
      item.setTrait(CommonStrata.user, "isOpenInWorkbench", false);
    });
  }

  /**
   * Expands all models from the workbench.
   */
  @action
  expandAll(): void {
    this.items.map((item) => {
      item.setTrait(CommonStrata.user, "isOpenInWorkbench", true);
    });
  }

  /**
   * Disable all items in the workbench.
   */
  @action
  disableAll() {
    this.items.forEach((item) => {
      if (hasTraits(item, MappableTraits, "show")) {
        item.setTrait(CommonStrata.user, "show", false);
      }
    });
  }

  @action
  enableAll() {
    this.items.forEach((item) => {
      if (hasTraits(item, MappableTraits, "show")) {
        item.setTrait(CommonStrata.user, "show", true);
      }
    });
  }

  /**
   * Adds an item to the workbench. If the item is already present, this method does nothing.
   * Note that the model's dereferenced equivalent may appear in the {@link Workbench#items} list
   * rather than the model itself.
   * @param item The model to add.
   */
  @action
  private insertItem(item: BaseModel, index: number = 0) {
    if (this.contains(item)) {
      return;
    }

    const targetItem: BaseModel = dereferenceModel(item);

    // Keep reorderable data sources (e.g.: imagery layers) below non-orderable ones (e.g.: GeoJSON).
    if (supportsReordering(targetItem)) {
      while (
        index < this.items.length &&
        !supportsReordering(this.items[index])
      ) {
        ++index;
      }
    } else {
      while (
        index > 0 &&
        this.items.length > 0 &&
        supportsReordering(this.items[index - 1])
      ) {
        --index;
      }
    }

    if (!keepOnTop(targetItem)) {
      while (
        index < this.items.length &&
        keepOnTop(this.items[index]) &&
        supportsReordering(this.items[index]) === supportsReordering(targetItem)
      ) {
        ++index;
      }
    } else {
      while (
        index > 0 &&
        this.items.length > 0 &&
        !keepOnTop(this.items[index - 1]) &&
        supportsReordering(this.items[index - 1]) ===
          supportsReordering(targetItem)
      ) {
        --index;
      }
    }

    // Make sure the reference, rather than the target, is added to the items list.
    const referenceItem = item.sourceReference ? item.sourceReference : item;
    this._items.splice(index, 0, referenceItem);
  }

  /**
   * Adds or removes a model to/from the workbench. If the model is a reference,
   * it will also be dereferenced. If, after dereferencing, the item turns out not to
   * be {@link AsyncMappableMixin} or {@link ChartableMixin} but it is a {@link GroupMixin}, it will
   * be removed from the workbench. If it is mappable, `loadMapItems` will be called.
   *
   * If an error occurs, it will only be added to the workbench if the severity is TerriaError.Warning - otherwise it will not be added
   *
   * @param item The item to add to or remove from the workbench.
   */
  public async add(item: BaseModel | BaseModel[]): Promise<Result<unknown>> {
    if (Array.isArray(item)) {
      const results = await Promise.all(item.reverse().map((i) => this.add(i)));
      return Result.combine(results, {
        title: i18next.t("workbench.addItemErrorTitle"),
        message: i18next.t("workbench.addItemErrorMessage"),
        importance: -1
      });
    }

    this.insertItem(item);

    let error: TerriaError | undefined;

    if (ReferenceMixin.isMixedInto(item)) {
      error = (await item.loadReference()).error;
      if (item.target) {
        this.remove(item);
        return this.add(item.target);
      }
    }

    // Add warning message if item isn't mappable or chartable
    if (
      !error &&
      !MappableMixin.isMixedInto(item) &&
      !ChartableMixin.isMixedInto(item)
    ) {
      error = TerriaError.from(
        `${getName(item)} doesn't have anything to visualize`,
        TerriaErrorSeverity.Warning
      );
    }

    if (!error && CatalogMemberMixin.isMixedInto(item))
      error = (await item.loadMetadata()).error;

    if (!error && MappableMixin.isMixedInto(item)) {
      error = (await item.loadMapItems()).error;
      if (!error && item.zoomOnAddToWorkbench && !item.disableZoomTo) {
        item.terria.currentViewer.zoomTo(item);
      }
    }

    // Remove item if TerriaError severity is Error
    if (error?.severity === TerriaErrorSeverity.Error) {
      this.remove(item);
    }

    return Result.none(error, {
      title: i18next.t("workbench.addItemErrorTitle"),
      message: i18next.t("workbench.addItemErrorMessage"),
      importance: -1
    });
  }

  /**
   * Determines if a given model or its dereferenced equivalent exists in the workbench list.
   * @param item The model.
   * @returns True if the model or its dereferenced equivalent exists on the workbench; otherwise, false.
   */
  contains(item: BaseModel): boolean {
    return this.indexOf(item) >= 0;
  }

  /**
   * Returns the index of a given model or its dereferenced equivalent in the workbench list.
   * @param item The model.
   * @returns The index of the model or its dereferenced equivalent, or -1 if neither exist on the workbench.
   */
  indexOf(item: BaseModel): number {
    return this.items.findIndex(
      (model) =>
        model === item || dereferenceModel(model) === dereferenceModel(item)
    );
  }

  /**
   * Used to re-order the workbench list.
   * @param item The model to be moved.
   * @param newIndex The new index to shift the model to.
   */
  @action
  moveItemToIndex(item: BaseModel, newIndex: number): void {
    if (!this.contains(item)) {
      return;
    }
    this.remove(item);
    this.insertItem(item, newIndex);
  }
}

function dereferenceModel(model: BaseModel): BaseModel {
  if (ReferenceMixin.isMixedInto(model) && model.target !== undefined) {
    return model.target;
  }
  return model;
}
