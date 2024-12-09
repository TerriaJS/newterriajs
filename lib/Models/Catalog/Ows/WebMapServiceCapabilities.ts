import { createTransformer } from "mobx-utils";
import defined from "terriajs-cesium/Source/Core/defined";
import isReadOnlyArray from "../../../Core/isReadOnlyArray";
import loadXML from "../../../Core/loadXML";
import { networkRequestError } from "../../../Core/TerriaError";
import xml2json from "../../../ThirdParty/xml2json";
import { RectangleTraits } from "../../../Traits/TraitsClasses/MappableTraits";
import {
  CapabilitiesStyle,
  OnlineResource,
  OwsKeywordList
} from "./OwsInterfaces";
import StratumFromTraits from "../../Definition/StratumFromTraits";

export interface CapabilitiesGeographicBoundingBox {
  readonly westBoundLongitude: number;
  readonly southBoundLatitude: number;
  readonly eastBoundLongitude: number;
  readonly northBoundLatitude: number;
}

export interface CapabilitiesLatLonBoundingBox {
  readonly minx: number;
  readonly miny: number;
  readonly maxx: number;
  readonly maxy: number;
}

export type CapabilitiesDimension = string & {
  readonly name: string;
  readonly units: string;
  readonly unitSymbol?: string;
  readonly default?: string;
  readonly text?: string;
  readonly multipleValues?: boolean;
  readonly nearestValue?: boolean;
  readonly current?: boolean;
};

export type CapabilitiesExtent = string & {
  readonly name: string;
  readonly default?: string;
  readonly multipleValues?: boolean;
  readonly nearestValues?: boolean;
  readonly current?: boolean;
};

export interface MetadataURL {
  readonly OnlineResource?: OnlineResource;
  readonly type?: string;
}

export interface CapabilitiesLayer {
  readonly _parent?: CapabilitiesLayer;
  /** ### Adapted from WMS 1.3.0 spec:
   *
   * #### 7.2.4.2
   *
   * A number of elements have both a `<Name>` and a `<Title>`.
   * The `Name` is a text string used for machine-to-machine communication while the `Title` is for the benefit of humans.
   *
   * #### 7.2.4.6.3
   *
   * If, and only if, a layer has a `<Name>`, then it is a map layer that can be requested by using that `Name` in the `LAYERS` parameter of a GetMap request.
   * If the layer has a `Title` but no `Name`, then that layer is only a category title for all the layers nested within.
   * A client shall not attempt to request a layer that has a `Title` but no `Name`.
   */
  readonly Name?: string;
  readonly Title: string;
  readonly Abstract?: string;
  readonly MetadataURL?: MetadataURL | ReadonlyArray<MetadataURL>;
  readonly EX_GeographicBoundingBox?: CapabilitiesGeographicBoundingBox; // WMS 1.3.0
  readonly LatLonBoundingBox?: CapabilitiesLatLonBoundingBox; // WMS 1.0.0-1.1.1
  readonly Style?: CapabilitiesStyle | ReadonlyArray<CapabilitiesStyle>;
  readonly Layer?: CapabilitiesLayer | ReadonlyArray<CapabilitiesLayer>;
  readonly Dimension?:
    | CapabilitiesDimension
    | ReadonlyArray<CapabilitiesDimension>;

  // WMS 1.1.1 puts dimension values in an Extent element instead of directly in the Dimension element.
  readonly Extent?: CapabilitiesExtent | ReadonlyArray<CapabilitiesExtent>;
  readonly CRS?: string | string[]; // WMS 1.3.0
  readonly SRS?: string | string[]; // WMS 1.1.1
}

export interface CapabilitiesService {
  /** Title of the service. */
  readonly Title?: string;
  /** Longer narative description of the service. */
  readonly Abstract?: string;

  /** Information about a contact person for the service. */
  readonly ContactInformation?: CapabilitiesContactInformation;
  /** Fees for this service */
  readonly Fees?: string;
  /** Access contraints for this service. */
  readonly AccessConstraints?: string;
  /** List of keywords or keyword phrases to help catalog searching. */
  readonly KeywordList?: OwsKeywordList;
}

/**
 * Information about a contact person for the service.
 */
export interface CapabilitiesContactInformation {
  ContactPersonPrimary?: ContactInformationContactPersonPrimary;
  ContactPosition?: string;
  ContactAddress?: ContactInformationContactAddress;
  ContactVoiceTelephone?: string;
  ContactFacsimileTelephone?: string;
  ContactElectronicMailAddress?: string;
}

export interface ContactInformationContactPersonPrimary {
  ContactPerson?: string;
  ContactOrganization?: string;
}

export interface ContactInformationContactAddress {
  AddressType?: string;
  Address?: string;
  City?: string;
  StateOrProvince?: string;
  PostCode?: string;
  Country?: string;
}

type ElementTypeIfArray<T> = T extends ReadonlyArray<infer U> ? U : T;

type Mutable<T> = { -readonly [P in keyof T]: T[P] };

export function getRectangleFromLayer(
  layer: CapabilitiesLayer
): StratumFromTraits<RectangleTraits> | undefined {
  const egbb = layer.EX_GeographicBoundingBox; // required in WMS 1.3.0
  if (egbb) {
    return {
      west: egbb.westBoundLongitude,
      south: egbb.southBoundLatitude,
      east: egbb.eastBoundLongitude,
      north: egbb.northBoundLatitude
    };
  } else {
    const llbb = layer.LatLonBoundingBox; // required in WMS 1.0.0 through 1.1.1
    if (llbb) {
      return {
        west: llbb.minx,
        south: llbb.miny,
        east: llbb.maxx,
        north: llbb.maxy
      };
    }
  }

  // Work way through ancestors until we get a rectangle.
  if (layer._parent) return getRectangleFromLayer(layer._parent);

  return undefined;
}

