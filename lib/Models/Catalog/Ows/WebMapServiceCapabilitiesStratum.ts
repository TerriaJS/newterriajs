import i18next from "i18next";
import { computed, makeObservable } from "mobx";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import URI from "urijs";
import { JsonObject, isJsonArray, isJsonString } from "../../../Core/Json";
import TerriaError from "../../../Core/TerriaError";
import containsAny from "../../../Core/containsAny";
import createDiscreteTimesFromIsoSegments from "../../../Core/createDiscreteTimes";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import isDefined from "../../../Core/isDefined";
import isReadOnlyArray from "../../../Core/isReadOnlyArray";
import { terriaTheme } from "../../../ReactViews/StandardUserInterface";
import {
  InfoSectionTraits,
  MetadataUrlTraits
} from "../../../Traits/TraitsClasses/CatalogMemberTraits";
import {
  KeyValueTraits,
  WebCoverageServiceParameterTraits
} from "../../../Traits/TraitsClasses/ExportWebCoverageServiceTraits";
import { FeatureInfoTemplateTraits } from "../../../Traits/TraitsClasses/FeatureInfoTraits";
import LegendTraits from "../../../Traits/TraitsClasses/LegendTraits";
import { RectangleTraits } from "../../../Traits/TraitsClasses/MappableTraits";
import WebMapServiceCatalogItemTraits, {
  GetFeatureInfoFormat,
  SUPPORTED_CRS_3857,
  SUPPORTED_CRS_4326,
  WebMapServiceAvailableLayerDimensionsTraits,
  WebMapServiceAvailableLayerStylesTraits,
  WebMapServiceAvailableStyleTraits
} from "../../../Traits/TraitsClasses/WebMapServiceCatalogItemTraits";
import LoadableStratum from "../../Definition/LoadableStratum";
import Model, { BaseModel } from "../../Definition/Model";
import StratumFromTraits from "../../Definition/StratumFromTraits";
import createStratumInstance from "../../Definition/createStratumInstance";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import { CapabilitiesStyle } from "./OwsInterfaces";
import WebMapServiceCapabilities, {
  CapabilitiesContactInformation,
  CapabilitiesDimension,
  CapabilitiesLayer,
  MetadataURL,
  getRectangleFromLayer
} from "./WebMapServiceCapabilities";
import WebMapServiceCatalogItem from "./WebMapServiceCatalogItem";
import dateFormat from "dateformat";

