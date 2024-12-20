import i18next from "i18next";
import { computed, makeObservable, override, runInAction } from "mobx";
import combine from "terriajs-cesium/Source/Core/combine";
import TerriaError from "../../../Core/TerriaError";
import containsAny from "../../../Core/containsAny";
import isDefined from "../../../Core/isDefined";
import isReadOnlyArray from "../../../Core/isReadOnlyArray";
import loadText from "../../../Core/loadText";
import gmlToGeoJson from "../../../Map/Vector/gmlToGeoJson";
import { getName } from "../../../ModelMixins/CatalogMemberMixin";
import GeoJsonMixin, {
  FeatureCollectionWithCrs,
  toFeatureCollection
} from "../../../ModelMixins/GeojsonMixin";
import GetCapabilitiesMixin from "../../../ModelMixins/GetCapabilitiesMixin";
import xml2json from "../../../ThirdParty/xml2json";
import { InfoSectionTraits } from "../../../Traits/TraitsClasses/CatalogMemberTraits";
import { RectangleTraits } from "../../../Traits/TraitsClasses/MappableTraits";
import WebFeatureServiceCatalogItemTraits, {
  SUPPORTED_CRS_3857,
  SUPPORTED_CRS_4326
} from "../../../Traits/TraitsClasses/WebFeatureServiceCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel, ModelConstructorParameters } from "../../Definition/Model";
import StratumFromTraits from "../../Definition/StratumFromTraits";
import createStratumInstance from "../../Definition/createStratumInstance";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import WebFeatureServiceCapabilities, {
  FeatureType,
  getRectangleFromLayer
} from "./WebFeatureServiceCapabilities";