export default class WebMapServiceCapabilities {
  static fromUrl: (url: string) => Promise<WebMapServiceCapabilities> =
    createTransformer((url: string) => {
      return Promise.resolve(loadXML(url)).then(function (capabilitiesXml) {
        const json = xml2json(capabilitiesXml);
        if (!capabilitiesXml || !defined(json.Capability)) {
          throw networkRequestError({
            title: "Invalid GetCapabilities",
            message:
              `The URL ${url} was retrieved successfully but it does not appear to be a valid Web Map Service (WMS) GetCapabilities document.` +
              `\n\nEither the catalog file has been set up incorrectly, or the server address has changed.`
          });
        }

        return new WebMapServiceCapabilities(capabilitiesXml, json);
      });
    });

  get Service(): CapabilitiesService {
    return this.json.Service;
  }

  readonly rootLayers: CapabilitiesLayer[];
  readonly allLayers: CapabilitiesLayer[];
  readonly topLevelNamedLayers: CapabilitiesLayer[];
  readonly layersByName: {
    readonly [name: string]: CapabilitiesLayer;
  };
  readonly layersByTitle: {
    readonly [name: string]: CapabilitiesLayer;
  };

  private constructor(
    readonly xml: XMLDocument,
    readonly json: any
  ) {
    this.allLayers = [];
    this.rootLayers = [];
    this.topLevelNamedLayers = [];
    this.layersByName = {};
    this.layersByTitle = {};

    const allLayers = this.allLayers;
    const rootLayers = this.rootLayers;
    const topLevelNamedLayers = this.topLevelNamedLayers;
    const layersByName: { [name: string]: CapabilitiesLayer } =
      this.layersByName;
    const layersByTitle: { [name: string]: CapabilitiesLayer } =
      this.layersByTitle;

    function traverseLayer(
      layer: Mutable<CapabilitiesLayer>,
      isTopLevel: boolean = false,
      parent?: CapabilitiesLayer | undefined
    ) {
      allLayers.push(layer);
      if (layer.Name) {
        layersByName[layer.Name] = layer;
        if (isTopLevel) {
          topLevelNamedLayers.push(layer);
          isTopLevel = false;
        }
      }
      if (layer.Title) {
        layersByTitle[layer.Title] = layer;
      }

      layer._parent = parent;

      const layers = layer.Layer;

      if (isReadOnlyArray(layers)) {
        for (let i = 0; i < layers.length; ++i) {
          traverseLayer(layers[i], isTopLevel, layer);
        }
      } else if (layers !== undefined) {
        traverseLayer(layers, isTopLevel, layer);
      }
    }

    if (json.Capability && json.Capability.Layer) {
      const layerElements = json.Capability.Layer;
      if (Array.isArray(layerElements)) {
        rootLayers.push(...layerElements);
      } else {
        rootLayers.push(layerElements);
      }

      rootLayers.forEach((layer) => traverseLayer(layer, true));
    }
  }

  /**
   * Finds the layer in GetCapabilities corresponding to a given layer name. Names are
   * resolved as follows:
   *    * The layer has the exact name specified.
   *    * The layer name matches the name in the spec if the namespace portion is removed.
   *    * The name in the spec matches the title of the layer.
   *
   * @param {String} name The layer name to resolve.
   * @returns {CapabilitiesLayer} The resolved layer, or `undefined` if the layer name could not be resolved.
   */
  findLayer(name: string): CapabilitiesLayer {
    // Look for an exact match on the name.
    let match = this.layersByName[name];
    if (!match) {
      const colonIndex = name.indexOf(":");
      if (colonIndex >= 0) {
        // This looks like a namespaced name.  Such names will (usually?) show up in GetCapabilities
        // as just their name without the namespace qualifier.
        const nameWithoutNamespace = name.substring(colonIndex + 1);
        match = this.layersByName[nameWithoutNamespace];
      }
    }

    if (!match) {
      // Try matching by title.
      match = this.layersByTitle[name];
    }

    return match;
  }

  /**
   * Gets the ancestry of a layer. The returned array has the layer itself at position 0, its parent
   * layer at position 1, and so on until the root of the layer hierarchy.
   *
   * @param layer The layer for which to obtain ancestry.
   * @returns The ancestry of the layer.
   */
  getLayerAncestry(
    layer: CapabilitiesLayer | undefined
  ): ReadonlyArray<CapabilitiesLayer> {
    const result = [];
    while (layer) {
      result.push(layer);
      layer = layer._parent;
    }
    return result;
  }

  getInheritedValues<K extends keyof CapabilitiesLayer>(
    layer: CapabilitiesLayer,
    property: K
  ): ReadonlyArray<
    ElementTypeIfArray<Exclude<CapabilitiesLayer[K], undefined>>
  > {
    type TResultElement = ElementTypeIfArray<
      Exclude<CapabilitiesLayer[K], undefined>
    >;
    type TResultArray = TResultElement[];

    const values = this.getLayerAncestry(layer).reduce((p: TResultArray, c) => {
      const value = c[property];
      if (Array.isArray(value)) {
        p.push(...value);
      } else if (value !== undefined) {
        p.push(value as TResultElement);
      }
      return p;
    }, []);
    return values;
  }
}
