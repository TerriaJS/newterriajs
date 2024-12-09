import i18next from "i18next";
import { action, computed, makeObservable, override, runInAction } from "mobx";
import { createTransformer } from "mobx-utils";
import URI from "urijs";
import isDefined from "../../../Core/isDefined";
import { isJsonString } from "../../../Core/Json";
import loadJson from "../../../Core/loadJson";
import ReferenceMixin from "../../../ModelMixins/ReferenceMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import ModelTraits from "../../../Traits/ModelTraits";
import { InfoSectionTraits } from "../../../Traits/TraitsClasses/CatalogMemberTraits";
import CkanItemReferenceTraits from "../../../Traits/TraitsClasses/CkanItemReferenceTraits";
import CkanResourceFormatTraits from "../../../Traits/TraitsClasses/CkanResourceFormatTraits";
import CkanSharedTraits from "../../../Traits/TraitsClasses/CkanSharedTraits";
import { RectangleTraits } from "../../../Traits/TraitsClasses/MappableTraits";
import CommonStrata from "../../Definition/CommonStrata";
import CreateModel from "../../Definition/CreateModel";
import createStratumInstance from "../../Definition/createStratumInstance";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel } from "../../Definition/Model";
import ModelPropertiesFromTraits from "../../Definition/ModelPropertiesFromTraits";
import StratumFromTraits from "../../Definition/StratumFromTraits";
import StratumOrder from "../../Definition/StratumOrder";
import Terria from "../../Terria";
import CatalogMemberFactory from "../CatalogMemberFactory";
import WebMapServiceCatalogGroup from "../Ows/WebMapServiceCatalogGroup";
import WebMapServiceCatalogItem from "../Ows/WebMapServiceCatalogItem";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import CkanCatalogGroup, {
  createInheritedCkanSharedTraitsStratum
} from "./CkanCatalogGroup";
import CkanDefaultFormatsStratum from "./CkanDefaultFormatsStratum";
import {
  CkanDataset,
  CkanDatasetServerResponse,
  CkanResource,
  CkanResourceServerResponse
} from "./CkanDefinitions";