export class GetCapabilitiesStratum extends LoadableStratum(
  WebFeatureServiceCatalogItemTraits
) {
  static async load(
    catalogItem: WebFeatureServiceCatalogItem,
    capabilities?: WebFeatureServiceCapabilities
  ): Promise<GetCapabilitiesStratum> {
    if (!isDefined(catalogItem.getCapabilitiesUrl)) {
      throw new TerriaError({
        title: i18next.t("models.webFeatureServiceCatalogItem.missingUrlTitle"),
        message: i18next.t(
          "models.webFeatureServiceCatalogItem.missingUrlMessage"
        )
      });
    }

    if (!isDefined(capabilities))
      capabilities = await WebFeatureServiceCapabilities.fromUrl(
        proxyCatalogItemUrl(
          catalogItem,
          catalogItem.getCapabilitiesUrl,
          catalogItem.getCapabilitiesCacheDuration
        )
      );

    return new GetCapabilitiesStratum(catalogItem, capabilities);
  }

  constructor(
    readonly catalogItem: WebFeatureServiceCatalogItem,
    readonly capabilities: WebFeatureServiceCapabilities
  ) {
    super();
    makeObservable(this);
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new GetCapabilitiesStratum(
      model as WebFeatureServiceCatalogItem,
      this.capabilities
    ) as this;
  }

  @computed
  get capabilitiesFeatureTypes(): ReadonlyMap<string, FeatureType | undefined> {
    const lookup: (name: string) => [string, FeatureType | undefined] = (
      name
    ) => [name, this.capabilities && this.capabilities.findLayer(name)];
    return new Map(this.catalogItem.typeNamesArray.map(lookup));
  }

  @computed
  get info(): StratumFromTraits<InfoSectionTraits>[] {
    const result: StratumFromTraits<InfoSectionTraits>[] = [
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t(
          "models.webFeatureServiceCatalogItem.getCapabilitiesUrl"
        ),
        content: this.catalogItem.getCapabilitiesUrl
      })
    ];

    let firstDataDescription: string | undefined;
    for (const layer of this.capabilitiesFeatureTypes.values()) {
      if (
        !layer ||
        !layer.Abstract ||
        containsAny(
          layer.Abstract,
          WebFeatureServiceCatalogItem.abstractsToIgnore
        )
      ) {
        continue;
      }

      const suffix =
        this.capabilitiesFeatureTypes.size === 1 ? "" : ` - ${layer.Title}`;
      const name = `${i18next.t(
        "models.webFeatureServiceCatalogItem.abstract"
      )}${suffix}`;

      result.push(
        createStratumInstance(InfoSectionTraits, {
          name,
          content: layer.Abstract
        })
      );

      firstDataDescription = firstDataDescription || layer.Abstract;
    }

    // Show the service abstract if there is one and if it isn't the Geoserver default "A compliant implementation..."
    const service = this.capabilities && this.capabilities.service;
    if (service) {
      if (
        service &&
        service.Abstract &&
        !containsAny(
          service.Abstract,
          WebFeatureServiceCatalogItem.abstractsToIgnore
        ) &&
        service.Abstract !== firstDataDescription
      ) {
        result.push(
          createStratumInstance(InfoSectionTraits, {
            name: i18next.t("models.webFeatureServiceCatalogItem.abstract"),
            content: service.Abstract
          })
        );
      }

      // Show the Access Constraints if it isn't "none" (because that's the default, and usually a lie).
      if (
        service.AccessConstraints &&
        !/^none$/i.test(service.AccessConstraints)
      ) {
        result.push(
          createStratumInstance(InfoSectionTraits, {
            name: i18next.t(
              "models.webFeatureServiceCatalogItem.accessConstraints"
            ),
            content: service.AccessConstraints
          })
        );
      }
    }
    return result;
  }

  @computed
  get infoSectionOrder(): string[] {
    let layerDescriptions = [
      i18next.t("models.webFeatureServiceCatalogItem.abstract")
    ];

    // If more than one layer, push layer description titles for each applicable layer
    if (this.capabilitiesFeatureTypes.size > 1) {
      layerDescriptions = [];
      this.capabilitiesFeatureTypes.forEach((layer) => {
        if (
          layer &&
          layer.Abstract &&
          !containsAny(
            layer.Abstract,
            WebFeatureServiceCatalogItem.abstractsToIgnore
          )
        ) {
          layerDescriptions.push(
            `${i18next.t("models.webFeatureServiceCatalogItem.abstract")} - ${
              layer.Title
            }`
          );
        }
      });
    }

    return [
      i18next.t("preview.disclaimer"),
      i18next.t("description.name"),
      ...layerDescriptions,
      i18next.t("preview.datasetDescription"),
      i18next.t("preview.serviceDescription"),
      i18next.t("models.webFeatureServiceCatalogItem.serviceDescription"),
      i18next.t("preview.resourceDescription"),
      i18next.t("preview.licence"),
      i18next.t("preview.accessConstraints"),
      i18next.t("models.webFeatureServiceCatalogItem.accessConstraints"),
      i18next.t("preview.author"),
      i18next.t("preview.contact"),
      i18next.t("models.webFeatureServiceCatalogItem.serviceContact"),
      i18next.t("preview.created"),
      i18next.t("preview.modified"),
      i18next.t("preview.updateFrequency"),
      i18next.t("models.webFeatureServiceCatalogItem.getCapabilitiesUrl")
    ];
  }

  @computed
  get rectangle(): StratumFromTraits<RectangleTraits> | undefined {
    const layers: FeatureType[] = [
      ...this.capabilitiesFeatureTypes.values()
    ].filter(isDefined);

    // Only return first layer's rectangle - as we don't support multiple WFS layers
    return layers.length > 0 ? getRectangleFromLayer(layers[0]) : undefined;
  }

  @computed
  get isGeoServer(): boolean | undefined {
    if (!this.capabilities) {
      return undefined;
    }

    if (
      !this.capabilities.service ||
      !this.capabilities.service.KeywordList ||
      !this.capabilities.service.KeywordList.Keyword
    ) {
      return false;
    }

    const keyword = this.capabilities.service.KeywordList.Keyword;
    if (isReadOnlyArray(keyword)) {
      return keyword.indexOf("GEOSERVER") >= 0;
    } else {
      return keyword === "GEOSERVER";
    }
  }

  // Helper function to check if geojson output is supported (by checking GetCapabilities OutputTypes OR FeatureType OutputTypes)
  hasJsonOutputFormat = (outputFormats: string[] | undefined) => {
    return isDefined(
      outputFormats?.find((format) =>
        ["json", "JSON", "application/json"].includes(format)
      )
    );
  };

  // Find which GML formats are supported, choose the one most suited to Terria. If not available, default to "gml3"
  @computed
  get outputFormat(): string | undefined {
    const supportsGeojson =
      this.hasJsonOutputFormat(this.capabilities.outputTypes) ||
      [...this.capabilitiesFeatureTypes.values()].reduce<boolean>(
        (hasGeojson, current) =>
          hasGeojson && this.hasJsonOutputFormat(current?.OutputFormats),
        true
      );

    const searchValue = new RegExp(".*gml/3.1.1.*|.*gml3.1.1.*");

    return supportsGeojson
      ? "JSON"
      : this.capabilities.outputTypes?.find((outputFormat) =>
          searchValue.test(outputFormat)
        ) ?? "gml3";
  }

  /** Finds the best srsName to use.
   * First checks if one provided in url. If one is provided in url, and this is supported by Terria, will use this.
   * Note that an error will be thrown if user supplied srsName is not supported by the user supplied WFS service.
   * If no srsName provided, or the provided one is not supported by Terria,
   * then checks getCapabilities response and returns the first listed srs that is included in our list of supported srs.
   * This enables us to use a urn identifier if supported, or a normal EPSG code if not.
   * e.g. "urn:ogc:def:crs:EPSG::4326" or "EPSG:4326"
   **/
  @computed
  get srsName(): string | undefined {
    // First check to see if URL has CRS or SRS
    const supportedCrs = [...SUPPORTED_CRS_3857, ...SUPPORTED_CRS_4326];
    const queryParams: any = this.catalogItem.uri?.query(true) ?? {};
    const urlCrs =
      queryParams.srsName ??
      queryParams.crs ??
      queryParams.CRS ??
      queryParams.srs ??
      queryParams.SRS;
    if (urlCrs && supportedCrs.includes(urlCrs)) return urlCrs;

    // If no srsName provided, then find what the server supports and use the best one for Terria
    const layerSrsArray = this.capabilities.srsNames?.find(
      (layer) => layer.layerName === this.catalogItem.typeNamesArray[0] //If multiple layers in this WFS request, only use the first layer to find best srsName
    );

    return (
      layerSrsArray?.srsArray.find((srsName) =>
        SUPPORTED_CRS_4326.includes(srsName)
      ) ?? "urn:ogc:def:crs:EPSG::4326" // Default to urn identifier for WGS84 if we cant find something better. Sometimes WFS service will support this even if not specified in GetCapabilities response.
    );
  }
}

