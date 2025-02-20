import i18next from "i18next";
import { computed, makeObservable, override, runInAction } from "mobx";
import isDefined from "../../../Core/isDefined";
import TerriaError from "../../../Core/TerriaError";
import AutoRefreshingMixin from "../../../ModelMixins/AutoRefreshingMixin";
import TableMixin from "../../../ModelMixins/TableMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import Csv from "../../../Table/Csv";
import TableAutomaticStylesStratum from "../../../Table/TableAutomaticStylesStratum";
import CsvCatalogItemTraits from "../../../Traits/TraitsClasses/CsvCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import { BaseModel } from "../../Definition/Model";
import StratumOrder from "../../Definition/StratumOrder";
import HasLocalData from "../../HasLocalData";
import Terria from "../../Terria";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

// Types of CSVs:
// - Points - Latitude and longitude columns or address
// - Regions - Region column
// - Chart - No spatial reference at all
// - Other geometry - e.g. a WKT column

// Types of time varying:
// - ID+time column -> point moves, region changes (continuously?) over time
// - points, no ID, time -> "blips" with a duration (perhaps provided by another column)
//
export default class CsvCatalogItem
  extends AutoRefreshingMixin(
    TableMixin(UrlMixin(CreateModel(CsvCatalogItemTraits)))
  )
  implements HasLocalData
{
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
    makeObservable(this);
    this.strata.set(
      TableAutomaticStylesStratum.stratumName,
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

  @override
  get _canExportData() {
    return (
      isDefined(this._csvFile) ||
      isDefined(this.csvString) ||
      isDefined(this.url)
    );
  }

  @override
  get cacheDuration() {
    return super.cacheDuration || "1d";
  }

  protected _exportData() {
    if (isDefined(this._csvFile)) {
      return Promise.resolve({
        name: (this.name || this.uniqueId)!,
        file: this._csvFile
      });
    }
    if (isDefined(this.csvString)) {
      return Promise.resolve({
        name: (this.name || this.uniqueId)!,
        file: new Blob([this.csvString])
      });
    }

    if (isDefined(this.url)) {
      return Promise.resolve(this.url);
    }

    throw new TerriaError({
      sender: this,
      message: "No data available to download."
    });
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
  @override
  get refreshInterval() {
    if (this.refreshUrl) {
      return this.polling.seconds;
    }
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

    Csv.parseUrl(
      proxyCatalogItemUrl(this, this.refreshUrl),
      true,
      this.ignoreRowsStartingWithComment
    ).then((dataColumnMajor) => {
      runInAction(() => {
        if (this.polling.shouldReplaceData) {
          this.dataColumnMajor = dataColumnMajor;
        } else {
          this.append(dataColumnMajor);
        }
      });
    });
  }

  protected forceLoadTableData(): Promise<string[][]> {
    if (this.csvString !== undefined) {
      return Csv.parseString(
        this.csvString,
        true,
        this.ignoreRowsStartingWithComment
      );
    } else if (this._csvFile !== undefined) {
      return Csv.parseFile(
        this._csvFile,
        true,
        this.ignoreRowsStartingWithComment
      );
    } else if (this.url !== undefined) {
      return Csv.parseUrl(
        proxyCatalogItemUrl(this, this.url),
        true,
        this.ignoreRowsStartingWithComment
      );
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

StratumOrder.addLoadStratum(TableAutomaticStylesStratum.stratumName);