export class CkanDatasetStratum extends LoadableStratum(
  CkanItemReferenceTraits
) {
  static stratumName = "ckanDataset";

  constructor(
    private readonly ckanItemReference: CkanItemReference,
    private readonly ckanCatalogGroup: CkanCatalogGroup | undefined
  ) {
    super();
    makeObservable(this);
  }

  duplicateLoadableStratum(_newModel: BaseModel): this {
    return new CkanDatasetStratum(
      this.ckanItemReference,
      this.ckanCatalogGroup
    ) as this;
  }

  static async load(
    ckanItemReference: CkanItemReference,
    ckanCatalogGroup: CkanCatalogGroup | undefined
  ) {
    if (ckanItemReference._ckanDataset === undefined) {
      // If we've got a dataset and no defined resource
      if (
        ckanItemReference.datasetId !== undefined &&
        ckanItemReference.resourceId !== undefined
      ) {
        ckanItemReference._ckanDataset =
          await loadCkanDataset(ckanItemReference);
        ckanItemReference._ckanResource = findResourceInDataset(
          ckanItemReference._ckanDataset,
          ckanItemReference.resourceId
        );
        ckanItemReference.setSupportedFormatFromResource(
          ckanItemReference._ckanResource
        );
      } else if (
        ckanItemReference.datasetId !== undefined &&
        ckanItemReference.resourceId === undefined
      ) {
        ckanItemReference._ckanDataset =
          await loadCkanDataset(ckanItemReference);
        const matched = getSupportedFormats(
          ckanItemReference._ckanDataset,
          ckanItemReference.preparedSupportedFormats
        );
        if (matched[0] === undefined) return undefined;
        ckanItemReference._ckanResource = matched[0].resource;
        ckanItemReference._supportedFormat = matched[0].format;
      } else if (
        ckanItemReference.datasetId === undefined &&
        ckanItemReference.resourceId !== undefined
      ) {
        ckanItemReference._ckanResource =
          await loadCkanResource(ckanItemReference);
        ckanItemReference._supportedFormat = isResourceInSupportedFormats(
          ckanItemReference._ckanResource,
          ckanItemReference.preparedSupportedFormats
        );
      }
    }
    return new CkanDatasetStratum(ckanItemReference, ckanCatalogGroup);
  }

  @computed get ckanDataset(): CkanDataset | undefined {
    return this.ckanItemReference._ckanDataset;
  }

  @computed get ckanResource(): CkanResource | undefined {
    return this.ckanItemReference._ckanResource;
  }

  @computed get url() {
    return getCkanItemResourceUrl(this.ckanItemReference);
  }

  @computed get name() {
    return getCkanItemName(this.ckanItemReference);
  }

  @computed get rectangle() {
    if (this.ckanDataset === undefined) return undefined;
    if (this.ckanDataset.extras !== undefined) {
      const out: number[] = [];
      this.ckanDataset.extras.forEach((e) => {
        if (e.key === "bbox-west-long") out[0] = parseFloat(e.value);
        if (e.key === "bbox-south-lat") out[1] = parseFloat(e.value);
        if (e.key === "bbox-north-lat") out[2] = parseFloat(e.value);
        if (e.key === "bbox-east-long") out[3] = parseFloat(e.value);
      });
      if (out.length === 4) {
        return createStratumInstance(RectangleTraits, {
          west: out[0],
          south: out[1],
          east: out[2],
          north: out[3]
        });
      }
    }
    if (this.ckanDataset.geo_coverage !== undefined) {
      const bboxString = this.ckanDataset.geo_coverage;
      const parts = bboxString.split(",");
      if (parts.length === 4) {
        return createStratumInstance(RectangleTraits, {
          west: parseInt(parts[0], 10),
          south: parseInt(parts[1], 10),
          east: parseInt(parts[2], 10),
          north: parseInt(parts[3], 10)
        });
      }
    }
    if (
      isDefined(this.ckanDataset.spatial) &&
      this.ckanDataset.spatial !== ""
    ) {
      const gj = JSON.parse(this.ckanDataset.spatial);
      if (gj.type === "Polygon" && gj.coordinates[0].length === 5) {
        return createStratumInstance(RectangleTraits, {
          west: gj.coordinates[0][0][0],
          south: gj.coordinates[0][0][1],
          east: gj.coordinates[0][2][0],
          north: gj.coordinates[0][2][1]
        });
      }
    }
    return undefined;
  }

  @computed get info() {
    function prettifyDate(date: string) {
      if (date.match(/^\d\d\d\d-\d\d-\d\d.*/)) {
        return date.substr(0, 10);
      } else return date;
    }

    const outArray: StratumFromTraits<InfoSectionTraits>[] = [];
    if (this.ckanDataset === undefined) return outArray;
    if (this.ckanDataset.license_url !== undefined) {
      outArray.push(
        createStratumInstance(InfoSectionTraits, {
          name: i18next.t("models.ckan.licence"),
          content: `[${
            this.ckanDataset.license_title || this.ckanDataset.license_url
          }](${this.ckanDataset.license_url})`
        })
      );
    } else if (this.ckanDataset.license_title !== undefined) {
      outArray.push(
        createStratumInstance(InfoSectionTraits, {
          name: i18next.t("models.ckan.licence"),
          content: this.ckanDataset.license_title
        })
      );
    }

    outArray.push(
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t("models.ckan.contact_point"),
        content: this.ckanDataset.contact_point
      }),
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t("models.ckan.datasetDescription"),
        content: this.ckanDataset.notes
      }),
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t("models.ckan.author"),
        content: this.ckanDataset.author
      })
    );

    if (this.ckanDataset.organization) {
      outArray.push(
        createStratumInstance(InfoSectionTraits, {
          name: i18next.t("models.ckan.datasetCustodian"),
          content:
            this.ckanDataset.organization.description ||
            this.ckanDataset.organization.title
        })
      );
    }

    outArray.push(
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t("models.ckan.metadata_created"),
        content: prettifyDate(this.ckanDataset.metadata_created)
      }),
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t("models.ckan.metadata_modified"),
        content: prettifyDate(this.ckanDataset.metadata_modified)
      }),
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t("models.ckan.update_freq"),
        content: this.ckanDataset.update_freq
      })
    );
    return outArray;
  }

  /** Set isGroup = true if this turns into WMS Group (See CkanItemReference.forceLoadReference for more info) */
  @computed get isGroup() {
    if (
      this.ckanItemReference._supportedFormat?.definition?.type ===
        WebMapServiceCatalogItem.type &&
      !this.ckanItemReference.wmsLayers
    )
      return true;
  }
}

