import { computed, observable, runInAction } from "mobx";
import { createTransformer } from "mobx-utils";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Color from "terriajs-cesium/Source/Core/Color";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import PointGraphics from "terriajs-cesium/Source/DataSources/PointGraphics";
import Constructor from "../Core/Constructor";
import filterOutUndefined from "../Core/filterOutUndefined";
import makeRealPromise from "../Core/makeRealPromise";
import MapboxVectorTileImageryProvider from "../Map/MapboxVectorTileImageryProvider";
import RegionProviderList from "../Map/RegionProviderList";
import { ImageryParts } from "../Models/Mappable";
import Model from "../Models/Model";
import SelectableStyle, { AvailableStyle } from "../Models/SelectableStyle";
import TableColumn from "../Table/TableColumn";
import TableColumnType from "../Table/TableColumnType";
import TableStyle from "../Table/TableStyle";
import TableTraits from "../Traits/TableTraits";
import ModelPropertiesFromTraits from "../Models/ModelPropertiesFromTraits";
import LegendTraits from "../Traits/LegendTraits";

export default function TableMixin<T extends Constructor<Model<TableTraits>>>(
  Base: T
) {
  abstract class TableMixin extends Base {
    /**
     * The raw data table in column-major format, i.e. the outer array is an
     * array of columns.
     */
    @observable
    dataColumnMajor: string[][] | undefined;

    /**
     * The list of region providers to be used with this table.
     */
    @observable
    regionProviderList: RegionProviderList | undefined;

    /**
     * Gets a {@link TableColumn} for each of the columns in the raw data.
     */
    @computed
    get tableColumns(): readonly TableColumn[] {
      if (this.dataColumnMajor === undefined) {
        return [];
      }

      return this.dataColumnMajor.map((_, i) => this.getTableColumn(i));
    }

    /**
     * Gets a {@link TableStyle} for each of the {@link styles}. If there
     * are no styles, returns an empty array.
     */
    @computed
    get tableStyles(): TableStyle[] {
      if (this.styles === undefined) {
        return [];
      }
      return this.styles.map((_, i) => this.getTableStyle(i));
    }

    /**
     * Gets the default {@link TableStyle}, which is used for styling
     * only when there are no styles defined.
     */
    @computed
    get defaultTableStyle(): TableStyle {
      return new TableStyle(this, -1);
    }

    /**
     * Gets the {@link TableStyleTraits#id} of the currently-active style.
     * Note that this is a trait so there is no guarantee that a style
     * with this ID actually exists. If no active style is explicitly
     * specified, the ID of the first of the {@link #styles} is used.
     */
    @computed
    get activeStyle(): string | undefined {
      const value = super.activeStyle;
      if (value !== undefined) {
        return value;
      } else if (this.styles && this.styles.length > 0) {
        return this.styles[0].id;
      }
      return undefined;
    }

    /**
     * Gets the active {@link TableStyle}, which is the item from {@link #tableStyles}
     * with an ID that matches {@link #activeStyle}, if any.
     */
    @computed
    get activeTableStyle(): TableStyle {
      const activeStyle = this.activeStyle;
      if (activeStyle === undefined) {
        return this.defaultTableStyle;
      }
      let ret = this.tableStyles.find(style => style.id === this.activeStyle);
      if (ret === undefined) {
        return this.defaultTableStyle;
      }

      return ret;
    }

    /**
     * Gets the items to show on the map.
     */
    @computed
    get mapItems(): (DataSource | ImageryParts)[] {
      const result: (DataSource | ImageryParts)[] = [];

      return filterOutUndefined([
        this.createLongitudeLatitudeDataSource(this.activeTableStyle),
        this.createRegionMappedImageryLayer(this.activeTableStyle)
      ]);
    }

    @computed
    get styleSelector(): SelectableStyle {
      const tableModel = this;
      return {
        get id(): string {
          return "style";
        },
        get name(): string {
          return "";
        },
        get availableStyles(): readonly AvailableStyle[] {
          return tableModel.tableStyles.map(style => {
            return {
              id: style.id,
              name: style.styleTraits.title || style.id
            };
          });
        },
        get activeStyleId(): string | undefined {
          return tableModel.activeStyle;
        },
        chooseActiveStyle(stratumId: string, styleId: string) {
          tableModel.setTrait(stratumId, "activeStyle", styleId);
        }
      };
    }

    get legends(): readonly ModelPropertiesFromTraits<LegendTraits>[] {
      const colorLegend = this.activeTableStyle.colorTraits.legend;
      return filterOutUndefined([colorLegend]);
    }

    findFirstColumnByType(type: TableColumnType): TableColumn | undefined {
      return this.tableColumns.find(column => column.type === type);
    }

    findColumnByName(name: string): TableColumn | undefined {
      return this.tableColumns.find(column => column.name === name);
    }

    protected loadTableMixin(): Promise<void> {
      // TODO: pass proxy to fromUrl
      return makeRealPromise(
        RegionProviderList.fromUrl(
          this.terria.configParameters.regionMappingDefinitionsUrl,
          undefined
        )
      ).then(regionProviderList => {
        runInAction(() => {
          this.regionProviderList = regionProviderList;
        });
      });
    }

    private readonly createLongitudeLatitudeDataSource = createTransformer(
      (style: TableStyle): DataSource | undefined => {
        if (!style.isPoints()) {
          return undefined;
        }

        const longitudes = style.longitudeColumn.valuesAsNumbers.values;
        const latitudes = style.latitudeColumn.valuesAsNumbers.values;

        const colorColumn = style.colorColumn;
        const valueFunction =
          colorColumn !== undefined
            ? colorColumn.valueFunctionForType
            : () => null;

        const colorMap = (this.activeTableStyle || this.defaultTableStyle)
          .colorMap;

        const outlineColor = Color.fromCssColorString(
          "white" //this.terria.baseMapContrastColor;
        );

        const dataSource = new CustomDataSource(this.name || "Table");
        dataSource.entities.suspendEvents();

        for (let i = 0; i < longitudes.length && i < latitudes.length; ++i) {
          const longitude = longitudes[i];
          const latitude = latitudes[i];
          const value = valueFunction(i);
          if (longitude === null || latitude === null) {
            continue;
          }

          dataSource.entities.add(
            new Entity({
              position: Cartesian3.fromDegrees(longitude, latitude, 0.0),
              point: new PointGraphics({
                color: colorMap.mapValueToColor(value),
                pixelSize: 5,
                outlineWidth: 1,
                outlineColor: outlineColor
              })
            })
          );
        }

        dataSource.entities.resumeEvents();

        return dataSource;
      }
    );

    private readonly createRegionMappedImageryLayer = createTransformer(
      (style: TableStyle): ImageryParts | undefined => {
        if (!style.isRegions()) {
          return undefined;
        }

        const regionColumn = style.regionColumn;
        const regionType: any = regionColumn.regionType;
        if (regionType === undefined) {
          return undefined;
        }

        const baseMapContrastColor = "white"; //this.terria.baseMapContrastColor;

        const colorColumn = style.colorColumn;
        const valueFunction =
          colorColumn !== undefined
            ? colorColumn.valueFunctionForType
            : () => null;
        const colorMap = (this.activeTableStyle || this.defaultTableStyle)
          .colorMap;
        const valuesAsRegions = regionColumn.valuesAsRegions;

        return {
          alpha: this.opacity,
          imageryProvider: <any>new MapboxVectorTileImageryProvider({
            url: regionType.server,
            layerName: regionType.layerName,
            styleFunc: function(feature: any) {
              const featureRegion = feature.properties[regionType.regionProp];
              const regionIdString =
                featureRegion !== undefined && featureRegion !== null
                  ? featureRegion.toString()
                  : "";
              const rowNumbers = valuesAsRegions.regionIdToRowNumbersMap.get(
                regionIdString
              );
              let value: string | number | null;

              if (rowNumbers === undefined) {
                value = null;
              } else if (typeof rowNumbers === "number") {
                value = valueFunction(rowNumbers);
              } else {
                // TODO: multiple rows have data for this region
                value = valueFunction(rowNumbers[0]);
              }

              const color = colorMap.mapValueToColor(value);
              if (color === undefined) {
                return undefined;
              }

              return {
                fillStyle: color.toCssColorString(),
                strokeStyle: baseMapContrastColor,
                lineWidth: 1,
                lineJoin: "miter"
              };
            },
            subdomains: regionType.serverSubdomains,
            rectangle: Rectangle.fromDegrees(
              regionType.bbox[0],
              regionType.bbox[1],
              regionType.bbox[2],
              regionType.bbox[3]
            ),
            minimumZoom: regionType.serverMinZoom,
            maximumNativeZoom: regionType.serverMaxNativeZoom,
            maximumZoom: regionType.serverMaxZoom,
            uniqueIdProp: regionType.uniqueIdProp
            // featureInfoFunc: addDescriptionAndProperties(
            //   regionMapping,
            //   regionIndices,
            //   regionImageryProvider
            // )
          }),
          show: this.show
        };
      }
    );

    private readonly getTableColumn = createTransformer((index: number) => {
      return new TableColumn(this, index);
    });

    private readonly getTableStyle = createTransformer((index: number) => {
      return new TableStyle(this, index);
    });
  }

  return TableMixin;
}
