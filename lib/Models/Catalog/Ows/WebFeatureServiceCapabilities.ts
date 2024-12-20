import { createTransformer } from "mobx-utils";
import isDefined from "../../../Core/isDefined";
import loadXML from "../../../Core/loadXML";
import TerriaError from "../../../Core/TerriaError";
import xml2json from "../../../ThirdParty/xml2json";
import { RectangleTraits } from "../../../Traits/TraitsClasses/MappableTraits";
import StratumFromTraits from "../../Definition/StratumFromTraits";
import {
  CapabilitiesGeographicBoundingBox,
  CapabilitiesService
} from "./WebMapServiceCapabilities";
import { isJsonString } from "../../../Core/Json";

export interface FeatureType {
  readonly Name?: string;
  readonly Title: string;
  readonly Abstract?: string;
  readonly WGS84BoundingBox?: CapabilitiesGeographicBoundingBox;
  readonly Keywords?: string | string[];
  readonly OutputFormats?: string[];
}

export function getRectangleFromLayer(
  layer: FeatureType
): StratumFromTraits<RectangleTraits> | undefined {
  const bbox = layer.WGS84BoundingBox;
  if (bbox) {
    return {
      west: bbox.westBoundLongitude,
      south: bbox.southBoundLatitude,
      east: bbox.eastBoundLongitude,
      north: bbox.northBoundLatitude
    };
  }
  return undefined;
}

/**
 * Get CapabilitiesService (in WMS form)
 */
function getService(json: any): CapabilitiesService {
  const serviceProviderJson = json["ServiceProvider"];
  const serviceIdentificationJson = json["ServiceIdentification"];
  const serviceAddressJson =
    serviceProviderJson?.["ServiceContact"]?.["ContactInfo"]?.["Address"];
  const service: CapabilitiesService = {
    Title: serviceIdentificationJson?.["Title"],
    Abstract: serviceIdentificationJson?.["Abstract"],
    Fees: serviceIdentificationJson?.["Fees"],
    AccessConstraints: serviceIdentificationJson?.["AccessConstraints"],
    KeywordList: {
      Keyword: serviceIdentificationJson?.["Keywords"]?.["Keyword"]
    },
    ContactInformation: {
      ContactPersonPrimary: {
        ContactPerson:
          serviceProviderJson?.["ServiceContact"]?.["IndividualName"],
        ContactOrganization: serviceProviderJson?.["ProviderName"]
      },
      ContactPosition:
        serviceProviderJson?.["ServiceContact"]?.["PositionName"],
      ContactAddress: {
        Address: serviceAddressJson?.["DeliveryPoint"],
        City: serviceAddressJson?.["City"],
        StateOrProvince: serviceAddressJson?.["AdministrativeArea"],
        PostCode: serviceAddressJson?.["PostalCode"],
        Country: serviceAddressJson?.["Country"]
      },
      ContactVoiceTelephone:
        serviceProviderJson?.["ServiceContact"]?.["ContactInfo"]?.["Phone"]?.[
          "Voice"
        ],
      ContactFacsimileTelephone:
        serviceProviderJson?.["ServiceContact"]?.["ContactInfo"]?.["Phone"]?.[
          "Facsimile"
        ],
      ContactElectronicMailAddress:
        serviceProviderJson?.["ServiceContact"]?.["ContactInfo"]?.["Address"]?.[
          "ElectronicMailAddress"
        ]
    }
  };
  return service;
}

function getFeatureTypes(json: any): FeatureType[] {
  let featureTypesJson = json.FeatureTypeList?.FeatureType as
    | Array<any>
    | string;
  if (!isDefined(featureTypesJson)) {
    return [];
  }
  if (!Array.isArray(featureTypesJson)) {
    featureTypesJson = [featureTypesJson];
  }
  return (
    featureTypesJson.map<FeatureType>((json: any) => {
      const lowerCorner = json["WGS84BoundingBox"]?.["LowerCorner"].split(" ");
      const upperCorner = json["WGS84BoundingBox"]?.["UpperCorner"].split(" ");

      let outputFormats: string[] | undefined;
      if (isDefined(json.OutputFormats)) {
        outputFormats = Array.isArray(json.OutputFormats)
          ? json.OutputFormats.map((o: any) => o.Format)
          : [json.OutputFormats.Format];
      }

      return {
        Title: json.Title,
        Name: json.Name,
        Abstract: json.Abstract,
        Keyword: json["Keywords"]?.["Keyword"],
        WGS84BoundingBox: {
          westBoundLongitude: lowerCorner && parseFloat(lowerCorner[0]),
          southBoundLatitude: lowerCorner && parseFloat(lowerCorner[1]),
          eastBoundLongitude: upperCorner && parseFloat(upperCorner[0]),
          northBoundLatitude: upperCorner && parseFloat(upperCorner[1])
        },
        OutputFormats: outputFormats
      };
    }) || []
  );
}