StratumOrder.addLoadStratum(CkanDatasetStratum.stratumName);

export default class CkanItemReference extends UrlMixin(
  ReferenceMixin(CreateModel(CkanItemReferenceTraits))
) {
  static readonly type = "ckan-item";

  constructor(
    id: string | undefined,
    terria: Terria,
    sourceReference?: BaseModel,
    strata?: Map<string, StratumFromTraits<ModelTraits>>
  ) {
    super(id, terria, sourceReference, strata);
    makeObservable(this);
    this.strata.set(
      CkanDefaultFormatsStratum.stratumName,
      new CkanDefaultFormatsStratum()
    );
  }

  get type() {
    return CkanItemReference.type;
  }

  get typeName() {
    return i18next.t("models.ckan.name");
  }

  _ckanDataset: CkanDataset | undefined = undefined;
  _ckanResource: CkanResource | undefined = undefined;
  _ckanCatalogGroup: CkanCatalogGroup | undefined = undefined;
  _supportedFormat: PreparedSupportedFormat | undefined = undefined;

  @computed
  get preparedSupportedFormats(): PreparedSupportedFormat[] {
    return this.supportedResourceFormats
      ? this.supportedResourceFormats.map(prepareSupportedFormat)
      : [];
  }

  setDataset(ckanDataset: CkanDataset) {
    this._ckanDataset = ckanDataset;
  }

  setResource(ckanResource: CkanResource) {
    this._ckanResource = ckanResource;
  }

  setCkanCatalog(ckanCatalogGroup: CkanCatalogGroup) {
    this._ckanCatalogGroup = ckanCatalogGroup;
  }

  setSupportedFormat(format: PreparedSupportedFormat | undefined) {
    this._supportedFormat = format;
  }

  setSupportedFormatFromResource(resource: CkanResource | undefined) {
    this._supportedFormat = isResourceInSupportedFormats(
      resource,
      this.preparedSupportedFormats
    );
  }

  @override
  get cacheDuration(): string {
    if (isDefined(super.cacheDuration)) {
      return super.cacheDuration;
    }
    return "1d";
  }

  // We will first attach this to the CkanItemReference
  // and then we'll attach it to the target model
  // I wonder if it needs to be on both?
  async setCkanStrata(model: BaseModel) {
    const stratum = await CkanDatasetStratum.load(this, this._ckanCatalogGroup);
    if (stratum === undefined) return;
    runInAction(() => {
      model.strata.set(CkanDatasetStratum.stratumName, stratum);
    });
  }

  @action
  setSharedStratum(
    inheritedPropertiesStratum: Readonly<StratumFromTraits<CkanSharedTraits>>
  ) {
    // The values in this stratum should not be updated as the same object is used
    //  in all CkanItemReferences
    this.strata.set(
      createInheritedCkanSharedTraitsStratum.stratumName,
      inheritedPropertiesStratum
    );
  }

  async forceLoadReference(
    _previousTarget: BaseModel | undefined
  ): Promise<BaseModel | undefined> {
    await this.setCkanStrata(this);

    if (this._supportedFormat === undefined) return undefined;

    const type = (this._supportedFormat.definition ?? {}).type;

    if (typeof type !== "string") return undefined;

    let model: BaseModel | undefined;

    // Special case for WMS
    // Check for `layers` before creating model
    // If WMS layers have been found - create WebMapServiceCatalogItem
    // If no WMS layers are found - create WebMapServiceCatalogGroup
    if (type === WebMapServiceCatalogItem.type) {
      // If WMS layers have been found
      if (this.wmsLayers) {
        model = new WebMapServiceCatalogItem(this.uniqueId, this.terria, this);
        model.setTrait(
          CommonStrata.definition,
          "layers",
          decodeURI(this.wmsLayers)
        );
      }
      // if no WMS layers are found
      else {
        model = new WebMapServiceCatalogGroup(this.uniqueId, this.terria, this);
      }
    } else {
      model = CatalogMemberFactory.create(
        type,
        this.uniqueId,
        this.terria,
        this
      );
    }

    if (model === undefined) return;
    await this.setCkanStrata(model);

    model.setTrait(CommonStrata.definition, "name", this.name);

    return model;
  }

  @computed get wmsLayers() {
    const params: Record<string, string | undefined> | undefined = new URI(
      getCkanItemResourceUrl(this)
    )?.search(true);

    const layersFromItemProperties =
      this.itemPropertiesByIds?.find(
        (itemProps) => this.uniqueId && itemProps.ids.includes(this.uniqueId)
      )?.itemProperties?.layers ??
      this.itemPropertiesByType?.find(
        (itemProps) => itemProps.type === WebMapServiceCatalogItem.type
      )?.itemProperties?.layers ??
      this.itemProperties?.layers;

    // Mixing ?? and || because for params we don't want to use empty string params if there are non-empty string parameters
    const rawLayers =
      (isJsonString(layersFromItemProperties)
        ? layersFromItemProperties
        : undefined) ??
      this._ckanResource?.wms_layer ??
      (params?.LAYERS || params?.layers || params?.typeName);

    // Improve the robustness.
    const cleanLayers = rawLayers
      ?.split(",")
      .map((layer) => layer.trim())
      .join(",");
    return cleanLayers;
  }
}

