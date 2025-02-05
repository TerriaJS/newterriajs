import {
  featureCollection,
  Geometry,
  GeometryCollection,
  Properties
} from "@turf/helpers";
import i18next from "i18next";
import { computed, makeObservable, override, runInAction } from "mobx";
import proj4 from "proj4";
import Color from "terriajs-cesium/Source/Core/Color";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import URI from "urijs";
import isDefined from "../../../Core/isDefined";
import loadJson from "../../../Core/loadJson";
import replaceUnderscores from "../../../Core/replaceUnderscores";
import { networkRequestError } from "../../../Core/TerriaError";
import ProtomapsImageryProvider from "../../../Map/ImageryProvider/ProtomapsImageryProvider";
import featureDataToGeoJson from "../../../Map/PickedFeatures/featureDataToGeoJson";
import Proj4Definitions from "../../../Map/Vector/Proj4Definitions";
import { ProtomapsArcGisPbfSource } from "../../../Map/Vector/Protomaps/ProtomapsArcGisPbfSource";
import { tableStyleToProtomaps } from "../../../Map/Vector/Protomaps/tableStyleToProtomaps";
import GeoJsonMixin, {
  FeatureCollectionWithCrs
} from "../../../ModelMixins/GeojsonMixin";
import MinMaxLevelMixin from "../../../ModelMixins/MinMaxLevelMixin";
import ArcGisFeatureServerCatalogItemTraits from "../../../Traits/TraitsClasses/ArcGisFeatureServerCatalogItemTraits";
import { InfoSectionTraits } from "../../../Traits/TraitsClasses/CatalogMemberTraits";
import { RectangleTraits } from "../../../Traits/TraitsClasses/MappableTraits";
import TableColorStyleTraits, {
  EnumColorTraits
} from "../../../Traits/TraitsClasses/Table/ColorStyleTraits";
import TableColumnTraits from "../../../Traits/TraitsClasses/Table/ColumnTraits";
import TableOutlineStyleTraits, {
  BinOutlineSymbolTraits,
  EnumOutlineSymbolTraits,
  OutlineSymbolTraits
} from "../../../Traits/TraitsClasses/Table/OutlineStyleTraits";
import TablePointSizeStyleTraits from "../../../Traits/TraitsClasses/Table/PointSizeStyleTraits";
import TablePointStyleTraits, {
  BinPointSymbolTraits,
  EnumPointSymbolTraits,
  PointSymbolTraits
} from "../../../Traits/TraitsClasses/Table/PointStyleTraits";
import TableStyleTraits from "../../../Traits/TraitsClasses/Table/StyleTraits";
import CreateModel from "../../Definition/CreateModel";
import createStratumInstance from "../../Definition/createStratumInstance";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel, ModelConstructorParameters } from "../../Definition/Model";
import StratumFromTraits from "../../Definition/StratumFromTraits";
import StratumOrder from "../../Definition/StratumOrder";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

interface DocumentInfo {
  Author?: string;
}

type EsriStyleTypes =
  | "esriPMS" // simple picture style
  | "esriSMS" // simple marker style
  | "esriSLS" // simple line style
  | "esriSFS"; // simple fill style

/** as defined https://developers.arcgis.com/web-map-specification/objects/esriSFS_symbol/ */
type SupportedFillStyle =
  | "esriSFSSolid" // fill line with color
  | "esriSFSNull"; // no fill

/** as defined https://developers.arcgis.com/web-map-specification/objects/esriSMS_symbol/ */
type SupportedSimpleMarkerStyle =
  | "esriSMSCircle"
  | "esriSMSCross"
  | "esriSMSDiamond"
  | "esriSMSSquare"
  | "esriSMSTriangle"
  | "esriSMSX";

/** as defined https://developers.arcgis.com/web-map-specification/objects/esriSLS_symbol/ */
export type SupportedLineStyle =
  | "esriSLSSolid" // solid line
  | "esriSLSDash" // dashes (-----)
  | "esriSLSDashDot" // line (-.-.-)
  | "esriSLSDashDotDot" // line (-..-..-)
  | "esriSLSDot" // dotted line (.....)
  | "esriSLSLongDash"
  | "esriSLSLongDashDot"
  | "esriSLSShortDash"
  | "esriSLSShortDashDot"
  | "esriSLSShortDashDotDot"
  | "esriSLSShortDot"
  | "esriSLSNull";

