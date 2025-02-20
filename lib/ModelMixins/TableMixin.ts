import i18next from "i18next";
import {
  action,
  computed,
  makeObservable,
  observable,
  override,
  runInAction
} from "mobx";
import { ITransformer, createTransformer } from "mobx-utils";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import { ChartPoint } from "../Charts/ChartData";
import getChartColorForId from "../Charts/getChartColorForId";
import AbstractConstructor from "../Core/AbstractConstructor";
import { JsonObject } from "../Core/Json";
import { isLatLonHeight } from "../Core/LatLonHeight";
import TerriaError from "../Core/TerriaError";
import filterOutUndefined from "../Core/filterOutUndefined";
import flatten from "../Core/flatten";
import isDefined from "../Core/isDefined";
import ConstantColorMap from "../Map/ColorMap/ConstantColorMap";
import RegionProvider from "../Map/Region/RegionProvider";
import RegionProviderList from "../Map/Region/RegionProviderList";
import CommonStrata from "../Models/Definition/CommonStrata";
import Model from "../Models/Definition/Model";
import updateModelFromJson from "../Models/Definition/updateModelFromJson";
import TerriaFeature from "../Models/Feature/Feature";
import FeatureInfoContext from "../Models/Feature/FeatureInfoContext";
import SelectableDimensions, {
  SelectableDimension,
  SelectableDimensionEnum,
  SelectableDimensionGroup
} from "../Models/SelectableDimensions/SelectableDimensions";
import ViewingControls, { ViewingControl } from "../Models/ViewingControls";
import * as SelectableDimensionWorkflow from "../Models/Workflows/SelectableDimensionWorkflow";
import TableStylingWorkflow from "../Models/Workflows/TableStylingWorkflow";
import Icon from "../Styled/Icon";
import TableColumn from "../Table/TableColumn";
import TableColumnType from "../Table/TableColumnType";
import TableFeatureInfoStratum from "../Table/TableFeatureInfoStratum";
import { TableAutomaticLegendStratum } from "../Table/TableLegendStratum";
import TableStyle from "../Table/TableStyle";
import createLongitudeLatitudeFeaturePerId from "../Table/createLongitudeLatitudeFeaturePerId";
import createLongitudeLatitudeFeaturePerRow from "../Table/createLongitudeLatitudeFeaturePerRow";
import createRegionMappedImageryProvider from "../Table/createRegionMappedImageryProvider";
import { tableFeatureInfoContext } from "../Table/tableFeatureInfoContext";
import TableTraits from "../Traits/TraitsClasses/Table/TableTraits";
import CatalogMemberMixin from "./CatalogMemberMixin";
import { ChartAxis, ChartItem, calculateDomain } from "./ChartableMixin";
import DiscretelyTimeVaryingMixin from "./DiscretelyTimeVaryingMixin";
import ExportableMixin, { ExportData } from "./ExportableMixin";
import MappableMixin, { ImageryParts } from "./MappableMixin";

type BaseType = Model<TableTraits>;