class WebFeatureServiceCatalogItem extends GetCapabilitiesMixin(
  GeoJsonMixin(CreateModel(WebFeatureServiceCatalogItemTraits))
) {
  /**
   * The collection of strings that indicate an Abstract property should be ignored.  If these strings occur anywhere
   * in the Abstract, the Abstract will not be used.  This makes it easy to filter out placeholder data like
   * Geoserver's "A compliant implementation of WFS..." stock abstract.
   */
  static abstractsToIgnore = [
    "A compliant implementation of WFS",
    "This is the reference implementation of WFS 1.0.0 and WFS 1.1.0, supports all WFS operations including Transaction."
  ];

  // hide elements in the info section which might show information about the datasource
  _sourceInfoItemNames = [
    i18next.t("models.webFeatureServiceCatalogItem.getCapabilitiesUrl")
  ];

  static readonly type = "wfs";

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get type() {
    return WebFeatureServiceCatalogItem.type;
  }

  protected get defaultGetCapabilitiesUrl(): string | undefined {
    if (this.uri) {
      return this.uri
        .clone()
        .setSearch({
          service: "WFS",
          version: "1.1.0",
          request: "GetCapabilities"
        })
        .toString();
    } else {
      return undefined;
    }
  }

  async createGetCapabilitiesStratumFromParent(
    capabilities: WebFeatureServiceCapabilities
  ) {
    const stratum = await GetCapabilitiesStratum.load(this, capabilities);
    runInAction(() => {
      this.strata.set(GetCapabilitiesMixin.getCapabilitiesStratumName, stratum);
    });
  }

  protected async forceLoadMetadata(): Promise<void> {
    if (
      this.strata.get(GetCapabilitiesMixin.getCapabilitiesStratumName) !==
      undefined
    )
      return;
    const stratum = await GetCapabilitiesStratum.load(this);
    runInAction(() => {
      this.strata.set(GetCapabilitiesMixin.getCapabilitiesStratumName, stratum);
    });
  }

  protected async forceLoadGeojsonData(): Promise<FeatureCollectionWithCrs> {
    const getCapabilitiesStratum: GetCapabilitiesStratum | undefined =
      this.strata.get(
        GetCapabilitiesMixin.getCapabilitiesStratumName
      ) as GetCapabilitiesStratum;

    if (!this.uri) {
      throw new TerriaError({
        sender: this,
        title: i18next.t("models.webFeatureServiceCatalogItem.missingUrlTitle"),
        message: i18next.t(
          "models.webFeatureServiceCatalogItem.missingUrlMessage",
          this
        )
      });
    }

    // Check if layers exist
    const missingLayers = this.typeNamesArray.filter(
      (layer) =>
        !isDefined(getCapabilitiesStratum.capabilitiesFeatureTypes.get(layer))
    );
    if (missingLayers.length > 0) {
      throw new TerriaError({
        sender: this,
        title: i18next.t(
          "models.webFeatureServiceCatalogItem.noLayerFoundTitle"
        ),
        message: i18next.t(
          "models.webFeatureServiceCatalogItem.noLayerFoundMessage",
          { name: getName(this), typeNames: missingLayers.join(", ") }
        )
      });
    }

    const url = this.uri
      .clone()
      .setSearch(
        combine(
          {
            service: "WFS",
            request: "GetFeature",
            typeName: this.typeNames,
            version: "1.1.0",
            outputFormat: this.outputFormat,
            srsName: this.srsName,
            maxFeatures: this.maxFeatures
          },
          this.parameters
        )
      )
      .toString();

    const getFeatureResponse = await loadText(proxyCatalogItemUrl(this, url));

    // Check for errors (if supportsGeojson and the request returns XML, OR the response includes ExceptionReport)
    if (
      (this.outputFormat === "JSON" && getFeatureResponse.startsWith("<")) ||
      getFeatureResponse.includes("ExceptionReport")
    ) {
      let errorMessage: string | undefined;
      try {
        const jsonResponse = xml2json(getFeatureResponse);
        errorMessage =
          jsonResponse && typeof jsonResponse !== "string"
            ? jsonResponse.Exception?.ExceptionText
            : undefined;
      } catch {}

      const originalError = isDefined(errorMessage)
        ? new TerriaError({
            sender: this,
            title: "Exception from service",
            message: errorMessage
          })
        : undefined;

      throw new TerriaError({
        sender: this,
        title: i18next.t(
          "models.webFeatureServiceCatalogItem.missingDataTitle"
        ),
        message: `${i18next.t(
          "models.webFeatureServiceCatalogItem.missingDataMessage",
          { name: getName(this) }
        )}`,
        originalError
      });
    }

    const geojsonData =
      this.outputFormat === "JSON"
        ? JSON.parse(getFeatureResponse)
        : gmlToGeoJson(getFeatureResponse);

    const fc = toFeatureCollection(geojsonData);
    if (fc) return fc;
    throw TerriaError.from(
      "Invalid geojson data - only FeatureCollection and Feature are supported"
    );
  }

  @computed
  get typeNamesArray(): ReadonlyArray<string> {
    if (Array.isArray(this.typeNames)) {
      return this.typeNames;
    } else if (this.typeNames) {
      return this.typeNames.split(",");
    } else {
      return [];
    }
  }

  @override
  get shortReport(): string | undefined {
    // Show notice if reached
    if (
      this.readyData?.features !== undefined &&
      this.readyData!.features.length >= this.maxFeatures
    ) {
      return i18next.t(
        "models.webFeatureServiceCatalogItem.reachedMaxFeatureLimit",
        this
      );
    }
    return undefined;
  }
}

export default WebFeatureServiceCatalogItem;