/** as defined https://developers.arcgis.com/web-map-specification/objects/symbol/ */
interface ISymbol {
  contentType: string;
  color?: number[];
  outline?: Outline;
  imageData?: any;
  xoffset?: number;
  yoffset?: number;
  width?: number;
  height?: number;
  angle?: number;
  size?: number;
  type: EsriStyleTypes;
  url?: string;
  style?: SupportedSimpleMarkerStyle | SupportedLineStyle | SupportedFillStyle;
}

interface Outline {
  type: EsriStyleTypes;
  color: number[];
  width: number;
  style?: SupportedLineStyle;
}

interface Renderer {
  type: "simple" | "uniqueValue" | "classBreaks";
}

interface ClassBreakInfo extends SimpleRenderer {
  classMaxValue: number;
  classMinValue?: number;
}

interface ClassBreaksRenderer extends Renderer {
  field: string;
  classBreakInfos: ClassBreakInfo[];
  defaultSymbol: ISymbol | null;

  /** Note, value expressions are not supported */
  valueExpression?: string;
  valueExpressionTitle?: string;

  /** Note, visual variables are not supported. See https://developers.arcgis.com/web-map-specification/objects/visualVariable/ */
  visualVariables?: unknown[];
}

interface UniqueValueInfo extends SimpleRenderer {
  value: string;
}

/**
 * See https://developers.arcgis.com/web-map-specification/objects/uniqueValueRenderer/
 */
interface UniqueValueRenderer extends Renderer {
  /** Terria only supports `field1`, not multiple fields (`field2` or `field3`). */
  field1: string;
  field2?: string;
  field3?: string;
  fieldDelimiter?: string;
  uniqueValueInfos: UniqueValueInfo[];
  defaultSymbol: ISymbol | null;

  /** Note, value expressions are not supported */
  valueExpression?: string;
  valueExpressionTitle?: string;

  /** Note, visual variables are not supported. See https://developers.arcgis.com/web-map-specification/objects/visualVariable/ */
  visualVariables?: unknown[];
}

// https://developers.arcgis.com/web-map-specification/objects/simpleRenderer/
interface SimpleRenderer extends Renderer {
  label?: string;
  symbol: ISymbol | null;

  /** Note, visual variables are not supported. See https://developers.arcgis.com/web-map-specification/objects/visualVariable/ */
  visualVariables?: unknown[];
}

interface DrawingInfo {
  renderer: Renderer;
}

interface FeatureServer {
  documentInfo?: DocumentInfo;
  name?: string;
  description?: string;
  copyrightText?: string;
  drawingInfo?: DrawingInfo;
  extent?: Extent;
  minScale?: number;
  maxScale?: number;
  advancedQueryCapabilities?: {
    supportsPagination: boolean;
  };
  supportedQueryFormats?: string;
  maxRecordCount?: number;
  tileMaxRecordCount?: number;
  maxRecordCountFactor?: number;
  supportsCoordinatesQuantization?: boolean;
  supportsTilesAndBasicQueriesMode?: boolean;
  objectIdField?: string;
  fields?: Field[];
}

type FieldType =
  | "esriFieldTypeSmallInteger"
  | "esriFieldTypeInteger"
  | "esriFieldTypeSingle"
  | "esriFieldTypeDouble"
  | "esriFieldTypeString"
  | "esriFieldTypeDate"
  | "esriFieldTypeOID"
  | "esriFieldTypeGeometry"
  | "esriFieldTypeBlob"
  | "esriFieldTypeRaster"
  | "esriFieldTypeGUID"
  | "esriFieldTypeGlobalID"
  | "esriFieldTypeXML"
  | "esriFieldTypeBigInteger";

const fieldTypeToTableColumn: Record<FieldType, string> = {
  esriFieldTypeSmallInteger: "scalar",
  esriFieldTypeInteger: "scalar",
  esriFieldTypeSingle: "scalar",
  esriFieldTypeDouble: "scalar",
  esriFieldTypeString: "text",
  esriFieldTypeDate: "time",
  esriFieldTypeOID: "scalar",
  esriFieldTypeGeometry: "hidden",
  esriFieldTypeBlob: "hidden",
  esriFieldTypeRaster: "hidden",
  esriFieldTypeGUID: "hidden",
  esriFieldTypeGlobalID: "hidden",
  esriFieldTypeXML: "hidden",
  esriFieldTypeBigInteger: "scalar"
};

