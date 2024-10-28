import { action, computed, makeObservable } from "mobx";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import isDefined from "../../Core/isDefined";
import { isJsonObject, JsonObject } from "../../Core/Json";
import Result from "../../Core/Result";
import TerriaError from "../../Core/TerriaError";
import ModelReference from "../../Traits/ModelReference";
import {
  BaseMapsTraits,
  BaseMapTraits
} from "../../Traits/TraitsClasses/BaseMapTraits";
import BingMapsCatalogItem from "../Catalog/CatalogItems/BingMapsCatalogItem";
import CommonStrata from "../Definition/CommonStrata";
import CreateModel from "../Definition/CreateModel";
import { BaseModel } from "../Definition/Model";
import ModelPropertiesFromTraits from "../Definition/ModelPropertiesFromTraits";
import updateModelFromJson from "../Definition/updateModelFromJson";
import Terria from "../Terria";
import { defaultBaseMaps } from "./defaultBaseMaps";
import { ModelConstructorParameters } from "../Definition/Model";
import MappableMixin from "../../ModelMixins/MappableMixin";

export class BaseMapModel extends CreateModel(BaseMapTraits) {}

export type BaseMapJson = Partial<
  Omit<ModelPropertiesFromTraits<BaseMapTraits>, "item"> & {
    item: JsonObject | string;
  }
>;
export type BaseMapsJson = Partial<
  Omit<ModelPropertiesFromTraits<BaseMapsTraits>, "items"> & {
    items: BaseMapJson[];
  }
>;

export interface BaseMapItem {
  image?: string;
  contrastColor?: string;
  item: MappableMixin.Instance;
}

export class BaseMapsModel extends CreateModel(BaseMapsTraits) {
  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  /**
   * List of the basemaps to show in setting panel
   */
  @computed
  get baseMapItems(): BaseMapItem[] {
    const enabledBaseMaps: BaseMapItem[] = [];

    this.enabledBaseMaps.forEach((baseMapItem) => {
      const item = this.items.find((item) => item.item === baseMapItem);
      if (item && !ModelReference.isRemoved(baseMapItem)) {
        const itemModel = this.terria.getModelById(BaseModel, baseMapItem);
        if (MappableMixin.isMixedInto(itemModel)) {
          enabledBaseMaps.push({
            image: item.image,
            contrastColor: item.contrastColor,
            item: itemModel
          });
        }
      }
    });

    return enabledBaseMaps;
  }

  // Can't do this in constructor since {@link CatalogMemberFactory} doesn't
  // have any values at the moment of initializing Terria class.
  initializeDefaultBaseMaps(): Result {
    return this.loadFromJson(CommonStrata.definition, {
      items: defaultBaseMaps(this.terria)
    });
  }

  @action
  private add(stratumId: string, baseMap: BaseMapModel) {
    if (baseMap.item === undefined) {
      throw new DeveloperError(
        "A model without a `uniqueId` cannot be added to a group."
      );
    }

    const resolvedItem = this.terria.getModelById(
      BaseModel,
      baseMap.item as any
    );
    if (resolvedItem instanceof BingMapsCatalogItem) {
      addBingMapsKey(resolvedItem, this.terria);
    }

    const items = this.getTrait(stratumId, "items");
    if (isDefined(items)) {
      items.push(baseMap);
    } else {
      this.setTrait(stratumId, "items", [baseMap]);
    }
  }

  @action
  loadFromJson(stratumId: CommonStrata, newBaseMaps: BaseMapsJson): Result {
    const errors: TerriaError[] = [];
    const { items, ...rest } = newBaseMaps;
    if (items !== undefined) {
      const { items: itemsTrait } = this.traits;
      const newItemsIds = itemsTrait.fromJson(this, stratumId, items);
      newItemsIds.pushErrorTo(errors)?.forEach((member: BaseMapModel) => {
        const existingItem = this.items.find(
          (baseMap) => baseMap.item === member.item
        );
        if (existingItem) {
          // object array trait doesn't automatically update model item
          existingItem.setTrait(stratumId, "image", member.image);
        } else {
          this.add(stratumId, member);
        }
      });
    }

    if (isJsonObject(rest))
      updateModelFromJson(this, stratumId, rest).pushErrorTo(errors);
    else errors.push(TerriaError.from("Invalid JSON object"));

    return new Result(
      undefined,
      TerriaError.combine(
        errors,
        `Failed to add members from JSON for model \`${this.uniqueId}\``
      )
    );
  }
}

function addBingMapsKey(item: BingMapsCatalogItem, terria: Terria) {
  if (!item.key) {
    item.setTrait(
      CommonStrata.defaults,
      "key",
      terria.configParameters.bingMapsKey
    );
  }
}
