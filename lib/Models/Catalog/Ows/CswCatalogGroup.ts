import i18next from "i18next";
import { flatten } from "lodash-es";
import { action, computed, runInAction, makeObservable } from "mobx";
import URI from "urijs";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import isDefined from "../../../Core/isDefined";
import loadWithXhr from "../../../Core/loadWithXhr";
import loadXML from "../../../Core/loadXML";
import runLater from "../../../Core/runLater";
import TerriaError, { networkRequestError } from "../../../Core/TerriaError";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import GroupMixin from "../../../ModelMixins/GroupMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import xml2json from "../../../ThirdParty/xml2json";
import { InfoSectionTraits } from "../../../Traits/TraitsClasses/CatalogMemberTraits";
import CswCatalogGroupTraits, {
  QueryPropertyName
} from "../../../Traits/TraitsClasses/CswCatalogGroupTraits";
import ModelReference from "../../../Traits/ModelReference";
import ArcGisMapServerCatalogItem from "../Esri/ArcGisMapServerCatalogItem";
import CatalogGroup from "../CatalogGroup";
import CommonStrata from "../../Definition/CommonStrata";
import CreateModel from "../../Definition/CreateModel";
import CsvCatalogItem from "../CatalogItems/CsvCatalogItem";
import GeoJsonCatalogItem from "../CatalogItems/GeoJsonCatalogItem";
import KmlCatalogItem from "../CatalogItems/KmlCatalogItem";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel, ModelConstructor } from "../../Definition/Model";
import { BoundingBox } from "./OwsInterfaces";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import StratumOrder from "../../Definition/StratumOrder";
import WebMapServiceCatalogItem from "./WebMapServiceCatalogItem";

const defaultGetRecordsTemplate = require("../Ows/CswGetRecordsTemplate.xml");
// WPS is disabled until wps-group support
// const wpsGetRecordsTemplate = require("./CswGetRecordsWPSTemplate.xml");

type ArrayOrPrimitive<T> = T | T[];
function toArray<T>(val: ArrayOrPrimitive<T>): T[];
function toArray<T>(val: ArrayOrPrimitive<T> | undefined): T[] | undefined {
  if (!isDefined(val)) return undefined;
  return Array.isArray(val) ? val : [val];
}

// CSW Record types source files:
// http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd
// http://schemas.opengis.net/csw/2.0.2/CSW-publication.xsd
// http://schemas.opengis.net/csw/2.0.2/csw.xsd
// http://schemas.opengis.net/csw/2.0.2/record.xsd

// Records have three types: Brief, Summary and Full
// We don't really deal with these, we just assume we have Brief and Partial<Full>
export type Record = BriefRecord & Partial<FullRecord>;

export type Records = Record[];
export interface BriefRecord {
  BoundingBox?: BoundingBox[];
  identifier: ArrayOrPrimitive<string>;
  title: ArrayOrPrimitive<string>;
  type?: string;
}

export type CswURI = string & {
  scheme?: string;
  protocol?: string;
  description?: string;
  name?: string;
};

export interface SummaryRecord extends BriefRecord {
  abstract?: ArrayOrPrimitive<string>;
  format?: ArrayOrPrimitive<string>;
  modified?: ArrayOrPrimitive<string>;
  relation?: ArrayOrPrimitive<string>;
  spatial?: ArrayOrPrimitive<string>;
  subject?: ArrayOrPrimitive<string>;
  references?: ArrayOrPrimitive<CswURI>;
  URI?: ArrayOrPrimitive<CswURI>;
}
export interface FullRecord extends SummaryRecord {
  contributor?: ArrayOrPrimitive<string>;
  creator?: ArrayOrPrimitive<string>;
  language?: ArrayOrPrimitive<string>;
  publisher?: ArrayOrPrimitive<string>;
  source?: ArrayOrPrimitive<string>;
  description?: ArrayOrPrimitive<string>;
}

/** GetDomain request is used to get actual values for some property. In general this is a
 * subset of the value domain (that is, set of permissible values),
 * although in some cases these may be the same.
 * */
export interface GetDomainResponseType {
  DomainValues: ArrayOrPrimitive<DomainValuesType>;
}

export interface DomainValuesType {
  type: string;
  uom?: string;
  ConceptualScheme?: {
    Authority: string;
    Document: string;
    Name: string;
  };
  ListOfValues?: { Value: ArrayOrPrimitive<any> };
  ParameterName: string;
  PropertyName: string;
  RangeOfValues?: {
    MaxValue: any;
    MinValue: any;
  };
}

/**
 * GetRecords request is used to get a subset of records
 */
