import i18next from "i18next";
import { computed, runInAction, makeObservable } from "mobx";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import RequestErrorEvent from "terriajs-cesium/Source/Core/RequestErrorEvent";
import URI from "urijs";
import AsyncLoader from "../Core/AsyncLoader";
import Constructor from "../Core/Constructor";
import isDefined from "../Core/isDefined";
import loadBlob from "../Core/loadBlob";
import loadXML from "../Core/loadXML";
import Result from "../Core/Result";
import TerriaError, { networkRequestError } from "../Core/TerriaError";
import proxyCatalogItemUrl from "../Models/Catalog/proxyCatalogItemUrl";
import ResultPendingCatalogItem from "../Models/Catalog/ResultPendingCatalogItem";
import CommonStrata from "../Models/Definition/CommonStrata";
import createStratumInstance from "../Models/Definition/createStratumInstance";
import LoadableStratum from "../Models/Definition/LoadableStratum";
import Model, { BaseModel } from "../Models/Definition/Model";
import StratumOrder from "../Models/Definition/StratumOrder";
import UserDrawing from "../Models/UserDrawing";
import xml2json from "../ThirdParty/xml2json";
import { InfoSectionTraits } from "../Traits/TraitsClasses/CatalogMemberTraits";
import ExportWebCoverageServiceTraits, {
  WebCoverageServiceParameterTraits
} from "../Traits/TraitsClasses/ExportWebCoverageServiceTraits";
import { getName } from "./CatalogMemberMixin";
import ExportableMixin from "./ExportableMixin";
import filterOutUndefined from "../Core/filterOutUndefined";

type Coverage = {
  CoverageId: string;
  CoverageSubtype: string;
  Title: string;
  WGS84BoundingBox: {
    LowerCorner: string;
    UpperCorner: string;
    dimension: string;
  };
};

/** Call WCS GetCapabilities to get list of:
 * - available coverages
 * - available CRS
 * - available file formats
 *
 * Note: not currently used
 */
class WebCoverageServiceCapabilitiesStratum extends LoadableStratum(
  ExportWebCoverageServiceTraits
) {
  static stratumName = "wcsCapabilitiesStratum";

  static async load(catalogItem: ExportWebCoverageServiceMixin.Instance) {
    if (!catalogItem.linkedWcsUrl) throw "`linkedWcsUrl` is undefined";

    const url = new URI(catalogItem.linkedWcsUrl)
      .query({
        service: "WCS",
        request: "GetCapabilities",
        version: "2.0.0"
      })
      .toString();
    const capabilitiesXml = await loadXML(
      proxyCatalogItemUrl(catalogItem, url)
    );
    const json = xml2json(capabilitiesXml);
    if (!isDefined(json.ServiceMetadata)) {
      throw networkRequestError({
        title: "Invalid GetCapabilities",
        message:
          `The URL ${url} was retrieved successfully but it does not appear to be a valid Web Coverage Service (WCS) GetCapabilities document.` +
          `\n\nEither the catalog file has been set up incorrectly, or the server address has changed.`
      });
    }

    const coverages: Coverage[] = json.Contents?.CoverageSummary ?? [];
    const formats: string[] = json.ServiceMetadata?.formatSupported ?? [];
    const crs: string[] =
      json.ServiceMetadata?.Extension?.CrsMetadata?.crsSupported ?? [];

    return new WebCoverageServiceCapabilitiesStratum(catalogItem, {
      coverages,
      formats,
      crs
    });
  }

  constructor(
    readonly catalogItem: ExportWebCoverageServiceMixin.Instance,
    readonly capabilities: {
      coverages: Coverage[];
      formats: string[];
      crs: string[];
    }
  ) {
    super();
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new WebCoverageServiceCapabilitiesStratum(
      model as ExportWebCoverageServiceMixin.Instance,
      this.capabilities
    ) as this;
  }
}

/** Call WCS DescribeCoverage for a specific coverageId to get:
 * - Native CRS
 * - Native format
 */