function TableMixin<T extends AbstractConstructor<BaseType>>(Base: T) {
  abstract class TableMixin
    extends ExportableMixin(
      DiscretelyTimeVaryingMixin(MappableMixin(CatalogMemberMixin(Base)))
    )
    implements SelectableDimensions, ViewingControls, FeatureInfoContext
  {
    /**
     * The default {@link TableStyle}, which is used for styling
     * only when there are no styles defined.
     */
    readonly defaultTableStyle: TableStyle;

    constructor(...args: any[]) {
      super(...args);

      makeObservable(this);

      // Create default TableStyle and set TableAutomaticLegendStratum
      this.defaultTableStyle = new TableStyle(this);

      if (
        this.strata.get(TableAutomaticLegendStratum.stratumName) === undefined
      ) {
        runInAction(() => {
          this.strata.set(
            TableAutomaticLegendStratum.stratumName,
            TableAutomaticLegendStratum.load(this)
          );
        });
      }

      // Create TableFeatureInfoStratum
      if (this.strata.get(TableFeatureInfoStratum.stratumName) === undefined) {
        runInAction(() => {
          this.strata.set(
            TableFeatureInfoStratum.stratumName,
            TableFeatureInfoStratum.load(this)
          );
        });
      }
    }

    get hasTableMixin() {
      return true;
    }

    // Always use the getter and setter for this
    @observable
    protected _dataColumnMajor: string[][] | undefined;

    /**
     * The list of region providers to be used with this table.
     */
    @observable
    regionProviderLists: RegionProviderList[] | undefined;

    /**
     * The raw data table in column-major format, i.e. the outer array is an
     * array of columns.
     */
    @computed
    get dataColumnMajor(): string[][] | undefined {
      const dataColumnMajor = this._dataColumnMajor;
      if (
        this.removeDuplicateRows &&
        dataColumnMajor !== undefined &&
        dataColumnMajor.length >= 1
      ) {
        // De-duplication is slow and memory expensive, so should be avoided if possible.
        const rowsToRemove = new Set();
        const seenRows = new Set();
        for (let i = 0; i < dataColumnMajor[0].length; i++) {
          const row = dataColumnMajor.map((col) => col[i]).join();
          if (seenRows.has(row)) {
            // Mark row for deletion
            rowsToRemove.add(i);
          } else {
            seenRows.add(row);
          }
        }

        if (rowsToRemove.size > 0) {
          return dataColumnMajor.map((col) =>
            col.filter((_cell, idx) => !rowsToRemove.has(idx))
          );
        }
      }
      return dataColumnMajor;
    }

    set dataColumnMajor(newDataColumnMajor: string[][] | undefined) {
      this._dataColumnMajor = newDataColumnMajor;
    }

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
     * Gets the active {@link TableStyle}, which is the item from {@link #tableStyles}
     * with an ID that matches {@link #activeStyle}, if any.
     */
    @computed
    get activeTableStyle(): TableStyle {
      const activeStyle = this.activeStyle;
      if (activeStyle === undefined) {
        return this.defaultTableStyle;
      }
      const ret = this.tableStyles.find(
        (style) => style.id === this.activeStyle
      );
      if (ret === undefined) {
        return this.defaultTableStyle;
      }

      return ret;
    }

    @computed
    get xColumn(): TableColumn | undefined {
      return this.activeTableStyle.xAxisColumn;
    }

    @computed
    get yColumns(): TableColumn[] {
      const lines = this.activeTableStyle.chartTraits.lines;
      return filterOutUndefined(
        lines.map((line) => this.findColumnByName(line.yAxisColumn))
      );
    }

    @computed
    get _canExportData() {
      return isDefined(this.dataColumnMajor);
    }

    protected _exportData(): Promise<ExportData | undefined> {
      if (isDefined(this.dataColumnMajor)) {
        // I am assuming all columns have the same length -> so use first column
        const csvString = this.dataColumnMajor[0]
          .map((_row, rowIndex) =>
            this.dataColumnMajor!.map((col) => col[rowIndex]).join(",")
          )
          .join("\n");

        // Make sure we have .csv file extension
        let name = this.name || this.uniqueId || "data.csv";
        if (!/(\.csv\b)/i.test(name)) {
          name = `${name}.csv`;
        }

        return Promise.resolve({
          name: name,
          file: new Blob([csvString])
        });
      }

      throw new TerriaError({
        sender: this,
        message: "No data available to download."
      });
    }

    @override
    get name() {
      return super.name;
    }

    @override
    get disableZoomTo() {
      // Disable zoom if only showing imagery parts  (eg region mapping) and no rectangle is defined
      if (
        !this.mapItems.find(
          (m) => m instanceof DataSource || m instanceof CustomDataSource
        ) &&
        !isDefined(this.cesiumRectangle)
      ) {
        return true;
      }
      return super.disableZoomTo;
    }

    /** Is showing regions (instead of points) */
    @computed get showingRegions() {
      return (
        this.regionMappedImageryParts &&
        this.mapItems[0] === this.regionMappedImageryParts
      );
    }

    /**
     * Gets the items to show on the map.
     */
    @computed
    get mapItems(): (DataSource | ImageryParts)[] {
      // Wait for activeTableStyle to be ready
      if (
        this.dataColumnMajor?.length === 0 ||
        !this.activeTableStyle.ready ||
        this.isLoadingMapItems
      )
        return [];

      const numRegions =
        this.activeTableStyle.regionColumn?.valuesAsRegions?.uniqueRegionIds
          ?.length ?? 0;

      // Estimate number of points based off number of rowGroups
      const numPoints = this.activeTableStyle.isPoints()
        ? this.activeTableStyle.rowGroups.length
        : 0;

      // If we have more points than regions OR we have points are are using a ConstantColorMap - show points instead of regions
      // (Using ConstantColorMap with regions will result in all regions being the same color - which isn't useful)
      if (
        (numPoints > 0 &&
          this.activeTableStyle.colorMap instanceof ConstantColorMap) ||
        numPoints > numRegions
      ) {
        const pointsDataSource = this.createLongitudeLatitudeDataSource(
          this.activeTableStyle
        );

        // Make sure there are actually more points than regions
        if (
          pointsDataSource &&
          pointsDataSource.entities.values.length > numRegions
        )
          return [pointsDataSource];
      }

      if (this.regionMappedImageryParts) return [this.regionMappedImageryParts];

      return [];
    }

    // regionMappedImageryParts and regionMappedImageryProvider are split up like this so that we aren't re-creating the imageryProvider if things like `opacity` and `show` change
    @computed get regionMappedImageryParts() {
      if (!this.regionMappedImageryProvider) return;

      return {
        imageryProvider: this.regionMappedImageryProvider,
        alpha: this.opacity,
        show: this.show,
        clippingRectangle: this.cesiumRectangle
      };
    }

    @computed get regionMappedImageryProvider() {
      return this.createRegionMappedImageryProvider({
        style: this.activeTableStyle,
        currentTime: this.currentDiscreteJulianDate
      });
    }

    /**
     * Try to resolve `regionType` to a region provider (this will also match against region provider aliases)
     */
    matchRegionProvider(regionType?: string): RegionProvider | undefined {
      if (!isDefined(regionType)) return;
      const matchingRegionProviders = this.regionProviderLists?.map(
        (regionProviderList) =>
          regionProviderList?.getRegionDetails(
            [regionType],
            undefined,
            undefined
          )
      );

      // Return first regionProviderList with it's first match
      // Note: a regionProviderList may have multiple matches - we could improve which one it selects
      return matchingRegionProviders?.find(
        (match) => match && match.length > 0
      )?.[0].regionProvider;
    }

    /**
     * Gets the items to show on a chart.
     *
     */
    @computed
    private get tableChartItems(): ChartItem[] {
      const style = this.activeTableStyle;
      if (style === undefined || !style.isChart()) {
        return [];
      }

      const xColumn = style.xAxisColumn;
      const lines = style.chartTraits.lines;
      if (xColumn === undefined || lines.length === 0) {
        return [];
      }

      const xValues: readonly (Date | number | null)[] =
        xColumn.type === TableColumnType.time
          ? xColumn.valuesAsDates.values
          : xColumn.valuesAsNumbers.values;

      const xAxis: ChartAxis = {
        name: xColumn.title || xColumn.name,
        scale: xColumn.type === TableColumnType.time ? "time" : "linear",
        units: xColumn.units
      };

      return filterOutUndefined(
        lines.map((line) => {
          const yColumnId = line.yAxisColumn;
          const yColumn = this.findColumnByName(line.yAxisColumn);
          if (yColumnId === undefined || yColumn === undefined) {
            return undefined;
          }
          const yValues = yColumn.valuesAsNumbers.values;

          const points: ChartPoint[] = [];
          for (let i = 0; i < xValues.length; ++i) {
            const x = xValues[i];
            const y = yValues[i];
            if (x === null || y === null) {
              continue;
            }
            points.push({ x, y });
          }

          if (points.length <= 1) return;

          const colorId = `color-${this.uniqueId}-${this.name}-${yColumn.name}`;

          return {
            id: yColumnId,
            item: this,
            name: line.name ?? yColumn.title,
            categoryName: this.name,
            key: `key${this.uniqueId}-${this.name}-${yColumn.name}`,
            type: this.chartType ?? "line",
            units: yColumn.units,
            glyphStyle: this.chartGlyphStyle ?? "circle",
            xAxis,
            points,
            domain: calculateDomain(points),
            isSelectedInWorkbench: line.isSelectedInWorkbench,
            showInChartPanel: this.show && line.isSelectedInWorkbench,
            updateIsSelectedInWorkbench: (isSelected: boolean) => {
              runInAction(() => {
                line.setTrait(
                  CommonStrata.user,
                  "isSelectedInWorkbench",
                  isSelected
                );
              });
            },
            getColor: () => {
              return line.color || getChartColorForId(colorId);
            },
            pointOnMap: isLatLonHeight(this.chartPointOnMap)
              ? this.chartPointOnMap
              : undefined
          };
        })
      );
    }

    @override
    get chartItems() {
      // Wait for activeTableStyle to be ready
      if (!this.activeTableStyle.ready || this.isLoadingMapItems) return [];

      return filterOutUndefined([
        // If time-series region mapping - show time points chart
        this.activeTableStyle.isRegions() && this.discreteTimes?.length
          ? this.momentChart
          : undefined,
        ...this.tableChartItems
      ]);
    }

    @override
    get viewingControls(): ViewingControl[] {
      return filterOutUndefined([
        ...super.viewingControls,
        {
          id: TableStylingWorkflow.type,
          name: i18next.t("models.tableData.editStyle"),
          onClick: action((viewState) =>
            SelectableDimensionWorkflow.runWorkflow(
              viewState,
              new TableStylingWorkflow(this)
            )
          ),
          icon: { glyph: Icon.GLYPHS.layers }
        }
      ]);
    }

    @computed get featureInfoContext(): (f: TerriaFeature) => JsonObject {
      return tableFeatureInfoContext(this);
    }

    @override
    get selectableDimensions(): SelectableDimension[] {
      return filterOutUndefined([
        this.timeDisableDimension,
        ...super.selectableDimensions,
        this.enableManualRegionMapping
          ? this.regionMappingDimensions
          : undefined,
        this.styleDimensions,
        this.outlierFilterDimension
      ]);
    }

    /**
     * Takes {@link TableStyle}s and returns a SelectableDimension which can be rendered in a Select dropdown
     */
    @computed
    get styleDimensions(): SelectableDimensionEnum | undefined {
      if (this.mapItems.length === 0 && !this.enableManualRegionMapping) {
        return;
      }
      return {
        type: "select",
        id: "activeStyle",
        name: i18next.t("models.tableData.activeStyle"),
        options: this.tableStyles
          .filter((style) => !style.hidden || this.activeStyle === style.id)
          .map((style) => {
            return {
              id: style.id,
              name: style.title
            };
          }),
        selectedId: this.activeStyle,
        allowUndefined: this.showDisableStyleOption,
        undefinedLabel: this.showDisableStyleOption
          ? i18next.t("models.tableData.styleDisabledLabel")
          : undefined,
        setDimensionValue: (stratumId: string, styleId) => {
          this.setTrait(stratumId, "activeStyle", styleId);
        }
      };
    }

    /**
     * Creates SelectableDimension for regionProviderList - the list of all available region providers.
     * {@link TableTraits#enableManualRegionMapping} must be enabled.
     */
    @computed
    get regionProviderDimensions(): SelectableDimensionEnum | undefined {
      const allRegionProviders = flatten(
        this.regionProviderLists?.map((list) => list.regionProviders) ?? []
      );
      if (
        allRegionProviders.length === 0 ||
        !isDefined(this.activeTableStyle.regionColumn)
      ) {
        return;
      }

      return {
        id: "regionMapping",
        name: i18next.t("models.tableData.regionMapping"),
        options: allRegionProviders.map((regionProvider) => {
          return {
            name: regionProvider.description,
            id: regionProvider.regionType
          };
        }),
        allowUndefined: true,
        selectedId: this.activeTableStyle.regionColumn?.regionType?.regionType,
        setDimensionValue: (
          stratumId: string,
          regionType: string | undefined
        ) => {
          let columnTraits = this.columns?.find(
            (column) => column.name === this.activeTableStyle.regionColumn?.name
          );
          if (!isDefined(columnTraits)) {
            columnTraits = this.addObject(
              stratumId,
              "columns",
              this.activeTableStyle.regionColumn!.name
            )!;
            columnTraits.setTrait(
              stratumId,
              "name",
              this.activeTableStyle.regionColumn!.name
            );
          }

          columnTraits.setTrait(stratumId, "regionType", regionType);
        }
      };
    }

    /**
     * Creates SelectableDimension for region column - the options contains a list of all columns.
     * {@link TableTraits#enableManualRegionMapping} must be enabled.
     */
    @computed
    get regionColumnDimensions(): SelectableDimensionEnum | undefined {
      if (!isDefined(this.regionProviderLists)) {
        return;
      }

      return {
        id: "regionColumn",
        name: i18next.t("models.tableData.regionColumn"),
        options: this.tableColumns.map((col) => {
          return {
            name: col.name,
            id: col.name
          };
        }),
        selectedId: this.activeTableStyle.regionColumn?.name,
        setDimensionValue: (
          stratumId: string,
          regionCol: string | undefined
        ) => {
          this.defaultStyle.setTrait(stratumId, "regionColumn", regionCol);
        }
      };
    }

    @computed get regionMappingDimensions(): SelectableDimensionGroup {
      return {
        id: "manual-region-mapping",
        name: i18next.t("models.tableData.manualRegionMapping"),
        type: "group",
        selectableDimensions: filterOutUndefined([
          this.regionColumnDimensions,
          this.regionProviderDimensions
        ])
      };
    }

    /**
     * Creates SelectableDimension for region column - the options contains a list of all columns.
     * {@link TableColorStyleTraits#zScoreFilter} must be enabled and {@link TableColorMap#zScoreFilterValues} must detect extreme (outlier) values
     */
    @computed
    get outlierFilterDimension(): SelectableDimension | undefined {
      if (
        !this.activeTableStyle.colorTraits.zScoreFilter ||
        !this.activeTableStyle.tableColorMap.zScoreFilterValues
      ) {
        return;
      }

      return {
        id: "outlierFilter",
        options: [
          { id: "true", name: i18next.t("models.tableData.zFilterEnabled") },
          { id: "false", name: i18next.t("models.tableData.zFilterDisabled") }
        ],
        selectedId: this.activeTableStyle.colorTraits.zScoreFilterEnabled
          ? "true"
          : "false",
        setDimensionValue: (stratumId: string, value) => {
          updateModelFromJson(this, stratumId, {
            defaultStyle: {
              color: { zScoreFilterEnabled: value === "true" }
            }
          }).logError("Failed to update zScoreFilterEnabled");
        },
        placement: "belowLegend",
        type: "checkbox"
      };
    }

    /**
     * Creates SelectableDimension to disable time - this will show if each rowGroup only has a single time
     */
    @computed
    get timeDisableDimension(): SelectableDimension | undefined {
      // Return nothing if no active time column and if the active time column has been explicitly hidden (using this.defaultStyle.time.timeColumn = null)
      // or if time column doesn't have at least one interval
      if (this.mapItems.length === 0 || !this.showDisableTimeOption) return;

      return {
        id: "disableTime",
        options: [
          {
            id: "true",
            name: i18next.t("models.tableData.timeDimensionEnabled")
          },
          {
            id: "false",
            name: i18next.t("models.tableData.timeDimensionDisabled")
          }
        ],
        selectedId:
          this.defaultStyle.time.timeColumn === null ? "false" : "true",
        setDimensionValue: (stratumId: string, value) => {
          // We have to set showDisableTimeOption to true - or this will hide when time column is disabled
          this.setTrait(stratumId, "showDisableTimeOption", true);
          this.defaultStyle.time.setTrait(
            stratumId,
            "timeColumn",
            value === "true" ? undefined : null
          );
        },
        type: "checkbox"
      };
    }

    @computed
    get rowIds(): number[] {
      const nRows = (this.dataColumnMajor?.[0]?.length || 1) - 1;
      const ids = [...new Array(nRows).keys()];
      return ids;
    }

    @computed
    get isSampled(): boolean {
      return this.activeTableStyle.isSampled;
    }

    @computed
    get discreteTimes():
      | { time: string; tag: string | undefined }[]
      | undefined {
      if (!this.activeTableStyle.moreThanOneTimeInterval) return;
      const dates = this.activeTableStyle.timeColumn?.valuesAsDates.values;
      if (dates === undefined) {
        return;
      }

      // is it correct for discrete times to remove duplicates?
      // see discussion on https://github.com/TerriaJS/terriajs/pull/4577
      // duplicates will mess up the indexing problem as our `<DateTimePicker />`
      // will eliminate duplicates on the UI front, so given the datepicker
      // expects uniques, return uniques here
      const times = new Set<string>();

      for (let i = 0; i < dates.length; i++) {
        const d = dates[i];
        if (d) {
          times.add(d.toISOString());
        }
      }

      return Array.from(times).map((time) => ({ time, tag: undefined }));
    }

    /** This is a temporary button which shows in the Legend in the Workbench, if custom styling has been applied. */
    @computed get legendButton() {
      return this.activeTableStyle.isCustom
        ? {
            title: i18next.t("models.tableData.custom"),
            onClick: action(() => {
              SelectableDimensionWorkflow.runWorkflow(
                this.terria,
                new TableStylingWorkflow(this)
              );
            })
          }
        : undefined;
    }

    findFirstColumnByType(type: TableColumnType): TableColumn | undefined {
      return this.tableColumns.find((column) => column.type === type);
    }

    findColumnByName(name: string | undefined): TableColumn | undefined {
      return isDefined(name)
        ? this.tableColumns.find((column) => column.name === name)
        : undefined;
    }

    protected async forceLoadMapItems() {
      try {
        const dataColumnMajor = await this.forceLoadTableData();

        // We need to make sure the region provider is loaded before loading
        // region mapped tables.
        await this.loadRegionProviderList();

        if (dataColumnMajor !== undefined && dataColumnMajor !== null) {
          runInAction(() => {
            this.dataColumnMajor = dataColumnMajor;
          });
        }

        // Load region IDS if region mapping
        const activeRegionType = this.activeTableStyle.regionColumn?.regionType;
        if (activeRegionType) {
          await activeRegionType.loadRegionIDs();
        }
      } catch (e) {
        // Clear data if error occurs
        runInAction(() => {
          this.dataColumnMajor = undefined;
        });
        throw e;
      }
    }

    /**
     * Forces load of the table data. This method does _not_ need to consider
     * whether the table data is already loaded.
     *
     * It is guaranteed that `loadMetadata` has finished before this is called, and `regionProviderList` is set.
     *
     * You **can not** make changes to observables until **after** an asynchronous call {@see AsyncLoader}.
     */
    protected abstract forceLoadTableData(): Promise<string[][] | undefined>;

    /** Load all region provider lists
     * These are loaded from terria.configParameters.regionMappingDefinitionsUrl
     */
    async loadRegionProviderList() {
      if (isDefined(this.regionProviderLists)) return;

      // regionMappingDefinitionsUrl is deprecated - but we use it instead of regionMappingDefinitionsUrls if defined
      const urls = isDefined(
        this.terria.configParameters.regionMappingDefinitionsUrl
      )
        ? [this.terria.configParameters.regionMappingDefinitionsUrl]
        : this.terria.configParameters.regionMappingDefinitionsUrls;

      // Load all region in parallel (but preserve order)
      const regionProviderLists = await Promise.all(
        urls.map(
          async (url) =>
            // Note can be called many times - all promises/results are cached in RegionProviderList.metaList
            await RegionProviderList.fromUrl(url, this.terria.corsProxy)
        )
      );

      runInAction(() => (this.regionProviderLists = regionProviderLists));
    }

    /*
     * Appends new table data in column major format to this table.
     * It is assumed that the column order is the same for both the tables.
     */
    @action
    append(dataColumnMajor2: string[][]) {
      if (
        this.dataColumnMajor !== undefined &&
        this.dataColumnMajor.length !== dataColumnMajor2.length
      ) {
        throw new DeveloperError(
          "Cannot add tables with different numbers of columns."
        );
      }

      const appended = this.dataColumnMajor || [];
      dataColumnMajor2.forEach((newRows, col) => {
        if (appended[col] === undefined) {
          appended[col] = [];
        }
        appended[col].push(...newRows);
      });
      this.dataColumnMajor = appended;
    }

    private readonly createLongitudeLatitudeDataSource = createTransformer(
      (style: TableStyle): DataSource | undefined => {
        if (!style.isPoints()) {
          return undefined;
        }

        const dataSource = new CustomDataSource(this.name || "Table");
        dataSource.entities.suspendEvents();

        let features: TerriaFeature[];
        if (style.isTimeVaryingPointsWithId()) {
          features = createLongitudeLatitudeFeaturePerId(style);
        } else {
          features = createLongitudeLatitudeFeaturePerRow(style);
        }

        // _catalogItem property is needed for some feature picking functions (eg `featureInfoTemplate`)
        features.forEach((f) => {
          f._catalogItem = this;
          dataSource.entities.add(f);
        });
        dataSource.show = this.show;
        dataSource.entities.resumeEvents();
        return dataSource;
      }
    );

    private readonly createRegionMappedImageryProvider = createTransformer(
      (input: {
        style: TableStyle;
        currentTime: JulianDate | undefined;
      }): ImageryProvider | undefined =>
        createRegionMappedImageryProvider(input.style, input.currentTime)
    );

    private readonly getTableColumn: ITransformer<number, TableColumn> =
      createTransformer((index: number) => {
        return new TableColumn(this, index);
      });

    private readonly getTableStyle: ITransformer<number, TableStyle> =
      createTransformer((index: number) => {
        return new TableStyle(this, index);
      });
  }

  return TableMixin;
}

namespace TableMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof TableMixin>> {}

  export function isMixedInto(model: any): model is Instance {
    return model && model.hasTableMixin;
  }
}

export default TableMixin;