export interface GetRecordsResponse {
  version?: string;
  RequestId?: string;
  SearchResults: SearchResultsType;
  SearchStatus: {
    timestamp?: Date;
  };
  Exception?: any;
}

export interface SearchResultsType {
  /** The element set that has been returned (i.e., "brief", "summary", "full") are defined in an application profile. */
  elementSet?: "brief" | "summary" | "full";
  expires?: Date;
  /** position of next record in the result set (0 if no records remain) */
  nextRecord?: string | number;
  /** number of records matched by the query */
  numberOfRecordsMatched: string | number;
  /** number of records returned to client */
  numberOfRecordsReturned: string | number;
  recordSchema?: string;
  resultSetId?: string;
  Record?: Records;
}

/**
 * MetadataGroups are used to represent groups generated from GetDomain request. Most important bits are `groupName`, `children`, and `records` - which are used to create catalog structure tree.
 */
export interface MetadataGroup {
  field: QueryPropertyName | undefined;
  value: string;
  regex: boolean;
  groupName: string;
  children: MetadataGroup[];
  records: Records;
}

class CswStratum extends LoadableStratum(CswCatalogGroupTraits) {
  static stratumName = "CswStratum";
  static async load(catalogGroup: CswCatalogGroup): Promise<CswStratum> {
    if (catalogGroup.url === undefined) {
      throw new TerriaError({
        title: i18next.t("models.csw.missingUrlTitle"),
        message: i18next.t("models.csw.missingUrlMessage")
      });
    }

    const metadataGroups: MetadataGroup[] = [];

    /**
     * If domainSpecification properties are set (and we aren't flattening the catalog) - we will try to create MetadataGroups * from a GetDomain response (using the specified domainPropertyName).
     *
     * An example GetDomain response (see wwwroot\test\csw\Example1GetDomain.xml):
     * ...
     * <csw:Value>Multiple Use | Fisheries Effort</csw:Value>
     * <csw:Value>Multiple Use | Pollution</csw:Value>
     * <csw:Value>Multiple Use | Sea Surface Temperature</csw:Value>
     * <csw:Value>Multiple Use | Seismic Surveys</csw:Value>
     * <csw:Value>Multiple Use | Shipping</csw:Value>
     * ...
     *
     * These strings are used to generate MetadataGroups with:
     * - Hierarchy separator used to split strings into pieces (domainSpecification.hierarchySeparator = " | ")
     * - Query property name used to match values to Records (domainSpecification.queryPropertyName = "subject"). That is to say, we will search through Record["subject"] to add Records to sepcific MetadataGroups
     */
    if (
      !catalogGroup.flatten &&
      catalogGroup.domainSpecification.domainPropertyName &&
      catalogGroup.domainSpecification.hierarchySeparator &&
      catalogGroup.domainSpecification.queryPropertyName
    ) {
      const getDomainUrl = new URI(
        proxyCatalogItemUrl(catalogGroup, catalogGroup.url)
      ).query({
        service: "CSW",
        version: "2.0.2",
        request: "GetDomain",
        propertyname: catalogGroup.domainSpecification.domainPropertyName
      });

      let domainResponse: GetDomainResponseType | undefined;
      try {
        const xml = await loadXML(getDomainUrl.toString());

        if (
          !xml ||
          !xml.documentElement ||
          xml.documentElement.localName !== "GetDomainResponse"
        ) {
          throw `Invalid XML response`;
        }
        const json = xml2json(xml);
        if (!json || typeof json === "string") throw `Invalid XML response`;
        domainResponse = json as unknown as GetDomainResponseType;
      } catch (error) {
        console.log(error);
        throw networkRequestError({
          sender: catalogGroup,
          title: i18next.t("models.csw.notUseableTitle"),
          message: i18next.t("models.csw.notUseableMessage")
        });
      }

      if (!domainResponse) {
        throw networkRequestError({
          sender: catalogGroup,
          title: i18next.t("models.csw.errorLoadingTitle"),
          message: i18next.t("models.csw.checkCORSDomain")
        });
      }

      // Get flat listOfValues
      const listOfValues: string[] = flatten(
        toArray(domainResponse.DomainValues)?.map((d) =>
          toArray(d?.ListOfValues?.Value)
        )
      ).filter((v) => typeof v === "string");

      // Create metadataGroups from listOfValues
      listOfValues.forEach((value) => {
        const keys = value.split(
          catalogGroup.domainSpecification.hierarchySeparator!
        );
        // recursively find the group that the last key in keys should belong to and add that key
        addMetadataGroups(
          keys,
          0,
          metadataGroups,
          catalogGroup.domainSpecification.hierarchySeparator!,
          catalogGroup.domainSpecification.queryPropertyName
        );
      });
    }

    // Get Records
    let paging = true;
    let startPosition = 1;

    const records: Records = [];

    // We have to paginate through Records
    while (paging) {
      // Replace {startPosition}
      const postData = (
        catalogGroup.getRecordsTemplate ?? defaultGetRecordsTemplate
      ).replace("{startPosition}", startPosition);

      const xml = await loadWithXhr({
        url: proxyCatalogItemUrl(
          catalogGroup,
          new URI(catalogGroup.url).query("").toString(),
          "1d"
        ),
        responseType: "document",
        method: "POST",
        overrideMimeType: "text/xml",
        data: postData,
        headers: {
          "Content-Type": "application/xml"
        }
      });

      if (!isDefined(xml)) {
        throw networkRequestError({
          sender: catalogGroup,
          title: i18next.t("models.csw.errorLoadingRecordsTitle"),
          message: i18next.t("models.csw.errorLoadingRecordsMessage")
        });
      }

      const jsonOut = xml2json(xml);
      if (!jsonOut || typeof jsonOut === "string" || jsonOut.Exception) {
        let errorMessage = i18next.t("models.csw.unknownError");
        if (
          jsonOut &&
          typeof jsonOut !== "string" &&
          jsonOut.Exception?.ExceptionText
        ) {
          errorMessage = i18next.t("models.csw.exceptionMessage", {
            exceptionText: jsonOut.Exception.ExceptionText
          });
        }
        throw new TerriaError({
          sender: catalogGroup,
          title: i18next.t("models.csw.errorLoadingTitle"),
          message: errorMessage
        });
      }
      const json = jsonOut as unknown as GetRecordsResponse;

      records.push(...(json?.SearchResults?.Record ?? []));

      // Get next start position - or stop pageing
      const nextRecord =
        typeof json?.SearchResults?.nextRecord === "string"
          ? parseInt(json?.SearchResults?.nextRecord ?? "0", 10)
          : json?.SearchResults?.nextRecord;

      const numberOfRecordsMatched =
        typeof json?.SearchResults?.numberOfRecordsMatched === "string"
          ? parseInt(json?.SearchResults?.numberOfRecordsMatched ?? "0", 10)
          : json?.SearchResults?.numberOfRecordsMatched;
      if (
        !isDefined(nextRecord) ||
        nextRecord === 0 ||
        nextRecord >= numberOfRecordsMatched
      ) {
        paging = false;
      } else {
        startPosition = nextRecord;
      }
    }

    // If we have metadataGroups, add records to them
    if (metadataGroups.length > 0) {
      records.forEach((record) => {
        findGroup(metadataGroups, record)?.records.push(record);
      });
    }

    return new CswStratum(catalogGroup, metadataGroups, records);
  }