export interface CkanResourceWithFormat {
  format: PreparedSupportedFormat;
  resource: CkanResource;
}

export interface PreparedSupportedFormat
  extends ModelPropertiesFromTraits<CkanResourceFormatTraits> {
  formatRegexParsed: RegExp | undefined;
  urlRegexParsed: RegExp | undefined;
}

async function loadCkanDataset(ckanItem: CkanItemReference) {
  const uri = new URI(ckanItem.url)
    .segment("api/3/action/package_show")
    .addQuery({ id: ckanItem.datasetId });

  const response: CkanDatasetServerResponse = await loadJson(
    proxyCatalogItemUrl(ckanItem, uri.toString())
  );
  if (response.result) return response.result;
  return undefined;
}

async function loadCkanResource(ckanItem: CkanItemReference) {
  const uri = new URI(ckanItem.url)
    .segment("api/3/action/resource_show")
    .addQuery({ id: ckanItem.resourceId });

  const response: CkanResourceServerResponse = await loadJson(
    proxyCatalogItemUrl(ckanItem, uri.toString())
  );
  if (response.result) return response.result;
  return undefined;
}

function findResourceInDataset(
  ckanDataset: CkanDataset | undefined,
  resourceId: string
) {
  if (ckanDataset === undefined) return undefined;
  for (let i = 0; i < ckanDataset.resources.length; ++i) {
    if (ckanDataset.resources[i].id === resourceId) {
      return ckanDataset.resources[i];
    }
  }
  return undefined;
}

