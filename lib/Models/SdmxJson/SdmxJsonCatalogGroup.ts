import { runInAction } from "mobx";
import CatalogMemberMixin from "../../ModelMixins/CatalogMemberMixin";
import GroupMixin from "../../ModelMixins/GroupMixin";
import UrlMixin from "../../ModelMixins/UrlMixin";
import SdmxCatalogGroupTraits from "../../Traits/SdmxCatalogGroupTraits";
import CreateModel from "../CreateModel";
import { SdmxServerStratum } from "./SdmxJsonServerStratum";

export default class SdmxCatalogGroup extends UrlMixin(
  GroupMixin(CatalogMemberMixin(CreateModel(SdmxCatalogGroupTraits)))
) {
  static readonly type = "sdmx-group";

  get type() {
    return SdmxCatalogGroup.type;
  }

  protected forceLoadMetadata() {
    if (!this.strata.has(SdmxServerStratum.stratumName)) {
      return async () => {
        const stratum = await SdmxServerStratum.load(this);
        runInAction(() => {
          this.strata.set(SdmxServerStratum.stratumName, stratum);
        });
      };
    }
    return () => Promise.resolve();
  }

  protected forceLoadMembers() {
    return () =>
      this.loadMetadata().then(() => {
        const sdmxServerStratum = <SdmxServerStratum | undefined>(
          this.strata.get(SdmxServerStratum.stratumName)
        );
        if (sdmxServerStratum) {
          sdmxServerStratum.createMembers();
        }
      });
  }
}
