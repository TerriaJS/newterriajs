import { action, runInAction, makeObservable } from "mobx";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import isDefined from "../../../Core/isDefined";
import loadJson from "../../../Core/loadJson";
import loadWithXhr from "../../../Core/loadWithXhr";
import CatalogFunctionJobMixin from "../../../ModelMixins/CatalogFunctionJobMixin";
import TableMixin from "../../../ModelMixins/TableMixin";
import YDYRCatalogFunctionJobTraits from "../../../Traits/TraitsClasses/YDYRCatalogFunctionJobTraits";
import CommonStrata from "../../Definition/CommonStrata";
import CreateModel from "../../Definition/CreateModel";
import CsvCatalogItem from "../CatalogItems/CsvCatalogItem";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import { ModelConstructorParameters } from "../../Definition/Model";
import { ALGORITHMS, DATASETS } from "./YDYRCatalogFunction";

export default class YDYRCatalogFunctionJob extends CatalogFunctionJobMixin(
  CreateModel(YDYRCatalogFunctionJobTraits)
) {
  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get typeName(): string {
    return "YourDataYourRegions Job";
  }

  static readonly type = "ydyr-job";
  get type() {
    return YDYRCatalogFunctionJob.type;
  }

  @action
  async _invoke() {
    if (!isDefined(this.parameters)) {
      throw "Parameters have not been set";
    }

    if (!isDefined(this.parameters["apiUrl"])) {
      throw "The apiUrl parameter must be defined.";
    }

    if (!isDefined(this.parameters!["Input Layer"])) {
      throw "The input layer must be defined";
    }

    const tableCatalogItem = this.terria.workbench.items
      .filter(TableMixin.isMixedInto)
      .filter((item) => item.uniqueId === this.parameters!["Input Layer"])[0];

    if (!isDefined(tableCatalogItem)) {
      throw `Layer ${
        this.parameters!["Input Layer"]
      } is not a valid layer in the workbench`;
    }

    if (
      !isDefined(this.parameters["Region Column"]) ||
      !isDefined(this.parameters["Data Column"]) ||
      !isDefined(this.parameters["Output Geography"])
    ) {
      throw `The region column, data column and output geography must be defined`;
    }

    const regionColumnName = this.parameters["Region Column"] as string;
    const dataColumnName = this.parameters["Data Column"] as string;
    const outputGeographyName = this.parameters["Output Geography"] as string;

    const regionColumn = tableCatalogItem?.findColumnByName(regionColumnName);
    const dataColumn = tableCatalogItem?.findColumnByName(dataColumnName);

    this.setTrait(
      CommonStrata.user,
      "name",
      `YDYR ${tableCatalogItem.name}: ${dataColumnName}`
    );

    const jobDetails = this.addObject(
      CommonStrata.user,
      "shortReportSections",
      "Job Details"
    );
    jobDetails?.setTrait(
      CommonStrata.user,
      "content",
      `${dataColumnName}: "${
        DATASETS.find(
          (d) => d.geographyName === regionColumn?.regionType?.regionType
        )?.title
      }" to "${outputGeographyName}"`
    );

    const data = {
      ids: regionColumn?.values,
      values: dataColumn?.valuesAsNumbers.values
    };

    if (!data.ids?.length || !data.values?.length) {
      throw `The column selected has no valid data values`;
    }

    // Remove rows with null values
    const invalidRows: number[] = filterOutUndefined(
      data.values.map((val, idx) => (val === null ? idx : undefined))
    );

    data.ids = data.ids.filter((_id, idx) => !invalidRows.includes(idx));
    data.values = data.values.filter(
      (_value, idx) => !invalidRows.includes(idx)
    );

    const params = {
      data,
      data_column: dataColumnName,
      geom_column: regionColumnName,
      side_data: DATASETS.find((d) => d.title === outputGeographyName)
        ?.sideData,
      dst_geom: DATASETS.find((d) => d.title === outputGeographyName)
        ?.geographyName,
      src_geom:
        tableCatalogItem?.activeTableStyle.regionColumn?.regionType?.regionType,
      averaged_counts: false,
      algorithms: ALGORITHMS.filter((alg) => this.parameters![alg[0]]).map(
        (alg) => alg[0]
      )
    };

    const jobId = await loadWithXhr({
      url: proxyCatalogItemUrl(
        this,
        `${this.parameters["apiUrl"]}disaggregate.json`
      ),
      method: "POST",
      data: JSON.stringify(params),
      headers: {
        "Content-Type": "application/json"
      },
      responseType: "json"
    });

    if (typeof jobId !== "string") {
      // TODO: improve error messaging

      // This is from previous YDYR web-app

      //   switch(createJobReponse.status) {
      //     case 202:
      //       createJobReponse.response
      //       break
      //     case 500:
      //       break
      //     default:
      //       break
      //   }

      //   if(r.status === 202) {
      //     // then the request was accepted
      //     r.json().then(j => poller(j));
      // } else if(r.status === 500) {
      //     // server error
      //     r.json().then(e => error({
      //         title: (e && e.title) || 'Server Error',
      //         detail: 'Job failed to submit' +
      //             ((e && e.detail) ? (': ' + e.detail) : '')}));
      // } else {
      //     const subber = s => {
      //         if(s.includes('is not valid under any of the given schemas')) {
      //             return 'invalid JSON data';
      //         }
      //         return s.length < 100 ? s : (s.substring(0, 100) + '...');
      //     }

      //     r.json()
      //       .then(e => error({
      //         title: (e && e.title) || 'Server Error',
      //         detail: 'Unexpected status (' + r.status.toString() + ') ' +
      //             'when submitting job' +
      //                 ((e && e.detail) ? (': ' + subber(e.detail)) : '')}))
      //       .catch(e => error({
      //         title: (e && e.title) || 'Error parsing JSON response',
      //         detail: `Received ${r.status} response code and failed to parse response as JSON`
      //       }));
      // }
      throw `The YDYR server didn't provide a valid job id.`;
    }

    this.setTrait(CommonStrata.user, "jobId", jobId);

    return false;
  }

  async pollForResults() {
    if (!isDefined(this.jobId)) {
      console.log("NO JOB ID");
      return true;
    }

    if (!isDefined(this.parameters!["apiUrl"])) {
      console.log("apiUrl parameter is not defined");
      return true;
    }

    const status = await loadJson(
      proxyCatalogItemUrl(
        this,
        `${this.parameters!["apiUrl"]}status/${this.jobId}`
      ),
      {
        "Cache-Control": "no-cache"
      }
    );

    if (typeof status !== "string") {
      runInAction(() =>
        this.setTrait(CommonStrata.user, "logs", [
          ...this.logs,
          JSON.stringify(status)
        ])
      );

      this.setTrait(CommonStrata.user, "resultId", status.key);
      return true;
    } else {
      runInAction(() =>
        this.setTrait(CommonStrata.user, "logs", [...this.logs, status])
      );

      return false;
    }
  }

  downloadResults() {
    if (!isDefined(this.resultId)) {
      return Promise.resolve([]);
    }

    if (!isDefined(this.parameters!["apiUrl"])) {
      console.log("apiUrl parameter is not defined");
      return Promise.resolve([]);
    }

    const csvResult = new CsvCatalogItem(
      `${this.uniqueId}-result`,
      this.terria,
      undefined
    );

    runInAction(() => {
      csvResult.setTrait(CommonStrata.user, "name", `${this.name} Results`);
      csvResult.setTrait(
        CommonStrata.user,
        "url",
        proxyCatalogItemUrl(
          this,
          `${this.parameters!["apiUrl"]}download/${this.resultId}?format=csv`
        )
      );
      csvResult.setTrait(CommonStrata.user, "enableManualRegionMapping", true);
    });

    return Promise.resolve([csvResult]);
  }
}
