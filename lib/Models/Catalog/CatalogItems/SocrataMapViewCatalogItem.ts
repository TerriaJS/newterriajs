import { computed, makeObservable, runInAction } from "mobx";
import { toFeatureCollection } from "../../../Core/GeoJson";
import loadJson from "../../../Core/loadJson";
import TerriaError from "../../../Core/TerriaError";
import GeoJsonMixin from "../../../ModelMixins/GeojsonMixin";
import SocrataMapViewCatalogItemTraits from "../../../Traits/TraitsClasses/SocrataMapViewCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel } from "../../Definition/Model";
import StratumOrder from "../../Definition/StratumOrder";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

export interface View {
  id: string;
  name: string;
  assetType: string;
  attribution?: string;
  averageRating?: number;
  blobFilename?: string;
  blobFileSize?: number;
  blobId?: string;
  blobMimeType?: string;
  category?: string;
  createdAt?: number;
  description?: string;
  displayType: string;
  downloadCount?: number;
  hideFromCatalog?: boolean;
  hideFromDataJson?: boolean;
  indexUpdatedAt?: number;
  licenseId?: string;
  newBackend?: boolean;
  numberOfComments?: number;
  oid?: number;
  previewImageId?: string;
  provenance?: string;
  publicationAppendEnabled?: boolean;
  publicationDate?: number;
  publicationGroup?: number;
  publicationStage?: string;
  tableId?: number;
  totalTimesRated?: number;
  viewCount?: number;
  viewLastModified?: number;
  viewType?: string;
  approvals: unknown;
  childViews?: string[];
  columns: unknown;
  displayFormat: unknown;
  grants: unknown;
  license?: {
    name?: string;
    logoUrl?: string;
    termsLink?: string;
  };
  metadata: {
    geo: {
      bbox?: string;
      owsUrl?: string;
      namespace?: string;
      layer?: string;
      featureIdAttribute?: string;
      bboxCrs?: string;
      isNbe?: boolean;
    };
    custom_fields: unknown;
    availableDisplayTypes?: string[];
    renderTypeConfig: unknown;
  };
  owner: unknown;
  query: unknown;
  rights?: string[];
  tableAuthor: unknown;
  tags: string[];
  flags: string[];
}

/** This will fetch `views` for a given Socrata `resourceId`.
 * From the JSON response we get `childViews` - which can be used to generate a URL to fetch GeoJSON
 */
export class SocrataMapViewStratum extends LoadableStratum(
  SocrataMapViewCatalogItemTraits
) {
  static stratumName = "socrataMapView";

  static async load(
    catalogGroup: SocrataMapViewCatalogItem
  ): Promise<SocrataMapViewStratum> {
    if (!catalogGroup.url) throw "`url` must be set";
    if (!catalogGroup.resourceId) throw "`resourceId` must be set";

    const viewResponse = await loadJson(
      proxyCatalogItemUrl(
        catalogGroup,
        `${catalogGroup.url}/views/${catalogGroup.resourceId}`
      )
    );

    if (viewResponse.error) {
      throw viewResponse.message ?? viewResponse.error;
    }

    return new SocrataMapViewStratum(catalogGroup, viewResponse as View);
  }

  @computed get geojsonUrl() {
    if (this.view?.childViews?.[0])
      return `${this.catalogItem.url}/resource/${this.view.childViews[0]}.geojson?$limit=10000`;
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new SocrataMapViewStratum(
      model as SocrataMapViewCatalogItem,
      this.view
    ) as this;
  }

  constructor(
    private readonly catalogItem: SocrataMapViewCatalogItem,
    private readonly view: View
  ) {
    super();
    makeObservable(this);
  }
}

StratumOrder.addLoadStratum(SocrataMapViewStratum.stratumName);

/**
 * Use the Socrata `views` API to fetch data.
 * This mimics how Socrata portal map visualisation works - it isn't an official API
 */
export default class SocrataMapViewCatalogItem extends GeoJsonMixin(
  CreateModel(SocrataMapViewCatalogItemTraits)
) {
  static readonly type = "socrata-map-item";

  get type() {
    return SocrataMapViewCatalogItem.type;
  }

  protected async forceLoadMetadata(): Promise<void> {
    if (!this.strata.has(SocrataMapViewStratum.stratumName)) {
      const stratum = await SocrataMapViewStratum.load(this);
      runInAction(() => {
        this.strata.set(SocrataMapViewStratum.stratumName, stratum);
      });
    }
  }

  protected async forceLoadGeojsonData() {
    if (this.geojsonUrl) {
      const result = await loadJson(proxyCatalogItemUrl(this, this.geojsonUrl));

      const fc = toFeatureCollection(result);
      if (fc) return fc;
      else throw TerriaError.from("Failed to parse geoJSON");
    }

    throw TerriaError.from("Failed to fetch geoJSON - no URL was provided");
  }
}
