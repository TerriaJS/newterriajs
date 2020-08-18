import i18next from "i18next";
import { runInAction, computed } from "mobx";
import TerriaError from "../Core/TerriaError";
import AsyncChartableMixin from "../ModelMixins/AsyncChartableMixin";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import TableMixin from "../ModelMixins/TableMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import Csv from "../Table/Csv";
import TableAutomaticStylesStratum from "../Table/TableAutomaticStylesStratum";
import CsvCatalogItemTraits from "../Traits/CsvCatalogItemTraits";
import CreateModel from "./CreateModel";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import StratumOrder from "./StratumOrder";
import Terria from "./Terria";
import AutoRefreshingMixin from "../ModelMixins/AutoRefreshingMixin";
import isDefined from "../Core/isDefined";
import DiscretelyTimeVaryingMixin from "../ModelMixins/DiscretelyTimeVaryingMixin";
import { BaseModel } from "./Model";
import ExportableData from "./ExportableData";

// Types of CSVs:
// - Points - Latitude and longitude columns or address
// - Regions - Region column
// - Chart - No spatial reference at all
// - Other geometry - e.g. a WKT column

// Types of time varying:
// - ID+time column -> point moves, region changes (continuously?) over time
// - points, no ID, time -> "blips" with a duration (perhaps provided by another column)
//

const automaticTableStylesStratumName = "automaticTableStyles";

export default class CsvCatalogItem
  extends AsyncChartableMixin(
    TableMixin(
      // Since both TableMixin & DiscretelyTimeVaryingMixin defines
      // `chartItems`, the order of mixing in is important here
      DiscretelyTimeVaryingMixin(
        AutoRefreshingMixin(
          UrlMixin(CatalogMemberMixin(CreateModel(CsvCatalogItemTraits)))
        )
      )
    )
  )
  implements ExportableData {
  static get type() {
    return "csv";
  }

  private _csvFile?: File;

  constructor(
    id: string | undefined,
    terria: Terria,
    sourceReference: BaseModel | undefined
  ) {
    super(id, terria, sourceReference);
    this.strata.set(
      automaticTableStylesStratumName,
      new TableAutomaticStylesStratum(this)
    );
  }

  get type() {
    return CsvCatalogItem.type;
  }

  setFileInput(file: File) {
    this._csvFile = file;
  }

  @computed
  get hasLocalData(): boolean {
    return isDefined(this._csvFile);
  }

  @computed
  get canExportData() {
    return (
      isDefined(this._csvFile) ||
      isDefined(this.csvString) ||
      isDefined(this.url)
    );
  }

  @computed
  get cacheDuration() {
    return super.cacheDuration || "1d";
  }

  async exportData() {
    if (isDefined(this._csvFile)) {
      return {
        name: (this.name || this.uniqueId)!,
        file: this._csvFile
      };
    }
    if (isDefined(this.csvString)) {
      return {
        name: (this.name || this.uniqueId)!,
        file: new Blob([this.csvString])
      };
    }

    if (isDefined(this.url)) {
      return this.url;
    }

    throw new TerriaError({
      sender: this,
      message: "No data available to download."
    });
  }

  @computed
  get canZoomTo() {
    return this.activeTableStyle.latitudeColumn !== undefined;
  }

  /*
   * The polling URL to use for refreshing data.
   */
  @computed get refreshUrl() {
    return this.polling.url || this.url;
  }

  /*
   * Called by AutoRefreshingMixin to get the polling interval
   */
  @computed get refreshInterval() {
    if (this.refreshUrl) {
      return this.polling.seconds;
    }
  }

  @computed
  get discreteTimes() {
    const automaticTableStylesStratum:
      | TableAutomaticStylesStratum
      | undefined = this.strata.get(
      automaticTableStylesStratumName
    ) as TableAutomaticStylesStratum;
    return automaticTableStylesStratum?.discreteTimes;
  }

  /*
   * Hook called by AutoRefreshingMixin to refresh data.
   *
   * The refresh happens only if a `refreshUrl` is defined.
   * If `shouldReplaceData` is true, then the new data replaces current data,
   * otherwise new data is appended to current data.
   */
  refreshData() {
    if (!this.refreshUrl) {
      return;
    }

    Csv.parseUrl(proxyCatalogItemUrl(this, this.refreshUrl), true).then(
      dataColumnMajor => {
        runInAction(() => {
          if (this.polling.shouldReplaceData) {
            this.dataColumnMajor = dataColumnMajor;
          } else {
            this.append(dataColumnMajor);
          }
        });
      }
    );
  }

  protected forceLoadMetadata(): Promise<void> {
    return Promise.resolve();
  }

  protected forceLoadTableData(): Promise<string[][]> {
    if (this.csvString !== undefined) {
      return Csv.parseString(this.csvString, true);
    } else if (this._csvFile !== undefined) {
      return Csv.parseFile(this._csvFile, true);
    } else if (this.url !== undefined) {
      return Csv.parseUrl(proxyCatalogItemUrl(this, this.url), true);
    } else {
      return Promise.reject(
        new TerriaError({
          sender: this,
          title: i18next.t("models.csv.unableToLoadItemTitle"),
          message: i18next.t("models.csv.unableToLoadItemMessage")
        })
      );
    }
  }
}

StratumOrder.addLoadStratum(automaticTableStylesStratumName);
