import i18next from "i18next";
import { action, computed, runInAction, makeObservable, override } from "mobx";
import threddsCrawler from "thredds-catalog-crawler/src/entryBrowser";
import isDefined from "../../../Core/isDefined";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import GroupMixin from "../../../ModelMixins/GroupMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import ModelReference from "../../../Traits/ModelReference";
import ThreddsCatalogGroupTraits from "../../../Traits/TraitsClasses/ThreddsCatalogGroupTraits";
import CatalogGroup from "../CatalogGroup";
import CommonStrata from "../../Definition/CommonStrata";
import CreateModel from "../../Definition/CreateModel";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel } from "../../Definition/Model";
import { proxyCatalogItemBaseUrl } from "../proxyCatalogItemUrl";
import StratumOrder from "../../Definition/StratumOrder";
import { ModelConstructorParameters } from "../../Definition/Model";
import ThreddsItemReference from "../CatalogReferences/ThreddsItemReference";

interface ThreddsCatalog {
  id: string;
  name: string;
  title: string;
  isLoaded: boolean;
  url: string;
  supportsWms: boolean;
  hasDatasets: boolean;
  hasNestedCatalogs: boolean;
  datasets: ThreddsDataset[];
  catalogs: ThreddsCatalog[];
  getAllChildDatasets: () => void;
  loadAllNestedCatalogs: () => void;
  loadNestedCatalogById: () => void;
  parentCatalog: ThreddsCatalog;
}

export interface ThreddsDataset {
  id: string;
  name: string;
  url: string;
  wmsUrl: string;
  supportsWms: boolean;
  isParentDataset: boolean;
  datasets: ThreddsDataset[];
  catalogs: ThreddsCatalog[];
  loadAllNestedCatalogs: () => void;
}

export class ThreddsStratum extends LoadableStratum(ThreddsCatalogGroupTraits) {
  static stratumName = "thredds";
  private threddsCatalog: ThreddsCatalog | undefined = undefined;

  constructor(readonly _catalogGroup: ThreddsCatalogGroup) {
    super();
    makeObservable(this);
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new ThreddsStratum(model as ThreddsCatalogGroup) as this;
  }

  static load(
    catalogGroup: ThreddsCatalogGroup
  ): Promise<ThreddsStratum | undefined> {
    return Promise.resolve(new ThreddsStratum(catalogGroup));
  }

  @computed
  get members(): ModelReference[] {
    if (this.threddsCatalog === undefined) return [];

    const memberIds: ModelReference[] = [];

    this.threddsCatalog.catalogs.forEach((catalog: ThreddsCatalog) => {
      memberIds.push(`${this._catalogGroup.uniqueId}/${catalog.id}`);
    });

    this.threddsCatalog.datasets.forEach((dataset: ThreddsDataset) => {
      dataset.catalogs.forEach((c) => {
        memberIds.push(`${this._catalogGroup.uniqueId}/${c.id}`);
      });
      memberIds.push(`${this._catalogGroup.uniqueId}/${dataset.id}`);
    });
    return memberIds;
  }

  @action
  createThreddsCatalog(catalog: ThreddsCatalog) {
    const id = `${this._catalogGroup.uniqueId}/${catalog.id}`;

    let model = this._catalogGroup.terria.getModelById(ThreddsCatalogGroup, id);
    if (!isDefined(model)) {
      model = new ThreddsCatalogGroup(id, this._catalogGroup.terria);
      this._catalogGroup.terria.addModel(model);
    }

    model.setTrait(CommonStrata.definition, "name", catalog.title);
    model.setTrait(CommonStrata.definition, "url", catalog.url);
  }

  @action
  async createMembers() {
    if (!isDefined(this._catalogGroup.url)) return;
    const proxy = proxyCatalogItemBaseUrl(
      this._catalogGroup,
      this._catalogGroup.url
    );
    this.threddsCatalog = await threddsCrawler(
      this._catalogGroup.url,
      proxy
        ? {
            proxy
          }
        : undefined
    );
    if (this.threddsCatalog === undefined) return;
    // Create sub-groups for any nested catalogs
    for (let i = 0; i < this.threddsCatalog.catalogs.length; i++) {
      this.createThreddsCatalog(this.threddsCatalog.catalogs[i]);
    }

    // Create members for individual datasets
    for (let i = 0; i < this.threddsCatalog.datasets.length; i++) {
      const ds = this.threddsCatalog.datasets[i];
      await ds.loadAllNestedCatalogs();
      for (let ii = 0; ii < ds.catalogs.length; ii++) {
        this.createThreddsCatalog(ds.catalogs[ii]);
      }

      if (ds.isParentDataset) {
        let parent: CatalogGroup | ThreddsCatalogGroup = this._catalogGroup;

        if (this.threddsCatalog.datasets.length > 1) {
          const id = `${this._catalogGroup.uniqueId}/${ds.id}`;

          let model = this._catalogGroup.terria.getModelById(CatalogGroup, id);
          if (!isDefined(model)) {
            model = new CatalogGroup(id, this._catalogGroup.terria);
            this._catalogGroup.terria.addModel(model);
          }

          model.setTrait(CommonStrata.definition, "name", ds.name);
          parent = model;
        }

        ds.datasets.forEach((dataset) => {
          const item = this.createMemberFromDataset(dataset);
          if (item !== undefined) parent.add(CommonStrata.definition, item);
        });
      } else if (ds.supportsWms) {
        this.createMemberFromDataset(ds);
      }
    }
  }

  @action
  createMemberFromDataset(
    threddsDataset: ThreddsDataset
  ): BaseModel | undefined {
    if (!isDefined(threddsDataset.id)) {
      return undefined;
    }

    const itemId = this._catalogGroup.uniqueId + "/" + threddsDataset.id;
    let item = this._catalogGroup.terria.getModelById(
      ThreddsItemReference,
      itemId
    );
    if (item === undefined) {
      item = new ThreddsItemReference(itemId, this._catalogGroup.terria);
      item.setTrait(CommonStrata.definition, "isGroup", true);
      item.setDataset(threddsDataset);
      item.setThreddsStrata(item);
      item.terria.addModel(item);
    }
    return item;
  }
}

StratumOrder.addLoadStratum(ThreddsStratum.stratumName);

export default class ThreddsCatalogGroup extends UrlMixin(
  GroupMixin(CatalogMemberMixin(CreateModel(ThreddsCatalogGroupTraits)))
) {
  static readonly type = "thredds-group";

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get type() {
    return ThreddsCatalogGroup.type;
  }

  get typeName() {
    return i18next.t("models.thredds.nameGroup");
  }

  @override
  get cacheDuration(): string {
    if (isDefined(super.cacheDuration)) {
      return super.cacheDuration;
    }
    return "1d";
  }

  protected async forceLoadMetadata(): Promise<void> {
    if (!this.strata.get(ThreddsStratum.stratumName)) {
      const stratum = await ThreddsStratum.load(this);
      if (stratum === undefined) return;
      await stratum.createMembers();
      runInAction(() => {
        this.strata.set(ThreddsStratum.stratumName, stratum);
      });
    }
  }

  protected async forceLoadMembers() {
    const stratum = this.strata.get(
      ThreddsStratum.stratumName
    ) as ThreddsStratum;
    if (stratum) {
      await stratum.createMembers();
    }
  }
}