class WebCoverageServiceDescribeCoverageStratum extends LoadableStratum(
  ExportWebCoverageServiceTraits
) {
  static stratumName = "wcsDescribeCoverageStratum";

  static async load(catalogItem: ExportWebCoverageServiceMixin.Instance) {
    if (!catalogItem.linkedWcsUrl) throw "`linkedWcsUrl` is undefined";
    if (!catalogItem.linkedWcsCoverage)
      throw "`linkedWcsCoverage` is undefined";

    const url = new URI(catalogItem.linkedWcsUrl)
      .query({
        service: "WCS",
        request: "DescribeCoverage",
        version: "2.0.0",
        coverageId: catalogItem.linkedWcsCoverage
      })
      .toString();

    const capabilitiesXml = await loadXML(
      proxyCatalogItemUrl(catalogItem, url)
    );
    const json = xml2json(capabilitiesXml);
    if (typeof json.CoverageDescription?.CoverageId !== "string") {
      throw networkRequestError({
        title: "Invalid DescribeCoverage",
        message:
          `The URL ${url} was retrieved successfully but it does not appear to be a valid Web Coverage Service (WCS) DescribeCoverage document.` +
          `\n\nEither the catalog file has been set up incorrectly, or the server address has changed.`
      });
    }

    const nativeFormat: string | undefined =
      json.CoverageDescription?.ServiceParameters?.nativeFormat;

    // Try get native CRS from domainSet and then boundedBy
    const nativeCrs: string | undefined =
      json.CoverageDescription?.domainSet?.Grid?.srsName ??
      json.CoverageDescription?.boundedBy?.EnvelopeWithTimePeriod?.srsName ??
      json.CoverageDescription?.boundedBy?.Envelope?.srsName;

    return new WebCoverageServiceDescribeCoverageStratum(catalogItem, {
      nativeFormat,
      nativeCrs
    });
  }

  constructor(
    readonly catalogItem: ExportWebCoverageServiceMixin.Instance,
    readonly coverage: {
      nativeFormat: string | undefined;
      nativeCrs: string | undefined;
    }
  ) {
    super();
    makeObservable(this);
  }

  @computed get linkedWcsParameters() {
    return createStratumInstance(WebCoverageServiceParameterTraits, {
      outputCrs: this.coverage.nativeCrs,
      outputFormat: this.coverage.nativeFormat
    });
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new WebCoverageServiceDescribeCoverageStratum(
      model as ExportWebCoverageServiceMixin.Instance,
      this.coverage
    ) as this;
  }
}

function ExportWebCoverageServiceMixin<
  T extends Constructor<Model<ExportWebCoverageServiceTraits>>