/** Transforms WMS GetCapabilities XML into WebMapServiceCatalogItemTraits */
export default class WebMapServiceCapabilitiesStratum extends LoadableStratum(
  WebMapServiceCatalogItemTraits
) {
  static async load(
    catalogItem: WebMapServiceCatalogItem,
    capabilities?: WebMapServiceCapabilities
  ): Promise<WebMapServiceCapabilitiesStratum> {
    if (!isDefined(catalogItem.getCapabilitiesUrl)) {
      throw new TerriaError({
        title: i18next.t("models.webMapServiceCatalogItem.missingUrlTitle"),
        message: i18next.t("models.webMapServiceCatalogItem.missingUrlMessage")
      });
    }

    if (!isDefined(capabilities))
      capabilities = await WebMapServiceCapabilities.fromUrl(
        proxyCatalogItemUrl(
          catalogItem,
          catalogItem.getCapabilitiesUrl,
          catalogItem.getCapabilitiesCacheDuration
        )
      );

    return new WebMapServiceCapabilitiesStratum(catalogItem, capabilities);
  }

  constructor(
    readonly catalogItem: WebMapServiceCatalogItem,
    readonly capabilities: WebMapServiceCapabilities
  ) {
    super();
    makeObservable(this);
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new WebMapServiceCapabilitiesStratum(
      model as WebMapServiceCatalogItem,
      this.capabilities
    ) as this;
  }

  @computed get metadataUrls() {
    const metadataUrls: MetadataURL[] = [];

    Array.from(this.capabilitiesLayers.values()).forEach((layer) => {
      if (!layer?.MetadataURL) return;
      if (Array.isArray(layer?.MetadataURL)) {
        // eslint-disable-next-line no-unsafe-optional-chaining
        metadataUrls.push(...layer?.MetadataURL);
      } else {
        metadataUrls.push(layer?.MetadataURL as MetadataURL);
      }
    });

    return metadataUrls
      .filter((m) => m.OnlineResource?.["xlink:href"])
      .map((m) =>
        createStratumInstance(MetadataUrlTraits, {
          url: m.OnlineResource!["xlink:href"]
        })
      );
  }

  @computed
  get layers(): string | undefined {
    let layers: string | undefined;

    if (this.catalogItem.uri !== undefined) {
      // Try to extract a layer from the URL
      const query: any = this.catalogItem.uri.query(true) ?? {};
      layers = query.layers ?? query.LAYERS;
    }

    if (layers === undefined) {
      // Use all the top-level, named layers
      layers = filterOutUndefined(
        this.capabilities.topLevelNamedLayers.map((layer) => layer.Name)
      ).join(",");
    }

    return layers;
  }

  @computed get tileWidth() {
    const queryParams: any = this.catalogItem.uri?.query(true) ?? {};

    if (isDefined(queryParams.width ?? queryParams.WIDTH)) {
      return parseInt(queryParams.width ?? queryParams.WIDTH, 10);
    }
  }

  @computed get tileHeight() {
    const queryParams: any = this.catalogItem.uri?.query(true) ?? {};

    if (isDefined(queryParams.height ?? queryParams.HEIGHT)) {
      return parseInt(queryParams.height ?? queryParams.HEIGHT, 10);
    }
  }

  /**
 * **How we determine WMS legends (in order)**
  1. Defined manually in catalog JSON
  2. If `style` is undefined, and server doesn't support `GetLegendGraphic`, we must select first style as default - as there is no way to know what the default style is, and to request a legend for it
  3. If `style` is is set and it has a `legendUrl` -> use it!
  4. If server supports `GetLegendGraphic`, we can request a legend (with or without `style` parameter)
 */
  @computed
  get legends(): StratumFromTraits<LegendTraits>[] | undefined {
    const availableStyles = this.catalogItem.availableStyles || [];
    const layers = this.catalogItem.layersArray;
    const styles = this.catalogItem.stylesArray;

    const result: StratumFromTraits<LegendTraits>[] = [];

    for (let i = 0; i < layers.length; ++i) {
      const layer = layers[i];
      const style = i < styles.length ? styles[i] : undefined;

      let legendUri: URI | undefined;
      let legendUrlMimeType: string | undefined;
      let legendScaling: number | undefined;

      const layerAvailableStyles = availableStyles.find(
        (candidate) => candidate.layerName === layer
      )?.styles;

      let layerStyle: Model<WebMapServiceAvailableStyleTraits> | undefined;

      if (isDefined(style)) {
        // Attempt to find layer style based on AvailableStyleTraits
        layerStyle = layerAvailableStyles?.find(
          (candidate) => candidate.name === style
        );
      }

      // If no style is selected and this WMS doesn't support GetLegendGraphics - we must use the first style if none is explicitly specified.
      // (If WMS supports GetLegendGraphics we can use it and omit style parameter to get the "default" style's legend)
      if (!isDefined(layerStyle) && !this.catalogItem.supportsGetLegendGraphic)
        layerStyle = layerAvailableStyles?.[0];

      // If legend found - proxy URL and set mimetype
      if (layerStyle?.legend?.url) {
        legendUri = URI(
          proxyCatalogItemUrl(this.catalogItem, layerStyle.legend.url)
        );

        legendUrlMimeType = layerStyle.legend.urlMimeType;
      }

      // If no legends found and WMS supports GetLegendGraphics - make one up!
      if (
        !isDefined(legendUri) &&
        isDefined(this.catalogItem.url) &&
        this.catalogItem.supportsGetLegendGraphic
      ) {
        legendUri = URI(
          proxyCatalogItemUrl(
            this.catalogItem,
            this.catalogItem.getLegendBaseUrl()
          )
        );
        legendUri
          .setQuery("service", "WMS")
          .setQuery(
            "version",
            this.catalogItem.useWmsVersion130 ? "1.3.0" : "1.1.1"
          )
          .setQuery("request", "GetLegendGraphic")
          .setQuery("format", "image/png")
          .setQuery("sld_version", "1.1.0")
          .setQuery("layer", layer);

        // From OGC — about style property for GetLegendGraphic request:
        // If not present, the default style is selected. The style may be any valid style available for a layer, including non-SLD internally-defined styles.
        if (style) {
          legendUri.setQuery("style", style);
        }
        legendUrlMimeType = "image/png";
      }

      if (isDefined(legendUri)) {
        // Add geoserver related LEGEND_OPTIONS to match terria styling (if supported)
        if (
          this.catalogItem.isGeoServer &&
          legendUri.hasQuery("request", "GetLegendGraphic")
        ) {
          let legendOptions =
            "fontName:Courier;fontStyle:bold;fontSize:12;forceLabels:on;fontAntiAliasing:true;labelMargin:5";

          // Geoserver fontColor must be a hex value - use `textLight` theme colour
          let fontColor = terriaTheme.textLight.split("#")?.[1];
          if (isDefined(fontColor)) {
            // If fontColor is a 3-character hex -> turn into 6
            if (fontColor.length === 3) {
              fontColor = `${fontColor[0]}${fontColor[0]}${fontColor[1]}${fontColor[1]}${fontColor[2]}${fontColor[2]}`;
            }
            legendOptions += `;fontColor:0x${fontColor}`;
          }

          legendOptions += ";dpi:182"; // enable if we can scale the image back down by 50%.
          legendScaling = 0.5;
          legendUri.setQuery("LEGEND_OPTIONS", legendOptions);
          legendUri.setQuery("transparent", "true");
        }

        // Add colour scale range params if supported
        if (
          this.catalogItem.supportsColorScaleRange &&
          this.catalogItem.colorScaleRange
        ) {
          legendUri.setQuery(
            "colorscalerange",
            this.catalogItem.colorScaleRange
          );
        }
        result.push(
          createStratumInstance(LegendTraits, {
            url: legendUri.toString(),
            urlMimeType: legendUrlMimeType,
            imageScaling: legendScaling
          })
        );
      }
    }

    return result;
  }

  @computed
  get capabilitiesLayers(): ReadonlyMap<string, CapabilitiesLayer | undefined> {
    const lookup: (name: string) => [string, CapabilitiesLayer | undefined] = (
      name
    ) => [name, this.capabilities && this.capabilities.findLayer(name)];
    return new Map(this.catalogItem.layersArray.map(lookup));
  }

  @computed get availableCrs() {
    // Get set of supported CRS from layer hierarchy
    const layerCrs = new Set<string>();
    this.capabilitiesLayers.forEach((layer) => {
      if (layer) {
        const srs = this.capabilities.getInheritedValues(layer, "SRS");
        const crs = this.capabilities.getInheritedValues(layer, "CRS");
        [
          ...(Array.isArray(srs) ? srs : [srs]),
          ...(Array.isArray(crs) ? crs : [crs])
        ].forEach((c) => layerCrs.add(c));
      }
    });

    return Array.from(layerCrs);
  }

  @computed get crs() {
    // Note order is important here, the first one found will be used
    const supportedCrs = [...SUPPORTED_CRS_3857, ...SUPPORTED_CRS_4326];

    // First check to see if URL has CRS or SRS
    const queryParams: any = this.catalogItem.uri?.query(true) ?? {};
    const urlCrs =
      queryParams.crs ?? queryParams.CRS ?? queryParams.srs ?? queryParams.SRS;

    if (urlCrs && supportedCrs.includes(urlCrs)) return urlCrs;

    // If nothing is supported, ask for EPSG:3857, and hope for the best.
    return (
      supportedCrs.find((crs) => this.availableCrs.includes(crs)) ?? "EPSG:3857"
    );
  }

  @computed
  get availableDimensions(): StratumFromTraits<WebMapServiceAvailableLayerDimensionsTraits>[] {
    const result: StratumFromTraits<WebMapServiceAvailableLayerDimensionsTraits>[] =
      [];

    if (!this.capabilities) {
      return result;
    }

    const capabilitiesLayers = this.capabilitiesLayers;

    for (const layerTuple of capabilitiesLayers) {
      const layerName = layerTuple[0];
      const layer = layerTuple[1];

      const dimensions: ReadonlyArray<CapabilitiesDimension> = layer
        ? this.capabilities.getInheritedValues(layer, "Dimension")
        : [];

      result.push({
        layerName: layerName,
        dimensions: dimensions
          .filter((dim) => dim.name !== "time")
          .map((dim) => {
            return {
              name: dim.name,
              units: dim.units,
              unitSymbol: dim.unitSymbol,
              default: dim.default,
              multipleValues: dim.multipleValues,
              current: dim.current,
              nearestValue: dim.nearestValue,
              values: dim.text?.split(",")
            };
          })
      });
    }

    return result;
  }

  @computed
  get availableStyles(): StratumFromTraits<WebMapServiceAvailableLayerStylesTraits>[] {
    const result: StratumFromTraits<WebMapServiceAvailableLayerStylesTraits>[] =
      [];

    if (!this.capabilities) {
      return result;
    }

    const capabilitiesLayers = this.capabilitiesLayers;
    for (const layerTuple of capabilitiesLayers) {
      const layerName = layerTuple[0];
      const layer = layerTuple[1];

      const styles: ReadonlyArray<CapabilitiesStyle> = layer
        ? this.capabilities.getInheritedValues(layer, "Style")
        : [];
      result.push({
        layerName: layerName,
        styles: styles.map((style) => {
          const wmsLegendUrl = isReadOnlyArray(style.LegendURL)
            ? style.LegendURL[0]
            : style.LegendURL;

          let legendUri, legendMimeType;
          if (
            wmsLegendUrl &&
            wmsLegendUrl.OnlineResource &&
            wmsLegendUrl.OnlineResource["xlink:href"]
          ) {
            legendUri = new URI(
              decodeURIComponent(wmsLegendUrl.OnlineResource["xlink:href"])
            );
            legendMimeType = wmsLegendUrl.Format;
          }
          const legend = !legendUri
            ? undefined
            : createStratumInstance(LegendTraits, {
                url: legendUri.toString(),
                urlMimeType: legendMimeType,
                title:
                  (capabilitiesLayers.size > 1 && layer?.Title) || undefined // Add layer Title as legend title if showing multiple layers
              });

          return {
            name: style.Name,
            title: style.Title,
            abstract: style.Abstract,
            legend: legend
          };
        })
      });
    }

    return result;
  }

  /** There is no way of finding out default style if no style has been selected :(
   * If !supportsGetLegendGraphic - we have to just use the first available style (for each layer)
   * This is because, to request a "default" legend we need GetLegendGraphics
   **/
  @computed get styles() {
    if (this.catalogItem.uri !== undefined) {
      // Try to extract a styles from the URL
      const query: any = this.catalogItem.uri.query(true) ?? {};
      if (isDefined(query.styles ?? query.STYLES))
        return query.styles ?? query.STYLES;
    }

    if (!this.catalogItem.supportsGetLegendGraphic) {
      return this.catalogItem.availableStyles
        .map((layer) => {
          if (layer.layerName && layer.styles.length > 0) {
            return layer.styles[0].name ?? "";
          }
          return "";
        })
        .join(",");
    }
  }

  @computed
  get info(): StratumFromTraits<InfoSectionTraits>[] {
    const result: StratumFromTraits<InfoSectionTraits>[] = [];

    let firstDataDescription: string | undefined;

    result.push(
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t("models.webMapServiceCatalogItem.serviceDescription"),
        contentAsObject: this.capabilities.Service as JsonObject,
        // Hide big ugly table by default
        show: false
      })
    );

    const onlyHasSingleLayer = this.catalogItem.layersArray.length === 1;

    if (onlyHasSingleLayer) {
      // Clone the capabilitiesLayer as we'll modify it in a second
      const out = Object.assign(
        {},
        this.capabilitiesLayers.get(this.catalogItem.layersArray[0])
      ) as any;

      if (out !== undefined) {
        // The Dimension object is really weird and has a bunch of stray text in there
        if ("Dimension" in out) {
          const goodDimension: any = {};
          Object.keys(out.Dimension).forEach((k: any) => {
            if (isNaN(k)) {
              goodDimension[k] = out.Dimension[k];
            }
          });
          out.Dimension = goodDimension;
        }

        // remove a circular reference to the parent
        delete out._parent;

        try {
          result.push(
            createStratumInstance(InfoSectionTraits, {
              name: i18next.t(
                "models.webMapServiceCatalogItem.dataDescription"
              ),
              contentAsObject: out as JsonObject,
              // Hide big ugly table by default
              show: false
            })
          );
        } catch (e) {
          console.log(
            `FAILED to create InfoSection with WMS layer Capabilities`
          );
          console.log(e);
        }
      }
    }

    for (const layer of this.capabilitiesLayers.values()) {
      if (
        !layer ||
        !layer.Abstract ||
        containsAny(layer.Abstract, WebMapServiceCatalogItem.abstractsToIgnore)
      ) {
        continue;
      }

      const suffix =
        this.capabilitiesLayers.size === 1 ? "" : ` - ${layer.Title}`;
      const name = `Web Map Service Layer Description${suffix}`;
      result.push(
        createStratumInstance(InfoSectionTraits, {
          name,
          content: layer.Abstract
        })
      );
      firstDataDescription = firstDataDescription || layer.Abstract;
    }

    // Show the service abstract if there is one and if it isn't the Geoserver default "A compliant implementation..."
    const service = this.capabilities && this.capabilities.Service;
    if (service) {
      if (service.ContactInformation !== undefined) {
        result.push(
          createStratumInstance(InfoSectionTraits, {
            name: i18next.t("models.webMapServiceCatalogItem.serviceContact"),
            content: getServiceContactInformation(service.ContactInformation)
          })
        );
      }

      result.push(
        createStratumInstance(InfoSectionTraits, {
          name: i18next.t("models.webMapServiceCatalogItem.getCapabilitiesUrl"),
          content: this.catalogItem.getCapabilitiesUrl
        })
      );

      if (
        service &&
        service.Abstract &&
        !containsAny(
          service.Abstract,
          WebMapServiceCatalogItem.abstractsToIgnore
        ) &&
        service.Abstract !== firstDataDescription
      ) {
        result.push(
          createStratumInstance(InfoSectionTraits, {
            name: i18next.t(
              "models.webMapServiceCatalogItem.serviceDescription"
            ),
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
              "models.webMapServiceCatalogItem.accessConstraints"
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
    let layerDescriptions = [`Web Map Service Layer Description`];

    // If more than one layer, push layer description titles for each applicable layer
    if (this.capabilitiesLayers.size > 1) {
      layerDescriptions = [];
      this.capabilitiesLayers.forEach((layer) => {
        if (
          layer &&
          layer.Abstract &&
          !containsAny(
            layer.Abstract,
            WebMapServiceCatalogItem.abstractsToIgnore
          )
        ) {
          layerDescriptions.push(
            `Web Map Service Layer Description - ${layer.Title}`
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
      i18next.t("models.webMapServiceCatalogItem.serviceDescription"),
      i18next.t("preview.resourceDescription"),
      i18next.t("preview.licence"),
      i18next.t("preview.accessConstraints"),
      i18next.t("models.webMapServiceCatalogItem.accessConstraints"),
      i18next.t("preview.author"),
      i18next.t("preview.contact"),
      i18next.t("models.webMapServiceCatalogItem.serviceContact"),
      i18next.t("preview.created"),
      i18next.t("preview.modified"),
      i18next.t("preview.updateFrequency"),
      i18next.t("models.webMapServiceCatalogItem.getCapabilitiesUrl")
    ];
  }

  @computed
  get shortReport() {
    const catalogItem = this.catalogItem;
    if (catalogItem.isShowingDiff) {
      const format = "yyyy/mm/dd";
      const d1 = dateFormat(catalogItem.firstDiffDate, format);
      const d2 = dateFormat(catalogItem.secondDiffDate, format);
      return `Showing difference image computed for ${catalogItem.diffStyleId} style on dates ${d1} and ${d2}`;
    }
  }

  @computed
  get rectangle(): StratumFromTraits<RectangleTraits> | undefined {
    const layers: CapabilitiesLayer[] = [...this.capabilitiesLayers.values()]
      .filter((layer) => layer !== undefined)
      .map((l) => l!);
    // Get union of bounding rectangles for all layers
    const allLayersRectangle = layers.reduce<Rectangle | undefined>(
      (unionRectangle, layer) => {
        // Convert to cesium Rectangle (so we can use Rectangle.union)
        const latLonRect = getRectangleFromLayer(layer);

        if (
          !isDefined(latLonRect?.west) ||
          !isDefined(latLonRect?.south) ||
          !isDefined(latLonRect?.east) ||
          !isDefined(latLonRect?.north)
        )
          return;

        const cesiumRectangle = Rectangle.fromDegrees(
          latLonRect?.west,
          latLonRect?.south,
          latLonRect?.east,
          latLonRect?.north
        );

        if (!unionRectangle) {
          return cesiumRectangle;
        }

        return Rectangle.union(unionRectangle, cesiumRectangle);
      },
      undefined
    );

    if (
      allLayersRectangle &&
      isDefined(allLayersRectangle.west) &&
      isDefined(allLayersRectangle.south) &&
      isDefined(allLayersRectangle.east) &&
      isDefined(allLayersRectangle.north)
    ) {
      return {
        west: CesiumMath.toDegrees(allLayersRectangle.west),
        south: CesiumMath.toDegrees(allLayersRectangle.south),
        east: CesiumMath.toDegrees(allLayersRectangle.east),
        north: CesiumMath.toDegrees(allLayersRectangle.north)
      };
    }
  }

  @computed
  get isGeoServer(): boolean | undefined {
    const keyword = this.capabilities?.Service?.KeywordList?.Keyword;
    return (
      (isReadOnlyArray(keyword) && keyword.indexOf("GEOSERVER") >= 0) ||
      keyword === "GEOSERVER" ||
      this.catalogItem.url?.toLowerCase().includes("geoserver")
    );
  }

  // TODO - There is possibly a better way to do this
  @computed
  get isThredds(): boolean {
    if (
      this.catalogItem.url &&
      (this.catalogItem.url.indexOf("thredds") > -1 ||
        this.catalogItem.url.indexOf("tds") > -1)
    ) {
      return true;
    }
    return false;
  }

  // TODO - Geoserver also support NCWMS via a plugin, just need to work out how to detect that
  @computed
  get isNcWMS(): boolean {
    if (this.catalogItem.isThredds) return true;
    return false;
  }

  @computed
  get isEsri(): boolean {
    if (this.catalogItem.url !== undefined)
      return (
        this.catalogItem.url.toLowerCase().indexOf("mapserver/wmsserver") > -1
      );
    return false;
  }

  @computed
  get supportsGetLegendGraphic(): boolean {
    const capabilities = this.capabilities?.json?.Capability;

    return (
      isDefined(this.capabilities?.json?.["xmlns:sld"]) ||
      isDefined(capabilities?.Request?.GetLegendGraphic) ||
      (Array.isArray(capabilities?.ExtendedCapabilities?.ExtendedRequest) &&
        capabilities.ExtendedCapabilities.ExtendedRequest.find(
          (r: JsonObject) => r?.Request === "GetLegendGraphic"
        )) ||
      (this.catalogItem.isGeoServer ?? false) ||
      (this.catalogItem.isNcWMS ?? false)
    );
  }

  @computed
  get supportsGetTimeseries() {
    // Don't use GetTimeseries if there is only one timeslice
    if ((this.catalogItem.discreteTimes?.length ?? 0) <= 1) return false;

    const capabilities = this.capabilities?.json?.Capability;

    return !!(
      isDefined(capabilities?.Request?.GetTimeseries) ||
      (Array.isArray(capabilities?.ExtendedCapabilities?.ExtendedRequest) &&
        capabilities.ExtendedCapabilities.ExtendedRequest.find(
          (r: JsonObject) => r?.Request === "GetTimeseries"
        ))
    );
  }

  @computed
  get supportsColorScaleRange(): boolean {
    return this.catalogItem.isNcWMS;
  }

  @computed
  get discreteTimes(): { time: string; tag: string | undefined }[] | undefined {
    const result = [];

    for (const layer of this.capabilitiesLayers.values()) {
      if (!layer) {
        continue;
      }
      const dimensions = this.capabilities.getInheritedValues(
        layer,
        "Dimension"
      );

      const timeDimension = dimensions.find(
        (dimension) => dimension.name.toLowerCase() === "time"
      );
      if (!timeDimension) {
        continue;
      }

      let extent: string = timeDimension;

      // WMS 1.1.1 puts dimension values in an Extent element instead of directly in the Dimension element.
      const extentElements = this.capabilities.getInheritedValues(
        layer,
        "Extent"
      );
      const extentElement = extentElements.find(
        (extent) => extent.name.toLowerCase() === "time"
      );
      if (extentElement) {
        extent = extentElement;
      }

      if (!extent || !extent.split) {
        continue;
      }

      const values = extent.split(",");
      for (let i = 0; i < values.length; ++i) {
        const value = values[i];
        const isoSegments = value.split("/");
        if (isoSegments.length === 1) {
          result.push({
            time: values[i],
            tag: undefined
          });
        } else {
          createDiscreteTimesFromIsoSegments(
            result,
            isoSegments[0],
            isoSegments[1],
            isoSegments[2],
            this.catalogItem.maxRefreshIntervals
          );
        }
      }
    }

    return result;
  }

  @computed get initialTimeSource() {
    return "now";
  }

  @computed get currentTime() {
    // Get default times for all layers
    const defaultTimes = filterOutUndefined(
      Array.from(this.capabilitiesLayers).map(([_layerName, layer]) => {
        if (!layer) return;
        const dimensions = this.capabilities.getInheritedValues(
          layer,
          "Dimension"
        );

        const timeDimension = dimensions.find(
          (dimension) => dimension.name.toLowerCase() === "time"
        );

        return timeDimension?.default;
      })
    );

    // From WMS 1.3.0 spec:
    // For the TIME parameter, the special keyword “current” may be used if the <Dimension name="time"> service metadata element includes a nonzero value for the “current” attribute, as described in C.2.
    // The expression “TIME=current” means “send the most current data available”.

    // Here we return undefined, because WebMapServiceCapabilitiesStratum.initialTimeSource is set to "now"
    if (defaultTimes[0] === "current") {
      return undefined;
    }

    // Return first default time
    return defaultTimes[0];
  }

  /** Prioritize format of GetFeatureInfo:
   * - JSON/GeoJSON
   * - If ESRI, then we prioritise XML next
   * - HTML
   * - GML
   * - XML
   * - Plain text
   *
   * If no matching format can be found in GetCapabilities, then Cesium will use defaults (see `WebMapServiceImageryProvider.DefaultGetFeatureInfoFormats`)
   *
   * If supportsGetTimeseries, use CSV
   */
  @computed get getFeatureInfoFormat():
    | StratumFromTraits<GetFeatureInfoFormat>
    | undefined {
    const formats: string | string[] | undefined =
      this.capabilities.json?.Capability?.Request?.GetFeatureInfo?.Format;

    const formatsArray = isJsonArray(formats)
      ? formats
      : isJsonString(formats)
      ? [formats]
      : [];

    if (this.catalogItem.supportsGetTimeseries) {
      return { format: "text/csv", type: "text" };
    }

    if (formatsArray.includes("application/json"))
      return { format: "application/json", type: "json" };
    if (formatsArray.includes("application/geo+json"))
      return { format: "application/geo+json", type: "json" };
    if (formatsArray.includes("application/vnd.geo+json"))
      return { format: "application/vnd.geo+json", type: "json" };

    // Special case for Esri WMS, use XML before HTML/GML
    // as HTML includes <table> with rowbg that is hard to read
    if (this.isEsri && formatsArray.includes("text/xml")) {
      return { format: "text/xml", type: "xml" };
    }
    if (formatsArray.includes("text/html"))
      return { format: "text/html", type: "html" };
    if (formatsArray.includes("application/vnd.ogc.gml"))
      return { format: "application/vnd.ogc.gml", type: "xml" };

    // For non-Esri services, we use XML after HTML/GML
    if (formatsArray.includes("text/xml")) {
      return { format: "text/xml", type: "xml" };
    }
    if (formatsArray.includes("text/plain"))
      return { format: "text/plain", type: "text" };
  }

  /** If supportsGetTimeseries, override the "request" parameter in GetFeatureInfo to be "GetTimeseries".
   * We also set time to empty, so we get values for all times (as opposed to just the current time)
   */
  @computed get getFeatureInfoParameters() {
    if (this.catalogItem.supportsGetTimeseries) {
      return { request: "GetTimeseries", time: "" };
    }
    return undefined;
  }

  /** If getFeatureInfoFormat is text/csv, set featureInfoTemplate to show chart. */
  @computed
  get featureInfoTemplate() {
    if (this.catalogItem.getFeatureInfoFormat.format === "text/csv")
      return createStratumInstance(FeatureInfoTemplateTraits, {
        template: `{{terria.timeSeries.chart}}`,
        showFeatureInfoDownloadWithTemplate: true
      });
  }

  @computed get linkedWcsParameters() {
    // Get outputCrs
    // Note: this will be overridden by `WebCoverageServiceDescribeCoverageStratum` if a better outputCrs is found
    let outputCrs = this.availableCrs[0];

    // Unless it is Web Mercator of course - that would be stupid
    // If this is the case - use 4326
    outputCrs =
      outputCrs && SUPPORTED_CRS_3857.includes(outputCrs)
        ? "EPSG:4326"
        : outputCrs;

    // Get WCS subsets from time and WMS dimensions
    // These are used to "subset" WCS coverage (dataset)

    // This is used to flag subsets (dimensions) which have multiple values
    // Each element in this array represents the **actual** value used for a subset which has multiple values
    const duplicateSubsetValues: StratumFromTraits<KeyValueTraits>[] = [];

    // Get dimensionSubsets
    const dimensionSubsets: { key: string; value: string }[] = [];
    if (this.catalogItem.dimensions) {
      Object.entries(this.catalogItem.dimensions).forEach(([key, values]) => {
        if (isDefined(values)) {
          // If we have multiple values for a particular dimension, they will be comma separated
          // WCS only supports a single value per dimension - so we take the first value
          const valuesArray = values.split(",");
          const value = valuesArray[0];

          if (valuesArray.length > 1) {
            duplicateSubsetValues.push(
              createStratumInstance(KeyValueTraits, { key, value })
            );
          }

          // Wrap string values in double quotes
          dimensionSubsets.push({ key, value });
        }
      });
    }

    const subsets = filterOutUndefined([
      // Add time dimension
      this.catalogItem.currentDiscreteTimeTag
        ? { key: "time", value: this.catalogItem.currentDiscreteTimeTag }
        : undefined,
      // Add other dimensions
      ...dimensionSubsets
    ]).map((subset) => createStratumInstance(KeyValueTraits, subset));

    return createStratumInstance(WebCoverageServiceParameterTraits, {
      outputCrs,
      subsets,
      duplicateSubsetValues,
      // Add styles parameter for OpenDataCube WCS
      additionalParameters: [{ key: "styles", value: this.catalogItem.styles }]
    });
  }
}

function getServiceContactInformation(
  contactInfo: CapabilitiesContactInformation
) {
  const primary = contactInfo.ContactPersonPrimary;
  let text = "";
  if (isDefined(primary)) {
    if (
      isDefined(primary.ContactOrganization) &&
      primary.ContactOrganization.length > 0 &&
      // Geoserver default
      primary.ContactOrganization !== "The Ancient Geographers"
    ) {
      text += primary.ContactOrganization + "<br/>";
    }
  }

  if (
    isDefined(contactInfo.ContactElectronicMailAddress) &&
    contactInfo.ContactElectronicMailAddress.length > 0 &&
    // Geoserver default
    contactInfo.ContactElectronicMailAddress !== "claudius.ptolomaeus@gmail.com"
  ) {
    text += `[${contactInfo.ContactElectronicMailAddress}](mailto:${contactInfo.ContactElectronicMailAddress})`;
  }

  return text;
}