  constructor(
    readonly catalogGroup: CswCatalogGroup,
    readonly metadataGroups: MetadataGroup[],
    readonly records: Records
  ) {
    super();
    makeObservable(this);
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new CswStratum(
      model as CswCatalogGroup,
      this.metadataGroups,
      this.records
    ) as this;
  }

  @computed
  get members(): ModelReference[] {
    // If no metadataGroups - return flat list of record ids
    if (this.metadataGroups.length === 0) {
      return this.records.map(
        (r) => `${this.catalogGroup.uniqueId}/${r.identifier}`
      );
    }
    return this.metadataGroups.map(
      (g) => `${this.catalogGroup.uniqueId}/${g.groupName}`
    );
  }

  @action
  createMembersFromLayers() {
    // If no metadata groups -> just create all records
    if (this.metadataGroups.length === 0) {
      this.records.forEach((record) =>
        this.createRecord(this.catalogGroup.uniqueId, record)
      );

      // If metadata groups -> create them (records will then be created for each group)
    } else {
      this.metadataGroups.forEach((metadataGroup) =>
        this.createMetadataGroup(this.catalogGroup.uniqueId, metadataGroup)
      );
    }
  }

  @action
  createMetadataGroup(
    parentId: string | undefined,
    metadataGroup: MetadataGroup
  ): CatalogGroup {
    const layerId = `${parentId}/${metadataGroup.groupName}`;
    const existingModel = this.catalogGroup.terria.getModelById(
      CatalogGroup,
      layerId
    );
    let model: CatalogGroup;
    if (existingModel === undefined) {
      model = new CatalogGroup(layerId, this.catalogGroup.terria);
      this.catalogGroup.terria.addModel(model);
    } else {
      model = existingModel;
    }
    // Replace the stratum inherited from the parent group.
    model.strata.delete(CommonStrata.definition);
    model.setTrait(CommonStrata.definition, "name", metadataGroup.groupName);
    model.setTrait(
      CommonStrata.definition,
      "members",
      filterOutUndefined([
        ...metadataGroup.children.map(
          (childMetadataGroup) =>
            this.createMetadataGroup(layerId, childMetadataGroup).uniqueId
        ),
        ...metadataGroup.records.map(
          (record) => this.createRecord(layerId, record)?.uniqueId
        )
      ])
    );

    return model;
  }

