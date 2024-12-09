import i18next from "i18next";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import { isJsonObject, isJsonString } from "../../../Core/Json";
import loadXML from "../../../Core/loadXML";
import { networkRequestError } from "../../../Core/TerriaError";
import xml2json from "../../../ThirdParty/xml2json";
import {
  OnlineResource,
  OwsKeywordList,
  parseOnlineResource,
  parseOwsKeywordList
} from "./OwsInterfaces";

type Capabilities = {
  ServiceIdentification: ServiceIdentification;
  ServiceProvider?: ServiceProvider;
  ProcessOfferings: ProcessOfferings;
};

export type ProcessOfferings = Process[];

export type Process = {
  /** Process identifier */
  Identifier: string;
  /** Title of the process. */
  Title?: string;
  /** Longer narative description of the process. */
  Abstract?: string;
};

export interface ServiceIdentification {
  /** Title of the service. */
  readonly Title?: string;
  /** Longer narative description of the service. */
  readonly Abstract?: string /** Fees for this service */;
  /** Fees for this service */
  readonly Fees?: string;
  /** Access contraints for this service. */
  readonly AccessConstraints?: string;
  /** List of keywords or keyword phrases to help catalog searching. */
  readonly Keywords?: OwsKeywordList;

  readonly ServiceType: string;

  readonly ServiceTypeVersion: string[];
}

export interface ServiceProvider {
  /** A unique identifier for service provider organization. */
  readonly ProviderName?: string;
  /** Reference to the most relevant web site of the service provider. */
  readonly ProviderSite?: OnlineResource;
}

export default class WebProcessingServiceCapabilities {
  constructor(
    readonly capabilitiesXml: XMLDocument,
    readonly capabilities: Capabilities
  ) {}

  static fromUrl(url: string): Promise<WebProcessingServiceCapabilities> {
    return Promise.resolve(loadXML(url)).then(function (capabilitiesXml) {
      const capabilities = parseCapabilities(xml2json(capabilitiesXml));

      if (capabilitiesXml === undefined || capabilities === undefined) {
        throw networkRequestError({
          title: i18next.t(
            "models.webProcessingServiceCatalogGroup.invalidCapabilitiesTitle"
          ),
          message: i18next.t(
            "models.webProcessingServiceCatalogGroup.invalidCapabilitiesMessage",
            {
              url: url
            }
          )
        });
      }

      return new WebProcessingServiceCapabilities(
        capabilitiesXml,
        capabilities
      );
    });
  }

  get ServiceIdentification(): ServiceIdentification {
    return this.capabilities.ServiceIdentification;
  }

  get ServiceProvider(): ServiceProvider | undefined {
    return this.capabilities.ServiceProvider;
  }

  get ProcessOfferings(): ProcessOfferings | undefined {
    return this.capabilities.ProcessOfferings;
  }
}

function parseCapabilities(json: any): Capabilities | undefined {
  if (!isJsonObject(json)) return;

  const ServiceIdentification = parseServiceIdentification(
    json.ServiceIdentification
  );
  if (ServiceIdentification === undefined) return;

  const ServiceProvider = parseServiceProvider(json.ServiceProvider);
  const ProcessOfferings = parseProcessOfferings(json.ProcessOfferings) ?? [];
  return {
    ServiceIdentification,
    ServiceProvider,
    ProcessOfferings
  };
}

function parseServiceIdentification(
  json: any
): ServiceIdentification | undefined {
  if (!isJsonObject(json)) return;
  const ServiceType = isJsonString(json.ServiceType)
    ? json.ServiceType
    : undefined;
  const ServiceTypeVersion = isJsonString(json.ServiceTypeVersion)
    ? [json.ServiceTypeVersion]
    : Array.isArray(json.ServiceTypeVersion)
      ? filterOutUndefined(
          json.ServiceTypeVersion.map((s) => (isJsonString(s) ? s : undefined))
        )
      : undefined;

  if (
    ServiceType === undefined ||
    ServiceTypeVersion === undefined ||
    ServiceTypeVersion.length === 0
  ) {
    return;
  }

  const Title = isJsonString(json.Title) ? json.Title : undefined;
  const Abstract = isJsonString(json.Abstract) ? json.Abstract : undefined;
  const Fees = isJsonString(json.Fees) ? json.Fees : undefined;
  const AccessConstraints = isJsonString(json.AccessConstraints)
    ? json.AccessConstraints
    : undefined;
  const Keywords = parseOwsKeywordList(json);

  return {
    ServiceType,
    ServiceTypeVersion,
    Title,
    Abstract,
    Fees,
    AccessConstraints,
    Keywords
  };
}

function parseServiceProvider(json: any): ServiceProvider | undefined {
  if (!isJsonObject(json)) return;

  const ProviderName = isJsonString(json.ProviderName)
    ? json.ProviderName
    : undefined;
  const ProviderSite = parseOnlineResource(json.OnlineResource);

  return {
    ProviderName,
    ProviderSite
  };
}

function parseProcessOfferings(json: any): Process[] | undefined {
  if (!isJsonObject(json)) return undefined;
  const processes: any[] = Array.isArray(json.Process)
    ? json.Process
    : isJsonObject(json.Process)
      ? [json.Process]
      : [];
  const ProcessOfferings = filterOutUndefined(processes.map(parseProcess));
  return ProcessOfferings;
}

function parseProcess(json: any): Process | undefined {
  if (!isJsonObject(json)) return;
  if (!isJsonString(json.Identifier)) return;
  const Identifier = json.Identifier;
  const Title = isJsonString(json.Title) ? json.Title : undefined;
  const Abstract = isJsonString(json.Abstract) ? json.Abstract : undefined;
  return {
    Identifier,
    Title,
    Abstract
  };
}