>(Base: T) {
  abstract class ExportWebCoverageServiceMixin extends ExportableMixin(Base) {
    private _wcsCapabilitiesLoader = new AsyncLoader(
      this.loadWcsCapabilities.bind(this)
    );

    private _wcsDescribeCoverageLoader = new AsyncLoader(
      this.loadWcsDescribeCoverage.bind(this)
    );

    constructor(...args: any[]) {
      super(...args);
      makeObservable(this);
    }

    @computed
    get isLoadingWcsMetadata(): boolean {
      return (
        this._wcsCapabilitiesLoader.isLoading ||
        this._wcsDescribeCoverageLoader.isLoading
      );
    }

    async loadWcsMetadata(force?: boolean) {
      const results = await Promise.all([
        // Disable GetCapabilities loader until we need it
        // this._wcsCapabilitiesLoader.load(force),
        this._wcsDescribeCoverageLoader.load(force)
      ]);

      return Result.combine(results, {
        message: `Failed to load \`${getName(
          this
        )}\` WebCoverageService metadata`,
        importance: -1
      });
    }

    private async loadWcsCapabilities() {
      const capabilities =
        await WebCoverageServiceCapabilitiesStratum.load(this);

      runInAction(() =>
        this.strata.set(
          WebCoverageServiceCapabilitiesStratum.stratumName,
          capabilities
        )
      );
    }
    private async loadWcsDescribeCoverage() {
      const describeCoverage =
        await WebCoverageServiceDescribeCoverageStratum.load(this);
      runInAction(() =>
        this.strata.set(
          WebCoverageServiceDescribeCoverageStratum.stratumName,
          describeCoverage
        )
      );
    }

    // ExportableMixin overrides
    @computed
    get _canExportData() {
      return isDefined(this.linkedWcsCoverage) && isDefined(this.linkedWcsUrl);
    }

    _exportData(): Promise<undefined | { name: string; file: Blob }> {
      return new Promise((resolve, reject) => {
        const terria = this.terria;
        runInAction(() => (terria.pickedFeatures = undefined));

        let rectangle: Rectangle | undefined;

        const userDrawing = new UserDrawing({
          terria: this.terria,
          messageHeader: "Click two points to draw a retangle extent.",
          buttonText: "Download Extent",
          onPointClicked: () => {
            if (userDrawing.pointEntities.entities.values.length >= 2) {
              rectangle = userDrawing?.otherEntities?.entities
                ?.getById("rectangle")
                ?.rectangle?.coordinates?.getValue(
                  this.terria.timelineClock.currentTime
                );
            }
          },
          onCleanUp: async () => {
            if (isDefined(rectangle)) {
              if (!this.linkedWcsUrl || !this.linkedWcsCoverage) return;

              return this.downloadCoverage(rectangle)
                .then(resolve)
                .catch(reject);
            } else {
              reject("Invalid drawn extent.");
            }
          },
          allowPolygon: false,
          drawRectangle: true
        });

        userDrawing.enterDrawMode();
      });
    }

    /** Generate WCS GetCoverage URL */
    getCoverageUrl(bbox: Rectangle): Result<string | undefined> {
      try {
        let error: TerriaError | undefined = undefined;

        if (
          this.linkedWcsParameters.duplicateSubsetValues &&
          this.linkedWcsParameters.duplicateSubsetValues.length > 0
        ) {
          let message = `WebCoverageService (WCS) only supports one value per dimension.\n\n  `;

          // Add message for each duplicate subset
          message += this.linkedWcsParameters.duplicateSubsetValues.map(
            (subset) =>
              `- Multiple dimension values have been set for \`${subset.key}\`. WCS GetCoverage request will use the first value (\`${subset.key} = "${subset.value}"\`).`
          );

          error = new TerriaError({
            title: "Warning: export may not reflect displayed data",
            message,
            importance: 1
          });
        }

        // Make query parameter object
        const query = {
          service: "WCS",
          request: "GetCoverage",
          version: "2.0.0",
          coverageId: this.linkedWcsCoverage,
          format: this.linkedWcsParameters.outputFormat,

          // Add subsets for bbox, time and dimensions
          subset: [
            `Long(${CesiumMath.toDegrees(bbox.west)},${CesiumMath.toDegrees(
              bbox.east
            )})`,
            `Lat(${CesiumMath.toDegrees(bbox.south)},${CesiumMath.toDegrees(
              bbox.north
            )})`,
            // Turn subsets into `key=(value)` format
            ...filterOutUndefined(
              (this.linkedWcsParameters.subsets ?? []).map((subset) =>
                subset.key && subset.value
                  ? `${subset.key}(${
                      // Wrap string values in double quotes
                      typeof subset.value === "string"
                        ? `"${subset.value}"`
                        : subset.value
                    })`
                  : undefined
              )
            )
          ],

          subsettingCrs: "EPSG:4326",
          outputCrs: this.linkedWcsParameters.outputCrs
        };

        // Add linkedWcsParameters.additionalParameters ontop of query object
        Object.assign(
          query,
          (this.linkedWcsParameters.additionalParameters ?? []).reduce<{
            [key: string]: string | undefined;
          }>((q, current) => {
            if (typeof current.key === "string") {
              q[current.key] = current.value;
            }
            return q;
          }, {})
        );

        return new Result(
          new URI(this.linkedWcsUrl).query(query).toString(),
          error
        );
      } catch (e) {
        return Result.error(e);
      }
    }

    /** This function downloads WCS coverage for a given bbox (in radians)
     * It will also create a "pendingWorkbenchItem" with loading indicator and short description.
     */
    async downloadCoverage(
      bbox: Rectangle
    ): Promise<{ name: string; file: Blob }> {
      // Create pending workbench item
      const now = new Date();

      const timestamp = `${now.getFullYear().toString().padStart(4, "0")}-${(
        now.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}T${now
        .getHours()
        .toString()
        .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now
        .getSeconds()
        .toString()
        .padStart(2, "0")}`;

      const pendingWorkbenchItem = new ResultPendingCatalogItem(
        `WCS: ${getName(this)} ${timestamp}`,
        this.terria
      );
      try {
        runInAction(() => {
          pendingWorkbenchItem.loadPromise = new Promise(() => {});
          pendingWorkbenchItem.loadMetadata();

          // Add WCS loading metadata message to shortReport
          pendingWorkbenchItem.setTrait(
            CommonStrata.user,
            "shortReport",
            i18next.t("models.wcs.asyncResultLoadingMetadata", {
              name: getName(this),
              timestamp: timestamp
            })
          );
        });

        pendingWorkbenchItem.terria.workbench.add(pendingWorkbenchItem);

        // Load WCS metadata (DescribeCoverage request)
        (await this.loadWcsMetadata()).throwIfError();

        // Get WCS URL
        // This will throw an error if URL is undefined
        // It will raise an error if URL is defined, but an error has occurred
        const urlResult = this.getCoverageUrl(bbox);
        const url = urlResult.throwIfUndefined({
          message: "Failed to generate WCS GetCoverage request URL",
          importance: 2 // Higher importance than error message in `getCoverageUrl()`
        });
        urlResult.raiseError(
          this.terria,
          `Error occurred while generating WCS GetCoverage URL`
        );

        runInAction(() => {
          // Add WCS "pending" message to shortReport
          pendingWorkbenchItem.setTrait(
            CommonStrata.user,
            "shortReport",
            i18next.t("models.wcs.asyncPendingDescription", {
              name: getName(this),
              timestamp: timestamp
            })
          );

          // Create info section from URL query parameters
          const info = createStratumInstance(InfoSectionTraits, {
            name: "Inputs",
            content: `<table class="cesium-infoBox-defaultTable">${Object.entries(
              new URI(url).query(true)
            ).reduce<string>(
              (previousValue, [key, value]) =>
                `${previousValue}<tr><td style="vertical-align: middle">${key}</td><td>${value}</td></tr>`,
              ""
            )}</table>`
          });

          pendingWorkbenchItem.setTrait(CommonStrata.user, "info", [info]);
        });

        const blob = await loadBlob(proxyCatalogItemUrl(this, url));

        runInAction(() =>
          pendingWorkbenchItem.terria.workbench.remove(pendingWorkbenchItem)
        );

        return { name: `${getName(this)} clip.tiff`, file: blob };
      } catch (error) {
        if (error instanceof TerriaError) {
          throw error;
        }

        // Attempt to get error message out of XML response
        if (
          error instanceof RequestErrorEvent &&
          isDefined(error?.response?.type) &&
          error.response.type?.indexOf("xml") !== -1
        ) {
          try {
            const xml = new DOMParser().parseFromString(
              await error.response.text(),
              "text/xml"
            );

            if (
              xml.documentElement.localName === "ServiceExceptionReport" ||
              xml.documentElement.localName === "ExceptionReport"
            ) {
              const message =
                xml.getElementsByTagName("ServiceException")?.[0]?.innerHTML ??
                xml.getElementsByTagName("ows:ExceptionText")?.[0]?.innerHTML;
              if (isDefined(message)) {
                /* eslint-disable-next-line no-ex-assign */
                error = message;
              }
            }
          } catch (xmlParseError) {
            console.log("Failed to parse WCS response");
            console.log(xmlParseError);
          }
        }

        throw new TerriaError({
          sender: this,
          title: i18next.t("models.wcs.exportFailedTitle"),
          message: i18next.t("models.wcs.exportFailedMessageII", {
            error
          })
        });
      } finally {
        runInAction(() =>
          pendingWorkbenchItem.terria.workbench.remove(pendingWorkbenchItem)
        );
      }
    }

    dispose() {
      super.dispose();
      this._wcsCapabilitiesLoader.dispose();
      this._wcsDescribeCoverageLoader.dispose();
    }
  }

  return ExportWebCoverageServiceMixin;
}

namespace ExportWebCoverageServiceMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof ExportWebCoverageServiceMixin>> {}
  export function isMixedInto(model: any): model is Instance {
    return (
      model &&
      "loadWcsMetadata" in model &&
      typeof model.loadWcsMetadata === "function"
    );
  }

  StratumOrder.addLoadStratum(
    WebCoverageServiceCapabilitiesStratum.stratumName
  );
  StratumOrder.addLoadStratum(
    WebCoverageServiceDescribeCoverageStratum.stratumName
  );
}

export default ExportWebCoverageServiceMixin;