interface Field {
  name: string;
  type: FieldType;
  alias?: string;
  domain?: unknown;
  editable?: boolean;
  nullable?: boolean;
  length?: number;
  defaultValue?: unknown;
  modelName?: string;
}

interface SpatialReference {
  wkid?: string;
  latestWkid?: string;
}

interface Extent {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  spatialReference?: SpatialReference;
}

class FeatureServerStratum extends LoadableStratum(
  ArcGisFeatureServerCatalogItemTraits
) {
  static stratumName = "featureServer";

  constructor(
    private readonly _item: ArcGisFeatureServerCatalogItem,
    private readonly _featureServer?: FeatureServer,
    private _esriJson?: any | undefined
  ) {
    super();
    makeObservable(this);
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new FeatureServerStratum(
      newModel as ArcGisFeatureServerCatalogItem,
      this._esriJson
    ) as this;
  }

  @computed
  get featureServerData(): FeatureServer | undefined {
    return this._featureServer;
  }

  static async load(
    item: ArcGisFeatureServerCatalogItem
  ): Promise<FeatureServerStratum> {
    if (item.url === undefined) {
      return new FeatureServerStratum(item, undefined, undefined);
    }
    const metaUrl = buildMetadataUrl(item);
    const featureServer = await loadJson(metaUrl);
    return new FeatureServerStratum(item, featureServer, undefined);
  }

  @computed
  get shortReport(): string | undefined {
    // Show notice if reached
    if (
      this._item.readyData?.features !== undefined &&
      this._item.readyData!.features.length >= this._item.maxFeatures
    ) {
      return i18next.t(
        "models.arcGisFeatureServerCatalogItem.reachedMaxFeatureLimit",
        this._item
      );
    }
    return undefined;
  }

  @computed get maxScaleDenominator(): number | undefined {
    return this._featureServer?.minScale;
  }

  @computed get minScaleDenominator(): number | undefined {
    return this._featureServer?.maxScale;
  }

  @computed get name(): string | undefined {
    if (
      this._featureServer?.name !== undefined &&
      this._featureServer.name.length > 0
    ) {
      return replaceUnderscores(this._featureServer.name);
    }
  }

  @computed get dataCustodian(): string | undefined {
    if (
      this._featureServer?.documentInfo &&
      this._featureServer?.documentInfo.Author &&
      this._featureServer?.documentInfo.Author.length > 0
    ) {
      return this._featureServer.documentInfo.Author;
    }
  }

  @computed get rectangle(): StratumFromTraits<RectangleTraits> | undefined {
    const extent = this._featureServer?.extent;
    const wkidCode =
      extent?.spatialReference?.latestWkid ?? extent?.spatialReference?.wkid;

    if (isDefined(extent) && isDefined(wkidCode)) {
      const wkid = "EPSG:" + wkidCode;
      if (!isDefined(Proj4Definitions[wkid])) {
        return undefined;
      }

      const source = Proj4Definitions[wkid];
      const dest = "EPSG:4326";

      let p = proj4(source, dest, [extent.xmin, extent.ymin]);

      const west = p[0];
      const south = p[1];

      p = proj4(source, dest, [extent.xmax, extent.ymax]);

      const east = p[0];
      const north = p[1];

      const rectangle = { west: west, south: south, east: east, north: north };
      return createStratumInstance(RectangleTraits, rectangle);
    }

    return undefined;
  }

  @computed get info() {
    return [
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t("models.arcGisMapServerCatalogItem.dataDescription"),
        content: this._featureServer?.description
      }),
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t("models.arcGisMapServerCatalogItem.copyrightText"),
        content: this._featureServer?.copyrightText
      })
    ];
  }

  @computed get supportsPagination(): boolean {
    if (
      this._featureServer === undefined ||
      this._featureServer.advancedQueryCapabilities === undefined
    ) {
      return false;
    }

    return !!this._featureServer.advancedQueryCapabilities.supportsPagination;
  }

  @computed get activeStyle() {
    return "ESRI";
  }

  @computed get styles() {
    const renderer = this._featureServer?.drawingInfo?.renderer;

    if (!renderer) return [];

    const rendererType = renderer.type;

    if (rendererType === "simple") {
      const simpleRenderer = renderer as SimpleRenderer;
      const symbol = simpleRenderer.symbol;

      if (simpleRenderer.visualVariables?.length) {
        console.warn(
          `WARNING: Terria does not support visual variables in ArcGisFeatureService SimpleRenderers`
        );
      }

      if (!symbol) return [];

      const symbolStyle = esriSymbolToTableStyle(
        symbol,
        simpleRenderer.label,
        this._item.tileRequests
      );
      return [
        createStratumInstance(TableStyleTraits, {
          id: "ESRI",
          hidden: false,
          color: createStratumInstance(TableColorStyleTraits, {
            nullColor: symbolStyle.color ?? "#ffffff"
          }),
          pointSize: symbolStyle.pointSize,
          point: createStratumInstance(TablePointStyleTraits, {
            null: symbolStyle.point
          }),
          outline: createStratumInstance(TableOutlineStyleTraits, {
            null: symbolStyle.outline
          })
        })
      ];
    } else if (rendererType === "uniqueValue") {
      const uniqueValueRenderer = renderer as UniqueValueRenderer;

      const symbolStyles = uniqueValueRenderer.uniqueValueInfos.map((v) => {
        return esriSymbolToTableStyle(
          v.symbol,
          v.label,
          this._item.tileRequests
        );
      });

      const defaultSymbolStyle = esriSymbolToTableStyle(
        uniqueValueRenderer.defaultSymbol,
        undefined,
        this._item.tileRequests
      );

      // Only include color if there are any styles which aren't esriPMS
      const includeColor = !!uniqueValueRenderer.uniqueValueInfos.find(
        (u) => u.symbol?.type !== "esriPMS"
      );

      if (uniqueValueRenderer.field2 || uniqueValueRenderer.field3) {
        console.warn(
          `WARNING: Terria only supports ArcGisFeatureService UniqueValueRenderers with a single field (\`field1\`), not multiple fields (\`field2\` or \`field3\`)`
        );
      }

      if (uniqueValueRenderer.visualVariables?.length) {
        console.warn(
          `WARNING: Terria does not support visual variables in ArcGisFeatureService SimpleRenderers`
        );
      }

      if (uniqueValueRenderer.valueExpression) {
        console.warn(
          `WARNING: Terria does not support value expressions in ArcGisFeatureService UniqueValueRenderers`
        );
      }

      if (!uniqueValueRenderer.field1) {
        console.warn(
          `WARNING: Terria does not support empty field1 in UniqueValueRenderers, using default style`
        );
        return [];
      }

      return [
        createStratumInstance(TableStyleTraits, {
          id: "ESRI",
          hidden: false,
          color: includeColor
            ? createStratumInstance(TableColorStyleTraits, {
                colorColumn: uniqueValueRenderer.field1,
                mapType: "enum",
                enumColors: uniqueValueRenderer.uniqueValueInfos.map((v, i) =>
                  createStratumInstance(EnumColorTraits, {
                    value: v.value,
                    color: symbolStyles[i].color ?? "#ffffff"
                  })
                ),
                nullColor: defaultSymbolStyle.color
              })
            : createStratumInstance(TableColorStyleTraits, {
                nullColor: "#FFFFFF"
              }),
          pointSize: createStratumInstance(TablePointSizeStyleTraits, {}),
          point: createStratumInstance(TablePointStyleTraits, {
            mapType: "enum",
            column: uniqueValueRenderer.field1,
            enum: uniqueValueRenderer.uniqueValueInfos.map((v, i) =>
              createStratumInstance(EnumPointSymbolTraits, {
                value: v.value,
                ...symbolStyles[i].point
              })
            ),
            null: defaultSymbolStyle.point
          }),
          outline: createStratumInstance(TableOutlineStyleTraits, {
            mapType: "enum",
            column: uniqueValueRenderer.field1,
            enum: uniqueValueRenderer.uniqueValueInfos.map((v, i) =>
              createStratumInstance(EnumOutlineSymbolTraits, {
                value: v.value,
                ...symbolStyles[i].outline
              })
            ),

            null: defaultSymbolStyle.outline
          })
        })
      ];
    } else if (rendererType === "classBreaks") {
      const classBreaksRenderer = renderer as ClassBreaksRenderer;

      if (classBreaksRenderer.visualVariables?.length) {
        console.warn(
          `WARNING: Terria does not support visual variables in ArcGisFeatureService SimpleRenderers`
        );
      }

      if (classBreaksRenderer.valueExpression) {
        console.warn(
          `WARNING: Terria does not support value expressions in ArcGisFeatureService UniqueValueRenderers`
        );
      }

      const symbolStyles = classBreaksRenderer.classBreakInfos.map((c) =>
        esriSymbolToTableStyle(c.symbol, c.label, this._item.tileRequests)
      );

      const defaultSymbolStyle = esriSymbolToTableStyle(
        classBreaksRenderer.defaultSymbol,
        undefined,
        this._item.tileRequests
      );

      // Only include color if there are any styles which aren't esriPMS
      const includeColor = !!classBreaksRenderer.classBreakInfos.find(
        (u) => u.symbol?.type !== "esriPMS"
      );

      return [
        createStratumInstance(TableStyleTraits, {
          id: "ESRI",
          hidden: false,
          color: includeColor
            ? createStratumInstance(TableColorStyleTraits, {
                mapType: "bin",
                colorColumn: classBreaksRenderer.field,
                binColors: symbolStyles.map((s) => s.color ?? ""),
                binMaximums: classBreaksRenderer.classBreakInfos.map(
                  (c) => c.classMaxValue
                ),
                nullColor: defaultSymbolStyle.color
              })
            : createStratumInstance(TableColorStyleTraits, {
                nullColor: "#FFFFFF"
              }),
          pointSize: createStratumInstance(TablePointSizeStyleTraits, {}),
          point: createStratumInstance(TablePointStyleTraits, {
            mapType: "bin",
            column: classBreaksRenderer.field,
            bin: classBreaksRenderer.classBreakInfos.map((c, i) =>
              createStratumInstance(BinPointSymbolTraits, {
                maxValue: c.classMaxValue,
                ...symbolStyles[i].point
              })
            ),
            null: defaultSymbolStyle.point
          }),
          outline: createStratumInstance(TableOutlineStyleTraits, {
            mapType: "bin",
            column: classBreaksRenderer.field,
            bin: classBreaksRenderer.classBreakInfos.map((c, i) =>
              createStratumInstance(BinOutlineSymbolTraits, {
                maxValue: c.classMaxValue,
                ...symbolStyles[i].outline
              })
            ),
            null: defaultSymbolStyle.outline
          })
        })
      ];
    } else {
      console.warn(
        `WARNING: Terria does not support ArcGisFeatureService renderers of type ${rendererType}`
      );
    }
  }

  // Map ESRI fields to Terria columns. This just sets the name, title and type of the column
  @computed
  get columns() {
    return (
      this._featureServer?.fields
        ?.filter((field) => {
          if (!fieldTypeToTableColumn[field.type]) {
            console.warn(
              `WARNING: Terria does not support ESRI field type ${field.type}`
            );
            return false;
          }
          return true;
        })
        .map((field) =>
          createStratumInstance(TableColumnTraits, {
            name: field.name,
            title: field.alias,
            type: fieldTypeToTableColumn[field.type]?.toString()
          })
        ) ?? []
    );
  }

  // Override legend hidden when columns are empty
  @computed get hideLegendInWorkbench() {
    return false;
  }

  get featuresPerRequest() {
    return this._featureServer?.maxRecordCount;
  }

  get featuresPerTileRequest() {
    return this._featureServer?.tileMaxRecordCount;
  }

  get maxRecordCountFactor() {
    return this._featureServer?.maxRecordCountFactor;
  }

  get supportsQuantization() {
    return !!this._featureServer?.supportsCoordinatesQuantization;
  }

  /** Enable tileRequests by default if supported */
  get tileRequests() {
    const supportsPbfTiles =
      this._featureServer?.supportsTilesAndBasicQueriesMode &&
      typeof this._featureServer?.supportedQueryFormats === "string" &&
      (this._featureServer.supportedQueryFormats as string)
        .toLowerCase()
        .includes("pbf");

    if (supportsPbfTiles) {
      return true;
    }

    return undefined;
  }

  get objectIdField() {
    return this._featureServer?.objectIdField;
  }

  // Add properties/columns to outFields if they are needed for styling. Otherwise, these properties won't be in tile features
  get outFields() {
    return Array.from(
      new Set([
        this._item.objectIdField,
        this._item.activeTableStyle.tableColorMap.colorTraits.colorColumn,
        this._item.activeTableStyle.outlineStyleMap.traits?.column,
        this._item.activeTableStyle.pointStyleMap.traits?.column
      ])
    ).filter((t): t is string => !!t);
  }
}