  @action
  createRecord(
    parentId: string | undefined,
    record: Record
  ): BaseModel | undefined {
    const uris = toArray(record.URI ?? record.references);
    if (!isDefined(uris)) {
      return;
    }
    /**
     * Array of acceptable URLS for catalog item. Its indices map to resourceFormats' index.
     * For example - if `acceptableUrls[1]` is defined, it maps to `resourceFormats[1]` - which is a ArcGisMapServerCatalogItem
     */
    const acceptableUris: CswURI[] = [];

    /**
     * There may be more than one url that results in a data layer here - so check for
     * the acceptable ones, store the others as downloadUrls that can be
     * displayed in the metadata summary for the layer
     */
    const downloadUrls: { url: string; description?: string }[] = [];

    let legendUri: CswURI | undefined = undefined;

    const filteredResourceFormats = this.resourceFormats.filter(
      (f) => f.enabled
    );

    for (let m = 0; m < uris.length; m++) {
      const uri = uris[m];
      if (!uri) return;
      const resourceIndex = filteredResourceFormats.findIndex((f) =>
        (uri!.protocol ?? uri!.scheme)?.match(f.regex)
      );

      // If matching resource is found, and an acceptable URL hasn't been set for it -> add it
      if (resourceIndex !== -1 && !acceptableUris[resourceIndex]) {
        acceptableUris[resourceIndex] = uri;
      } else {
        if (uri?.description === "LegendUrl") {
          legendUri = uri;
        }
        downloadUrls.push({
          url: uri.toString(),
          description: uri.description ? uri.description : uri.name
        });
      }
    }

    const layerId = `${parentId}/${record.identifier}`;
    const urlIndex = acceptableUris.findIndex((url) => isDefined(url));

    if (urlIndex !== -1) {
      const modelConstructor = this.resourceFormats[urlIndex].contructor;
      const existingModel = this.catalogGroup.terria.getModelById(
        modelConstructor,
        layerId
      );
      let model: BaseModel;
      if (existingModel === undefined) {
        model = new modelConstructor(layerId, this.catalogGroup.terria);
        this.catalogGroup.terria.addModel(model);
      } else {
        model = existingModel;
      }
      // Replace the stratum inherited from the parent group.
      model.strata.delete(CommonStrata.definition);

      model.setTrait(
        CommonStrata.definition,
        "name",
        record.title ?? record.identifier
      );
      const uri = acceptableUris[urlIndex];
      model.setTrait(CommonStrata.definition, "url", uri.toString());

      if (record.abstract) {
        model.setTrait(
          CommonStrata.definition,
          "description",
          toArray(record.abstract)?.join("\n\n")
        );
      } else if (record.description) {
        model.setTrait(
          CommonStrata.definition,
          "description",
          toArray(record.description)?.join("\n\n")
        );
      }

      const infoSections: InfoSectionTraits[] = [];

      if (record.contributor && toArray(record.contributor).length > 0) {
        infoSections.push({
          name: i18next.t("models.csw.dataResponsibility"),
          content: toArray(record.contributor)?.join("\n\n")
        });
      }

      infoSections.push({
        name: i18next.t("models.csw.links"),
        content: downloadUrls
          .map((d) => `[${d.description}](${d.url})`)
          .join("\n\n")
      });

      model.setTrait(CommonStrata.definition, "info", infoSections);

      model.setTrait(CommonStrata.definition, "metadataUrls", [
        {
          title: i18next.t("models.csw.metadataURL"),
          url: new URI(
            proxyCatalogItemUrl(this.catalogGroup, this.catalogGroup.url!)
          )
            .query({
              service: "CSW",
              version: "2.0.2",
              request: "GetRecordById",
              outputSchema: "http://www.opengis.net/cat/csw/2.0.2",
              ElementSetName: "full",
              id: record.identifier
            })
            .toString()
        }
      ]);

      if (legendUri) {
        model.setTrait(CommonStrata.definition, "legends", [
          { url: legendUri.toString() }
        ]);
      }

      // If this is a WMS item, we MUST set `layers` trait to `uri.name`
      if (model instanceof WebMapServiceCatalogItem) {
        if (!uri.name) {
          return;
        }
        model.setTrait(CommonStrata.definition, "layers", uri.name);
      }

      // Same with ArcGis MapServer
      if (model instanceof ArcGisMapServerCatalogItem) {
        if (!uri.name) {
          return;
        }
        model.setTrait(CommonStrata.definition, "layers", uri.name);
      }

      return model;
    }
  }

