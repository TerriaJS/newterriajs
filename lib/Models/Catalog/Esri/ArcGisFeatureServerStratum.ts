import i18next from "i18next";
import { computed, makeObservable } from "mobx";
import proj4 from "proj4";
import URI from "urijs";
import isDefined from "../../../Core/isDefined";
import loadJson from "../../../Core/loadJson";
import replaceUnderscores from "../../../Core/replaceUnderscores";
import Proj4Definitions from "../../../Map/Vector/Proj4Definitions";
import { hasUnsupportedStylesForProtomaps } from "../../../Map/Vector/Protomaps/tableStyleToProtomaps";
import ArcGisFeatureServerCatalogItemTraits from "../../../Traits/TraitsClasses/ArcGisFeatureServerCatalogItemTraits";
import { InfoSectionTraits } from "../../../Traits/TraitsClasses/CatalogMemberTraits";
import { RectangleTraits } from "../../../Traits/TraitsClasses/MappableTraits";
import TableColorStyleTraits, {
  EnumColorTraits
} from "../../../Traits/TraitsClasses/Table/ColorStyleTraits";
import TableColumnTraits from "../../../Traits/TraitsClasses/Table/ColumnTraits";
import TableOutlineStyleTraits, {
  BinOutlineSymbolTraits,
  EnumOutlineSymbolTraits
} from "../../../Traits/TraitsClasses/Table/OutlineStyleTraits";
import TablePointSizeStyleTraits from "../../../Traits/TraitsClasses/Table/PointSizeStyleTraits";
import TablePointStyleTraits, {
  BinPointSymbolTraits,
  EnumPointSymbolTraits
} from "../../../Traits/TraitsClasses/Table/PointStyleTraits";
import TableStyleTraits from "../../../Traits/TraitsClasses/Table/StyleTraits";
import createStratumInstance from "../../Definition/createStratumInstance";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel } from "../../Definition/Model";
import StratumFromTraits from "../../Definition/StratumFromTraits";
import StratumOrder from "../../Definition/StratumOrder";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import ArcGisFeatureServerCatalogItem from "./ArcGisFeatureServerCatalogItem";
import { esriStyleToTableStyle } from "./esriStyleToTableStyle";

type EsriStyleTypes =
  | "esriPMS" // simple picture style
  | "esriSMS" // simple marker style
  | "esriSLS" // simple line style
  | "esriSFS"; // simple fill style

/** as defined https://developers.arcgis.com/web-map-specification/objects/esriSFS_symbol/ */
export type SupportedFillStyle =
  | "esriSFSSolid" // fill line with color
  | "esriSFSNull"; // no fill

/** as defined https://developers.arcgis.com/web-map-specification/objects/esriSMS_symbol/ */
export type SupportedEsriSimpleMarkerStyle =
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
export interface EsriStyle {
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
  style?:
    | SupportedEsriSimpleMarkerStyle
    | SupportedLineStyle
    | SupportedFillStyle;
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
  defaultSymbol: EsriStyle | null;

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
  defaultSymbol: EsriStyle | null;

  /** Note, value expressions are not supported */
  valueExpression?: string;
  valueExpressionTitle?: string;

  /** Note, visual variables are not supported. See https://developers.arcgis.com/web-map-specification/objects/visualVariable/ */
  visualVariables?: unknown[];
}

// https://developers.arcgis.com/web-map-specification/objects/simpleRenderer/
interface SimpleRenderer extends Renderer {
  label?: string;
  symbol: EsriStyle | null;

  /** Note, visual variables are not supported. See https://developers.arcgis.com/web-map-specification/objects/visualVariable/ */
  visualVariables?: unknown[];
}

/** For JSON Schema for FeatureServer Layer response see https://developers.arcgis.com/rest/services-reference/enterprise/layer-feature-service/#json-response-syntax */
interface FeatureServer {
  documentInfo?: {
    Author?: string;
  };
  name?: string;
  description?: string;
  copyrightText?: string;
  drawingInfo?: {
    renderer: Renderer;
  };
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

export class ArcGisFeatureServerStratum extends LoadableStratum(
  ArcGisFeatureServerCatalogItemTraits
) {
  static stratumName = "featureServer";

  constructor(
    private readonly _item: ArcGisFeatureServerCatalogItem,
    private readonly _featureServer?: FeatureServer
  ) {
    super();
    makeObservable(this);
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new ArcGisFeatureServerStratum(
      newModel as ArcGisFeatureServerCatalogItem,
      this._featureServer
    ) as this;
  }

  static async load(
    item: ArcGisFeatureServerCatalogItem
  ): Promise<ArcGisFeatureServerStratum> {
    if (item.url === undefined) {
      return new ArcGisFeatureServerStratum(item, undefined);
    }
    const metaUrl = buildMetadataUrl(item);
    const featureServer = await loadJson(metaUrl);
    return new ArcGisFeatureServerStratum(item, featureServer);
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

      const symbolStyle = esriStyleToTableStyle(symbol, simpleRenderer.label);
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
        return esriStyleToTableStyle(v.symbol, v.label);
      });

      const defaultSymbolStyle = esriStyleToTableStyle(
        uniqueValueRenderer.defaultSymbol,
        undefined
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
          `WARNING: Terria does not support visual variables in ArcGisFeatureService UniqueValueRenderers`
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
          `WARNING: Terria does not support visual variables in ArcGisFeatureService ClassBreakRenderers`
        );
      }

      if (classBreaksRenderer.valueExpression) {
        console.warn(
          `WARNING: Terria does not support value expressions in ArcGisFeatureService ClassBreakRenderers`
        );
      }

      const symbolStyles = classBreaksRenderer.classBreakInfos.map((c) =>
        esriStyleToTableStyle(c.symbol, c.label)
      );

      const defaultSymbolStyle = esriStyleToTableStyle(
        classBreaksRenderer.defaultSymbol,
        undefined
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

  /** Enable tileRequests by default if supported and no unsupported point/label styles are used */
  get tileRequests() {
    if (this._item.forceCesiumPrimitives) return false;

    const supportsPbfTiles =
      this._featureServer?.supportsTilesAndBasicQueriesMode &&
      typeof this._featureServer?.supportedQueryFormats === "string" &&
      (this._featureServer.supportedQueryFormats as string)
        .toLowerCase()
        .includes("pbf");

    if (supportsPbfTiles) {
      return !hasUnsupportedStylesForProtomaps(this._item);
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

function buildMetadataUrl(catalogItem: ArcGisFeatureServerCatalogItem) {
  return proxyCatalogItemUrl(
    catalogItem,
    new URI(catalogItem.url).addQuery("f", "json").toString()
  );
}

StratumOrder.addLoadStratum(ArcGisFeatureServerStratum.stratumName);