export const prepareSupportedFormat = createTransformer(
  (format: ModelPropertiesFromTraits<CkanResourceFormatTraits>) => {
    return {
      id: format.id,
      definition: format.definition,
      maxFileSize: format.maxFileSize,
      removeDuplicates: format.removeDuplicates,
      onlyUseIfSoleResource: format.onlyUseIfSoleResource,
      formatRegex: format.formatRegex,
      urlRegex: format.urlRegex,

      formatRegexParsed: format.formatRegex
        ? new RegExp(format.formatRegex, "i")
        : undefined,
      urlRegexParsed: format.urlRegex
        ? new RegExp(format.urlRegex, "i")
        : undefined
    };
  }
);

export function getSupportedFormats(
  dataset: CkanDataset | undefined,
  formats: PreparedSupportedFormat[]
) {
  if (!dataset) return [];
  const supported: CkanResourceWithFormat[] = [];
  for (let i = 0; i < formats.length; ++i) {
    const format = formats[i];
    for (let j = 0; j < dataset.resources.length; ++j) {
      const resource = dataset.resources[j];
      if (resourceIsSupported(resource, format)) {
        supported.push({ resource: resource, format: format });
      }
    }
  }

  return supported;
}

export function isResourceInSupportedFormats(
  resource: CkanResource | undefined,
  formats: PreparedSupportedFormat[]
): PreparedSupportedFormat | undefined {
  if (resource === undefined) return undefined;
  for (let i = 0; i < formats.length; ++i) {
    const format = formats[i];
    if (resourceIsSupported(resource, format)) return format;
  }
  return undefined;
}

export function resourceIsSupported(
  resource: CkanResource,
  format: PreparedSupportedFormat
) {
  let match = false;

  // Does format match (formatRegex is required)
  if (!isDefined(format.formatRegexParsed)) return false;

  if (format.formatRegexParsed.test(resource.format)) {
    match = true;
  }

  // Does URL match (urlRegex is optional)
  if (
    match &&
    isDefined(format.urlRegexParsed) &&
    !format.urlRegexParsed.test(resource.url)
  ) {
    match = false;
  }

  // Is resource.size (in bytes) greater than maxFileSize? (maxFileSize is optional)
  if (
    match &&
    isDefined(format.maxFileSize) &&
    format.maxFileSize !== null &&
    isDefined(resource.size) &&
    resource.size !== null &&
    resource.size / (1024 * 1024) > format.maxFileSize
  ) {
    match = false;
  }

  return match;
}

export function getCkanItemName(item: CkanItemReference) {
  if (!item._ckanResource) return;

  if (item.useResourceName) return item._ckanResource.name;
  // via @steve9164
  /** Switched the order [check `useCombinationNameWhereMultipleResources`
   * first ] that these are checked so the default is checked last. Otherwise
   * setting useCombinationNameWhereMultipleResources without setting
   * useDatasetNameAndFormatWhereMultipleResources to false doesn't do
   * anything */
  if (item._ckanDataset) {
    if (
      item.useCombinationNameWhereMultipleResources &&
      item._ckanDataset.resources.length > 1
    ) {
      return item._ckanDataset.title + " - " + item._ckanResource.name;
    }
    if (
      item.useDatasetNameAndFormatWhereMultipleResources &&
      item._ckanDataset.resources.length > 1
    ) {
      return item._ckanDataset.title + " - " + item._ckanResource.format;
    }
    return item._ckanDataset.title;
  }
  return item._ckanResource.name;
}

function getCkanItemResourceUrl(item: CkanItemReference) {
  if (item._ckanResource === undefined) return undefined;
  if (item._supportedFormat !== undefined) {
    if (
      (item._supportedFormat.definition ?? {}).type === "wms" &&
      item._ckanResource.wms_api_url
    ) {
      return item._ckanResource.wms_api_url;
    }
  }
  return item._ckanResource.url;
}