  /**
   * These are used to match URLs to model constructors
   */
  @computed get resourceFormats(): {
    enabled: boolean;
    regex: RegExp;
    contructor: ModelConstructor<BaseModel>;
  }[] {
    return [
      {
        enabled: this.catalogGroup.includeWms,
        regex: new RegExp(this.catalogGroup.wmsResourceFormat, "i"),
        contructor: WebMapServiceCatalogItem
      },
      {
        enabled: this.catalogGroup.includeEsriMapServer,
        regex: new RegExp(this.catalogGroup.esriMapServerResourceFormat, "i"),
        contructor: ArcGisMapServerCatalogItem
      },
      {
        enabled: this.catalogGroup.includeKml,
        regex: new RegExp(this.catalogGroup.kmlResourceFormat, "i"),
        contructor: KmlCatalogItem
      },
      {
        enabled: this.catalogGroup.includeGeoJson,
        regex: new RegExp(this.catalogGroup.geoJsonResourceFormat, "i"),
        contructor: GeoJsonCatalogItem
      },
      {
        enabled: this.catalogGroup.includeCsv,
        regex: new RegExp(this.catalogGroup.csvResourceFormat, "i"),
        contructor: CsvCatalogItem
      }
    ];
  }
}

/**
 * Recursively add MetadataGroups from keys (which are split DomainValue)
 */
function addMetadataGroups(
  keys: string[],
  index: number,
  group: MetadataGroup[],
  separator: string,
  queryField: QueryPropertyName
) {
  if (index > keys.length - 1) return;

  let groupIndex = group.findIndex((g) => g.groupName === keys[index]);

  if (groupIndex === -1) {
    // not found so add it
    let value: string;
    let regex = true;
    // if we aren't at the last key, use a regex and tack on another separator to avoid mismatches
    if (index + 1 !== keys.length) {
      const sepRegex = separator.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      value = "^" + keys.slice(0, index + 1).join(sepRegex) + sepRegex;
    } else {
      value = keys.slice(0, index + 1).join(separator);
      regex = false;
    }

    group.push({
      field: queryField,
      value: value,
      regex: regex,
      groupName: keys[index],
      children: [],
      records: []
    });
    groupIndex = group.length - 1;
  }
  addMetadataGroups(
    keys,
    index + 1,
    group[groupIndex].children,
    separator,
    queryField
  );
}

// find groups that the record belongs to
function findGroup(
  metadataGroups: MetadataGroup[],
  record: Record
): MetadataGroup | undefined {
  for (let i = 0; i < metadataGroups.length; i++) {
    const group = metadataGroups[i];
    if (group.field) {
      const fields = filterOutUndefined(toArray(record[group.field]) ?? []);
      if (fields.find((f) => matchValue(group.value, f, group.regex))) {
        if (group.children) {
          // recurse to see if it fits into any of the children
          const childGroup = findGroup(group.children, record);
          if (isDefined(childGroup)) {
            return childGroup;
          }
        }

        return group;
      }
    }
  }
}

function matchValue(value: string, recordValue: string, regex?: boolean) {
  if (isDefined(regex) && regex) {
    // regular expression so parse it and check string against it
    const regExp = new RegExp(value);
    return regExp.test(recordValue);
  } else {
    return value === recordValue;
  }
}

StratumOrder.addLoadStratum(CswStratum.stratumName);

export default class CswCatalogGroup extends UrlMixin(
  GroupMixin(CatalogMemberMixin(CreateModel(CswCatalogGroupTraits)))
) {
  static readonly type = "csw-group";

  get type() {
    return CswCatalogGroup.type;
  }

  protected async forceLoadMetadata(): Promise<void> {
    if (this.strata.get(CswStratum.stratumName) !== undefined) return;
    const stratum = await CswStratum.load(this);
    runInAction(() => {
      this.strata.set(CswStratum.stratumName, stratum);
    });
  }

  protected async forceLoadMembers(): Promise<void> {
    const cswStratum = this.strata.get(CswStratum.stratumName) as
      | CswStratum
      | undefined;
    if (cswStratum) {
      await runLater(() => cswStratum.createMembersFromLayers());
    }
  }
}
