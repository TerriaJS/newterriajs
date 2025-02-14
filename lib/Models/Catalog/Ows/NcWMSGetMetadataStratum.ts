import { makeObservable } from "mobx";
import WebMapServiceCatalogItemTraits from "../../../Traits/TraitsClasses/WebMapServiceCatalogItemTraits";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel } from "../../Definition/Model";
import StratumOrder from "../../Definition/StratumOrder";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import WebMapServiceCatalogItem from "./WebMapServiceCatalogItem";

export default class NcWMSGetMetadataStratum extends LoadableStratum(
  WebMapServiceCatalogItemTraits
) {
  static stratumName = "ncWMSGetMetadata";

  constructor(
    readonly catalogItem: WebMapServiceCatalogItem,
    readonly metadata: any
  ) {
    super();
    makeObservable(this);
  }

  static async load(
    catalogItem: WebMapServiceCatalogItem
  ): Promise<NcWMSGetMetadataStratum | undefined> {
    if (!catalogItem.uri) return;
    const url = proxyCatalogItemUrl(
      catalogItem,
      catalogItem.uri
        .clone()
        .setSearch({
          service: "WMS",
          version: catalogItem.useWmsVersion130 ? "1.3.0" : "1.1.1",
          request: "GetMetadata",
          item: "layerDetails",
          layerName: catalogItem.layersArray[0]
        })
        .toString()
    );
    const response = await fetch(url);
    const metadata = await response.json();
    return new NcWMSGetMetadataStratum(catalogItem, metadata);
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new NcWMSGetMetadataStratum(this.catalogItem, this.metadata) as this;
  }

  get availablePalettes() {
    return this.metadata.palettes;
  }

  get noPaletteStyles() {
    return this.metadata.noPaletteStyles;
  }

  get palette() {
    return this.metadata.defaultPalette;
  }

  get colorScaleMinimum() {
    return this.metadata.scaleRange[0];
  }

  get colorScaleMaximum() {
    return this.metadata.scaleRange[1];
  }
}

StratumOrder.addLoadStratum(NcWMSGetMetadataStratum.stratumName);