StratumOrder.addLoadStratum(FeatureServerStratum.stratumName);

export default class ArcGisFeatureServerCatalogItem extends MinMaxLevelMixin(
  GeoJsonMixin(CreateModel(ArcGisFeatureServerCatalogItemTraits))
) {
  static readonly type = "esri-featureServer";

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get type(): string {
    return ArcGisFeatureServerCatalogItem.type;
  }

  get typeName(): string {
    return i18next.t("models.arcGisFeatureServerCatalogItem.name");
  }

  protected async forceLoadMetadata(): Promise<void> {
    if (this.strata.get(FeatureServerStratum.stratumName) === undefined) {
      const stratum = await FeatureServerStratum.load(this);
      runInAction(() => {
        this.strata.set(FeatureServerStratum.stratumName, stratum);
      });
    }
  }

  protected async forceLoadGeojsonData(): Promise<
    FeatureCollectionWithCrs<Geometry | GeometryCollection, Properties>
  > {
    // If we are tiling requests, then we use the ProtomapsImageryProvider - see mapItems
    if (this.tileRequests) return featureCollection([]);

    const getEsriLayerJson = async (resultOffset?: number) => {
      const url = proxyCatalogItemUrl(
        this,
        this.buildEsriJsonUrl(resultOffset).toString()
      );
      return await loadJson(url);
    };

    if (!this.supportsPagination) {
      // Make a single request without pagination
      return (
        featureDataToGeoJson(await getEsriLayerJson()) ?? {
          type: "FeatureCollection",
          features: []
        }
      );
    }

    // Esri Feature Servers have a maximum limit to how many features they'll return at once, so for a service with many
    // features, we have to make multiple requests. We can't figure out how many features we need to request ahead of
    // time (there's an API for it but it times out for services with thousands of features), so we just keep trying
    // until we run out of features or hit the limit
    const featuresPerRequest = this.featuresPerRequest;
    const maxFeatures = this.maxFeatures;
    const combinedEsriLayerJson = await getEsriLayerJson(0);

    const mapObjectIds = (features: any) =>
      features.map(
        (feature: any) =>
          feature.attributes.OBJECTID ?? feature.attributes.objectid
      );
    const seenIDs: Set<string> = new Set(
      mapObjectIds(combinedEsriLayerJson.features)
    );

    let currentOffset = 0;
    let exceededTransferLimit = combinedEsriLayerJson.exceededTransferLimit;
    while (
      combinedEsriLayerJson.features.length <= maxFeatures &&
      exceededTransferLimit === true
    ) {
      currentOffset += featuresPerRequest;
      const newEsriLayerJson = await getEsriLayerJson(currentOffset);
      if (
        newEsriLayerJson.features === undefined ||
        newEsriLayerJson.features.length === 0
      ) {
        break;
      }

      const newIds: string[] = mapObjectIds(newEsriLayerJson.features);

      if (newIds.every((id: string) => seenIDs.has(id))) {
        // We're getting data that we've received already, assume have everything we need and stop fetching
        break;
      }

      newIds.forEach((id) => seenIDs.add(id));
      combinedEsriLayerJson.features = combinedEsriLayerJson.features.concat(
        newEsriLayerJson.features
      );
      exceededTransferLimit = newEsriLayerJson.exceededTransferLimit;
    }

    return (
      featureDataToGeoJson(combinedEsriLayerJson) ?? {
        type: "FeatureCollection",
        features: []
      }
    );
  }

  @computed get imageryProvider() {
    const { paintRules, labelRules } = tableStyleToProtomaps(this, false, true);

    let provider = new ProtomapsImageryProvider({
      maximumZoom: this.getMaximumLevel(false),
      minimumZoom: this.getMinimumLevel(false),
      terria: this.terria,
      data: new ProtomapsArcGisPbfSource({
        url: this.buildEsriJsonUrl().toString(),
        outFields: [...this.outFields],
        featuresPerTileRequest: this.featuresPerTileRequest,
        maxRecordCountFactor: this.maxRecordCountFactor,
        maxTiledFeatures: this.maxTiledFeatures,
        tilingScheme: new WebMercatorTilingScheme(),
        enablePickFeatures: this.allowFeaturePicking,
        objectIdField: this.objectIdField,
        supportsQuantization: this.supportsQuantization
      }),
      id: this.uniqueId,
      paintRules,
      labelRules
    });

    provider = this.wrapImageryPickFeatures(provider);
    provider = this.updateRequestImage(provider);

    return provider;
  }

  @override
  get mapItems() {
    // If we aren't tiling requests, then we use GeoJsonMixin forceLoadGeojsonData
    if (!this.tileRequests) return super.mapItems;

    return [
      {
        imageryProvider: this.imageryProvider,
        show: this.show,
        alpha: this.opacity,
        clippingRectangle: undefined
      }
    ];
  }

  @override
  get dataColumnMajor() {
    if (super.dataColumnMajor.length > 0) {
      return super.dataColumnMajor;
    }
    // If we are tiling requests, then we don't have geojson/tabular data
    // We have to populate columns with empty strings, otherwise TableMixin.tableColumns will be empty.
    return this.columns.map((column) => [column.name ?? ""]);
  }

  @computed get featureServerData(): FeatureServer | undefined {
    const stratum = this.strata.get(
      FeatureServerStratum.stratumName
    ) as FeatureServerStratum;
    return isDefined(stratum) ? stratum.featureServerData : undefined;
  }

  /**
   * Constructs the url for a request to a feature server
   * @param resultOffset Allows for pagination of results.
   *  See https://developers.arcgis.com/rest/services-reference/enterprise/query-feature-service-layer-.htm
   */
  buildEsriJsonUrl(resultOffset?: number) {
    const url = cleanUrl(this.url || "0d");
    const urlComponents = splitLayerIdFromPath(url);
    const layerId = urlComponents.layerId;

    if (!isDefined(layerId)) {
      throw networkRequestError({
        title: i18next.t(
          "models.arcGisFeatureServerCatalogItem.invalidServiceTitle"
        ),
        message: i18next.t(
          "models.arcGisFeatureServerCatalogItem.invalidServiceMessage"
        )
      });
    }

    // We used to make a call to a different ArcGIS API endpoint
    // (https://developers.arcgis.com/rest/services-reference/enterprise/query-feature-service-.htm) which took a
    // `layerdef` parameter, which is more or less equivalent to `where`. To avoid breaking old catalog items, we need
    // to use `layerDef` if `where` hasn't been set
    const where = this.where === "1=1" ? this.layerDef : this.where;

    const uri = new URI(url)
      .segment("query")
      .addQuery("f", "json")
      .addQuery("where", where)
      .addQuery("outFields", "*")
      .addQuery("outSR", "4326");

    if (resultOffset !== undefined) {
      // Pagination specific parameters
      uri
        .addQuery("resultRecordCount", this.featuresPerRequest)
        .addQuery("resultOffset", resultOffset);
    }

    return uri;
  }
}

