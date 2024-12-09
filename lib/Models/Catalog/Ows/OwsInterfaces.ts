import filterOutUndefined from "../../../Core/filterOutUndefined";
import { isJsonObject, isJsonString } from "../../../Core/Json";

export interface OnlineResource {
  "xlink:type"?: string;
  "xlink:href": string;
}

export interface CapabilitiesStyle {
  readonly Identifier: string;
  readonly Name: string;
  readonly Title: string;
  readonly Abstract?: string;
  readonly Keywords?: string;
  readonly LegendURL?: CapabilitiesLegend | ReadonlyArray<CapabilitiesLegend>;
}

export interface CapabilitiesLegend {
  readonly OnlineResource?: OnlineResource;
  readonly MinScaleDenominator?: number;
  readonly MaxScaleDenominator?: number;
  readonly Format?: string;
  readonly width?: number;
  readonly height?: number;
}

export interface BoundingBox {
  LowerCorner: string;
  UpperCorner: string;
  crs?: string;
  dimensions?: string;
}

export interface OwsKeywordList {
  readonly Keyword: string | string[];
  readonly type?: string;
}

export function parseOwsKeywordList(json: any): OwsKeywordList | undefined {
  if (!isJsonObject(json)) return undefined;
  const type = isJsonString(json.type) ? json.type : undefined;
  const Keyword = isJsonString(json.Keyword)
    ? json.Keyword
    : Array.isArray(json.Keyword)
      ? filterOutUndefined(
          json.Keyword.map((s) => (isJsonString(s) ? s : undefined))
        )
      : [];
  return {
    type,
    Keyword
  };
}

export function parseOnlineResource(json: any): OnlineResource | undefined {
  if (!isJsonObject(json)) return undefined;

  const href = isJsonString(json["xlink:href"])
    ? json["xlink:href"]
    : undefined;
  if (href === undefined) return;

  const type = isJsonString(json["xlink:type"])
    ? json["xlink:type"]
    : undefined;

  return {
    "xlink:type": type,
    "xlink:href": href
  };
}

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

  readonly ServiceTypeVersion: string;
}

export interface ServiceProvider {
  /** A unique identifier for service provider organization. */
  readonly ProviderName?: string;
  /** Reference to the most relevant web site of the service provider. */
  readonly ProviderSite?: OnlineResource;
  /** Information for contacting the service provider. */
  readonly ServiceContact?: ServiceContact;
}

export interface ServiceContact {
  /** Name of the responsible person: surname, given name, title separated by a delimiter */
  readonly InvidualName?: string;
  /** Role or position of the responsible person */
  readonly PositionName?: string;
  /** Address of the responsible party */
  readonly ContactInfo?: ContactInfo;
  /** Function performed by the responsible party.  */
  readonly Role?: string;
}

export interface ContactInfo {
  /** Telephone numbers at which the organization or individual may be contacted */
  Phone?: Phone;
  /** Physical and email address at which the organization or individual may be contacted. */
  Address?: ContactInfoAddress;
  /** On-line information that can be used to contact the individual or organization. */
  OnlineResource?: OnlineResource;
  /** Time period (including time zone) when individuals can contact the organization or individual */
  HoursOfService?: string;
  /** Supplemental instructions on how or when to contact the individual or organization. */
  ContactInstructions?: string;
}

export interface ContactInfoAddress {
  AddressType?: string;
  /** Address line for the location. */
  DeliveryPoint?: string;
  /** City of the location. */
  City?: string;
  /** State or province of the location. */
  AdministrativeArea?: string;
  /** ZIP or other postal code. */
  PostalCode?: string;
  /** Country of the physical address. */
  Country?: string;
  /** Address of the electronic mailbox of the responsible organization or individual. */
  ElectronicMailAddress?: string;
}

interface Phone {
  /** Telephone number by which individuals can speak to the responsible organization or individual. */
  Voice?: string;
  /** Telephone number of a facsimile machine for the responsible organization or individual. */
  Facsimile?: string;
}
