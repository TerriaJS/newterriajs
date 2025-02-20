import i18next from "i18next";
import { runInAction } from "mobx";
import ReferenceMixin from "../../../ModelMixins/ReferenceMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import ThreddsItemReferenceTraits from "../../../Traits/TraitsClasses/ThreddsItemReferenceTraits";
import ThreddsCatalogGroup, {
  ThreddsDataset
} from "../CatalogGroups/ThreddsCatalogGroup";
import CatalogMemberFactory from "../CatalogMemberFactory";
import CreateModel from "../../Definition/CreateModel";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel } from "../../Definition/Model";
import StratumOrder from "../../Definition/StratumOrder";
import WebMapServiceCatalogGroup from "../Ows/WebMapServiceCatalogGroup";

export class ThreddsDatasetStratum extends LoadableStratum(
  ThreddsItemReferenceTraits
) {
  static stratumName = "threddsDataset";

  constructor(
    private readonly threddsItemReference: ThreddsItemReference,
    private readonly threddsDataset: ThreddsDataset
  ) {
    super();
  }

  duplicateLoadableStratum(_newModel: BaseModel): this {
    return new ThreddsDatasetStratum(
      this.threddsItemReference,
      this.threddsDataset
    ) as this;
  }

  static load(
    threddsItemReference: ThreddsItemReference,
    threddsDataset: ThreddsDataset
  ) {
    return new ThreddsDatasetStratum(threddsItemReference, threddsDataset);
  }

  get name() {
    if (this.threddsDataset === undefined) return undefined;
    return this.threddsDataset.name;
  }

  get url() {
    if (this.threddsDataset === undefined) return undefined;
    return this.threddsDataset.wmsUrl;
  }
}

StratumOrder.addLoadStratum(ThreddsDatasetStratum.stratumName);

export default class ThreddsItemReference extends UrlMixin(
  ReferenceMixin(CreateModel(ThreddsItemReferenceTraits))
) {
  static readonly type = "thredds-item";

  get type() {
    return ThreddsItemReference.type;
  }

  get typeName() {
    return i18next.t("models.threddsItem.name");
  }

  _threddsDataset: ThreddsDataset | undefined = undefined;
  _threddsCatalogGroup: ThreddsCatalogGroup | undefined = undefined;

  setDataset(dataset: ThreddsDataset) {
    this._threddsDataset = dataset;
  }

  setThreddsCatalogGroup(group: ThreddsCatalogGroup) {
    this._threddsCatalogGroup = group;
  }

  setThreddsStrata(model: BaseModel) {
    if (this._threddsDataset === undefined) return;
    if (model.strata.get(ThreddsDatasetStratum.stratumName) !== undefined)
      return;

    const stratum = ThreddsDatasetStratum.load(this, this._threddsDataset);
    if (stratum === undefined) return;
    runInAction(() => {
      model.strata.set(ThreddsDatasetStratum.stratumName, stratum);
    });
  }

  passThreddsStrata(model: BaseModel) {
    const threddsStrata = this.strata.get(ThreddsDatasetStratum.stratumName);
    if (threddsStrata === undefined) return;
    runInAction(() => {
      model.strata.set(ThreddsDatasetStratum.stratumName, threddsStrata);
    });
  }

  async forceLoadReference(
    _previousTarget: BaseModel | undefined
  ): Promise<BaseModel | undefined> {
    this.setThreddsStrata(this);

    const model = CatalogMemberFactory.create(
      WebMapServiceCatalogGroup.type,
      this.uniqueId,
      this.terria,
      this
    );
    if (model === undefined) return;
    this.setThreddsStrata(model);
    return Promise.resolve(model);
  }
}