export function convertEsriColorToCesiumColor(
  esriColor?: null | number[] | undefined
): Color | undefined {
  if (!esriColor) return;
  return Color.fromBytes(
    esriColor[0],
    esriColor[1],
    esriColor[2],
    esriColor[3]
  );
}

// ESRI uses points for styling while cesium uses pixels
export function convertEsriPointSizeToPixels(pointSize?: number) {
  if (!isDefined(pointSize)) return undefined;
  // 1 px = 0.75 point
  // 1 point = 4/3 point
  return (pointSize * 4) / 3;
}

function buildMetadataUrl(catalogItem: ArcGisFeatureServerCatalogItem) {
  return proxyCatalogItemUrl(
    catalogItem,
    new URI(catalogItem.url).addQuery("f", "json").toString()
  );
}

function splitLayerIdFromPath(url: string) {
  const regex = /^(.*FeatureServer)\/(\d+)/;
  const matches = url.match(regex);
  if (isDefined(matches) && matches !== null && matches.length > 2) {
    return {
      layerId: matches[2],
      urlWithoutLayerId: matches[1]
    };
  }
  return {
    urlWithoutLayerId: url
  };
}

function cleanUrl(url: string): string {
  // Strip off the search portion of the URL
  const uri = new URI(url);
  uri.search("");
  return uri.toString();
}