function getOutputTypes(json: any): string[] | undefined {
  const outputTypes = json.OperationsMetadata?.Operation?.find(
    (op: any) => op.name === "GetFeature"
  )?.Parameter?.find((p: any) => p.name === "outputFormat")?.Value;

  if (!isDefined(outputTypes)) {
    return;
  }

  return Array.isArray(outputTypes) ? outputTypes : [outputTypes];
}

interface SrsNamesForLayer {
  layerName: string;
  srsArray: string[]; // First element is DefaultSRS
}

/**
 * Get the coordinate systems (srsName) supported by the WFS service for each layer.
 * @param json
 * returns an object with an array of srsNames for each layer. The first element is the defaultSRS as specified by the WFS service.
 * TODO: For catalog items that specify which layer we are interested in, why build the array describing the srsNames for all the other layers too?
 */
function getSrsNames(json: any): SrsNamesForLayer[] | undefined {
  const layers = json.FeatureTypeList?.FeatureType;
  let srsNamesByLayer: SrsNamesForLayer[] = [];
  if (Array.isArray(layers)) {
    srsNamesByLayer = layers.map(buildSrsNameObject);
  } else {
    srsNamesByLayer.push(buildSrsNameObject(json.FeatureTypeList?.FeatureType));
  }
  return srsNamesByLayer;
}

/**
 * Helper function to build individual objects describing the allowable srsNames for each layer in the WFS
 * @param layer
 */
function buildSrsNameObject(layer: any): SrsNamesForLayer {
  const srsNames: string[] = [];

  if (isJsonString(layer.DefaultSRS)) srsNames.push(layer.DefaultSRS);
  if (Array.isArray(layer.OtherSRS))
    layer.OtherSRS.forEach((item: string) => {
      if (isJsonString(item)) srsNames.push(item);
    });
  else if (isJsonString(layer.OtherSRS)) srsNames.push(layer.OtherSRS);
  return { layerName: layer.Name, srsArray: srsNames };
}

export default class WebFeatureServiceCapabilities {
  static fromUrl: (url: string) => Promise<WebFeatureServiceCapabilities> =
    createTransformer((url: string) => {
      return loadXML(url).then(function (capabilitiesXml: any) {
        const json = xml2json(capabilitiesXml);
        if (
          !json ||
          typeof json === "string" ||
          !isDefined(json.ServiceIdentification)
        ) {
          throw new TerriaError({
            title: "Invalid GetCapabilities",
            message:
              `The URL ${url} was retrieved successfully but it does not appear to be a valid Web Feature Service (WFS) GetCapabilities document.` +
              `\n\nEither the catalog file has been set up incorrectly, or the server address has changed.`
          });
        }

        return new WebFeatureServiceCapabilities(capabilitiesXml, json);
      });
    });

  readonly service: CapabilitiesService;
  readonly outputTypes: string[] | undefined;
  readonly featureTypes: FeatureType[];
  readonly srsNames: SrsNamesForLayer[] | undefined;

  private constructor(_xml: XMLDocument, json: any) {
    this.service = getService(json);
    this.outputTypes = getOutputTypes(json);
    this.featureTypes = getFeatureTypes(json);
    this.srsNames = getSrsNames(json);
  }

  /**
   * Finds the layer in GetCapabilities corresponding to a given layer name. Names are
   * resolved as foll
   *    * The layer has the exact name specified.
   *    * The layer name matches the name in the spec if the namespace portion is removed.
   *    * The name in the spec matches the title of the layer.
   *
   * @param {String} name The layer name to resolve.
   * @returns {CapabilitiesLayer} The resolved layer, or `undefined` if the layer name could not be resolved.
   */
  findLayer(name: string): FeatureType | undefined {
    // Look for an exact match on the name.
    let match = this.featureTypes.find((ft) => ft.Name === name);
    if (!match) {
      const colonIndex = name.indexOf(":");
      if (colonIndex >= 0) {
        // This looks like a namespaced name.  Such names will (usually?) show up in GetCapabilities
        // as just their name without the namespace qualifier.
        const nameWithoutNamespace = name.substring(colonIndex + 1);
        match = this.featureTypes.find(
          (ft) => ft.Name === nameWithoutNamespace
        );
      }
    }

    if (!match) {
      // Try matching by title.
      match = this.featureTypes.find((ft) => ft.Title === name);
    }

    return match;
  }
}
