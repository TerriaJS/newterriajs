import filterOutUndefined from "../../../Core/filterOutUndefined";
import { isJsonObject, isJsonString } from "../../../Core/Json";

export interface OnlineResource {
  "xlink:type"?: string;
  "xlink:href": string;
}

type RangeClosureType = "closed" | "open" | "open-closed" | "closed-open";

/** A range of values of a numeric parameter. This range can be continuous or discrete, defined by a fixed spacing between adjacent valid values. If the MinimumValue or MaximumValue is not included, there is no value limit in that direction. Inclusion of the specified minimum and maximum values in the range shall be defined by the rangeClosure. */
export interface RangeType {
  /** Specifies which of the minimum and maximum values are included in the range. Note that plus and minus infinity are considered closed bounds. */
  readonly rangeClosure?: RangeClosureType;

  /** Maximum value of this numeric parameter. */
  readonly MaximumValue?: string;
  /** Minimum value of this numeric parameter. */
  readonly MinimumValue?: string;
  /** The regular distance or spacing between the allowed values in a range. */
  readonly Spacing?: string;
}

interface AllowedValuesType {
  readonly Range?: RangeType | RangeType[];
  readonly Value?: string | string[];
}

export interface DomainType {
  /** Name or identifier of this quantity. */
  name: string;
  /** List of all the valid values and/or ranges of values for this quantity. For numeric quantities, signed values should be ordered from negative infinity to positive infinity. */
  readonly AllowedValues: AllowedValuesType;
}

export interface RequestMethodType extends OnlineResource {
  /** Optional unordered list of valid domain constraints on non-parameter quantities that each apply to this request method for this operation. If one of these Constraint elements has the same "name" attribute as a Constraint element in the OperationsMetadata or Operation element, this Constraint element shall override the other one for this operation. The list of required and optional constraints for this request method for this operation shall be specified in the Implementation Specification for this service. */
  readonly Constraint?: DomainType | DomainType[];
}

interface HTTPType {
  /** Connect point URL prefix and any constraints for the HTTP "Get" request method for this operation request. */
  readonly Get: RequestMethodType | RequestMethodType[];
  /** Connect point URL and any constraints for the HTTP "Post" request method for this operation request. */
  readonly Post: RequestMethodType | RequestMethodType[];
}

interface DCPType {
  /** Connect point URLs for the HTTP Distributed Computing Platform (DCP). Normally, only one Get and/or one Post is included in this element. More than one Get and/or Post is allowed to support including alternative URLs for uses such as load balancing or backup. */
  readonly HTTP: HTTPType;
}

interface OperationType {
  /** Name or identifier of this operation (request) (for example, GetCapabilities). The list of required and optional operations implemented shall be specified in the Implementation Specification for this service. */
  readonly name: string;

  /** Optional unordered list of valid domain constraints on non-parameter quantities that each apply to this operation. If one of these Constraint elements has the same "name" attribute as a Constraint element in the OperationsMetadata element, this Constraint element shall override the other one for this operation. The list of required and optional constraints for this operation shall be specified in the Implementation Specification for this service. */
  readonly Constraint?: DomainType | DomainType[];
  /** Information for one distributed Computing Platform (DCP) supported for this operation. At present, only the HTTP DCP is defined, so this element only includes the HTTP element. */
  readonly DCP: DCPType;
  /** Optional unordered list of parameter domains that each apply to this operation which this server implements. If one of these Parameter elements has the same "name" attribute as a Parameter element in the OperationsMetadata element, this Parameter element shall override the other one for this operation. The list of required and optional parameter domain limitations for this operation shall be specified in the Implementation Specification for this service. */
  readonly Parameter?: DomainType | DomainType[];
}

interface OperationsMetadataType {
  /** Optional unordered list of valid domain constraints on non-parameter quantities that each apply to this server. The list of required and optional constraints shall be specified in the Implementation Specification for this service. */
  readonly Constraint?: DomainType | DomainType[];

  /** Metadata for one operation that this server implements. */
  readonly Operation: OperationType | OperationType[];
  /** Optional unordered list of parameter valid domains that each apply to one or more operations which this server interface implements. The list of required and optional parameter domain limitations shall be specified in the Implementation Specification for this service. */
  readonly Parameter?: DomainType | DomainType[];
}

export interface CapabilitiesBaseType {
  /** Service metadata document version, having values that are "increased" whenever any change is made in service metadata document. Values are selected by each server, and are always opaque to clients. When not supported by server, server shall not return this attribute. */
  readonly UpdateSequence?: string;
  readonly Version: string;

  /** Metadata about the operations and related abilities specified by this service and implemented by this server, including the URLs for operation requests. The basic contents of this section shall be the same for all OWS types, but individual services can add elements and/or change the optionality of optional elements. */
  readonly OperationsMetadata?: OperationsMetadataType;
  /** General metadata for this specific server. This XML Schema of this section shall be the same for all OWS. */
  readonly ServiceIdentification?: ServiceIdentification;
  /** Metadata about the organization that provides this specific service instance or server. */
  readonly ServiceProvider?: ServiceProvider;
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