function esriSymbolToTableStyle(
  symbol?: ISymbol | null,
  label?: string | undefined,
  tiled?: boolean
) {
  if (!symbol) return {};

  let marker =
    symbol.type === "esriPMS"
      ? `data:${symbol.contentType};base64,${symbol.imageData}`
      : convertEsriMarkerToMaki(symbol.style);

  if (tiled && marker !== "circle" && marker !== "point") {
    marker = "point";
    console.warn(
      `Custom makers are not supported in tiled requests, using default marker`
    );
  }

  return {
    // For esriPMS - just use white color
    // This is so marker icons aren't colored by default
    color:
      symbol.type === "esriPMS"
        ? "#FFFFFF"
        : convertEsriColorToCesiumColor(symbol.color)?.toCssColorString(),
    pointSize: createStratumInstance(TablePointSizeStyleTraits, {}),
    point: createStratumInstance(PointSymbolTraits, {
      marker:
        symbol.type === "esriPMS"
          ? `data:${symbol.contentType};base64,${symbol.imageData}`
          : convertEsriMarkerToMaki(symbol.style),
      // symbol.size is used by "esriSMS"
      // height and width is used by "esriPMS"
      height:
        convertEsriPointSizeToPixels(symbol.size) ??
        convertEsriPointSizeToPixels(symbol.height),
      width:
        convertEsriPointSizeToPixels(symbol.size) ??
        convertEsriPointSizeToPixels(symbol.width),
      rotation: symbol.angle,
      pixelOffset: [symbol.xoffset ?? 0, symbol.yoffset ?? 0],
      legendTitle: label || undefined
    }),
    outline:
      symbol.outline?.style !== "esriSLSNull"
        ? createStratumInstance(OutlineSymbolTraits, {
            color:
              symbol.type === "esriSLS"
                ? convertEsriColorToCesiumColor(
                    symbol.color
                  )?.toCssColorString()
                : convertEsriColorToCesiumColor(
                    symbol.outline?.color
                  )?.toCssColorString(),
            // Use width if Line style
            width:
              symbol.type === "esriSLS"
                ? convertEsriPointSizeToPixels(symbol.width)
                : convertEsriPointSizeToPixels(symbol.outline?.width),
            legendTitle: label || undefined,
            dash:
              symbol.type === "esriSLS"
                ? convertEsriLineStyleToDashArray(symbol.style)
                : convertEsriLineStyleToDashArray(symbol.outline?.style)
          })
        : undefined
  };
}

function convertEsriMarkerToMaki(
  esri: SupportedSimpleMarkerStyle | string | undefined
): string {
  switch (esri) {
    case "esriSMSCross":
      return "hospital";
    case "esriSMSDiamond":
      return "diamond";
    case "esriSMSSquare":
      return "square";
    case "esriSMSTriangle":
      return "triangle";
    case "esriSMSX":
      return "cross";
    case "esriSMSCircle":
    default:
      return "point";
  }
}

// Adapted from https://github.com/EventKit/eventkit-cloud/blob/5b57506073f36e883e1b8c01d823b1bb40dc2f99/eventkit_cloud/utils/arcgis/arcgis_layer.py#L34C8-L62
// Copyright (c) 2015, Humanitarian OpenStreetMap Team All rights reserved.
// Licensed under BSD 3-Clause License
// Full license https://github.com/EventKit/eventkit-cloud/blob/master/LICENSE.md
function convertEsriLineStyleToDashArray(
  style: string | SupportedLineStyle | undefined
) {
  switch (style) {
    case "esriSLSDash":
      return [6, 6];
    case "esriSLSDashDot":
      return [6, 3, 1, 3];
    case "esriSLSDashDotDot":
      return [6, 3, 1, 3, 1, 3];
    case "esriSLSDot":
      return [2, 4];
    case "esriSLSLongDash":
      return [8, 4];
    case "esriSLSLongDashDot":
      return [8, 3, 1, 3];
    case "esriSLSShortDash":
      return [4, 4];
    case "esriSLSShortDashDot":
      return [4, 2, 1, 2];
    case "esriSLSShortDashDotDot":
      return [4, 2, 1, 2, 1, 2];
    case "esriSLSShortDot":
      return [1, 2];
    case "esriSLSSolid":
      return [];
    default:
      return [];
  }
}
