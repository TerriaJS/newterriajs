import { computed, makeObservable, override } from "mobx";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import isDefined from "../../../Core/isDefined";
import CatalogFunctionMixin from "../../../ModelMixins/CatalogFunctionMixin";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import TableMixin from "../../../ModelMixins/TableMixin";
import TableColumnType from "../../../Table/TableColumnType";
import YDYRCatalogFunctionTraits from "../../../Traits/TraitsClasses/YDYRCatalogFunctionTraits";
import CreateModel from "../../Definition/CreateModel";
import BooleanParameter from "../../FunctionParameters/BooleanParameter";
import EnumerationParameter from "../../FunctionParameters/EnumerationParameter";
import FunctionParameter from "../../FunctionParameters/FunctionParameter";
import InfoParameter from "../../FunctionParameters/InfoParameter";
import StringParameter from "../../FunctionParameters/StringParameter";
import { ModelConstructorParameters } from "../../Definition/Model";
import YDYRCatalogFunctionJob from "./YDYRCatalogFunctionJob";

export const DATASETS: {
  title: string;
  filename: string;
  dataCol: string;
  geographyName: string;
  sideData: string;
}[] = [
  {
    title: "ABS - 2011 Statistical Areas Level 1",
    filename: "SA1_2011_AUST",
    dataCol: "SA1_MAIN11",
    geographyName: "SA1_2011",
    sideData: "BCP_2011"
  },
  {
    title: "ABS - 2011 Statistical Areas Level 2",
    filename: "SA2_2011_AUST",
    dataCol: "SA2_MAIN11",
    geographyName: "SA2_2011",
    sideData: "BCP_2011"
  },
  {
    title: "ABS - 2011 Statistical Areas Level 3",
    filename: "SA3_2011_AUST",
    dataCol: "SA3_CODE11",
    geographyName: "SA3_2011",
    sideData: "BCP_2011"
  },
  {
    title: "ABS - 2011 Statistical Areas Level 4",
    filename: "SA4_2011_AUST",
    dataCol: "SA4_CODE11",
    geographyName: "SA4_2011",
    sideData: "BCP_2011"
  },
  {
    title: "ABS - 2011 Local Government Areas",
    filename: "LGA_2011_AUST",
    dataCol: "LGA_CODE11",
    geographyName: "LGA_2011",
    sideData: "BCP_2011"
  },
  {
    title: "ABS - 2011 Commonwealth Electoral Divisions",
    filename: "CED_2011_AUST",
    dataCol: "CED_CODE11",
    geographyName: "CED_2011",
    sideData: "BCP_2011"
  },
  {
    title: "ABS - 2011 State Electoral Divisions",
    filename: "SED_2011_AUST",
    dataCol: "SED_CODE11",
    geographyName: "SED_2011",
    sideData: "BCP_2011"
  },
  {
    title: "ABS - 2011 Remoteness Areas 2011",
    filename: "RA_2011_AUST",
    dataCol: "RA_CODE11",
    geographyName: "RA_2011",
    sideData: "BCP_2011"
  },
  {
    title: "ABS - 2011 State Suburbs",
    filename: "SSC_2011_AUST",
    dataCol: "SSC_CODE11",
    geographyName: "SSC_2011",
    sideData: "BCP_2011"
  },
  {
    title: "ABS - 2011 Postal Areas",
    filename: "POA_2011_AUST",
    dataCol: "POA_CODE",
    geographyName: "POA_2011",
    sideData: "BCP_2011"
  },
  {
    title: "ABS - 2016 Statistical Areas Level 1",
    filename: "SA1_2016_AUST",
    dataCol: "SA1_MAIN16",
    geographyName: "SA1_2016",
    sideData: "BCP_2016"
  },
  {
    title: "ABS - 2016 Statistical Areas Level 2",
    filename: "SA2_2016_AUST",
    dataCol: "SA2_MAIN16",
    geographyName: "SA2_2016",
    sideData: "BCP_2016"
  },
  {
    title: "ABS - 2016 Statistical Areas Level 3",
    filename: "SA3_2016_AUST",
    dataCol: "SA3_CODE16",
    geographyName: "SA3_2016",
    sideData: "BCP_2016"
  },
  {
    title: "ABS - 2016 Statistical Areas Level 4",
    filename: "SA4_2016_AUST",
    dataCol: "SA4_CODE16",
    geographyName: "SA4_2016",
    sideData: "BCP_2016"
  },
  {
    title: "ABS - 2016 Local Government Areas",
    filename: "LGA_2016_AUST",
    dataCol: "LGA_CODE16",
    geographyName: "LGA_2016",
    sideData: "BCP_2016"
  },
  {
    title: "ABS - 2016 Commonwealth Electoral Divisions",
    filename: "CED_2016_AUST",
    dataCol: "CED_CODE16",
    geographyName: "CED_2016",
    sideData: "BCP_2016"
  },
  {
    title: "ABS - 2016 State Electoral Divisions",
    filename: "SED_2016_AUST",
    dataCol: "SED_CODE16",
    geographyName: "SED_2016",
    sideData: "BCP_2016"
  },
  {
    title: "ABS - Remoteness Areas 2016",
    filename: "RA_2016_AUST",
    dataCol: "RA_CODE16",
    geographyName: "RA_2016",
    sideData: "BCP_2016"
  },
  {
    title: "ABS - 2016 State Suburbs",
    filename: "SSC_2016_AUST",
    dataCol: "SSC_CODE16",
    geographyName: "SSC_2016",
    sideData: "BCP_2016"
  },
  {
    title: "ABS - 2016 Postal Areas",
    filename: "POA_2016_AUST",
    dataCol: "POA_CODE16",
    geographyName: "POA_2016",
    sideData: "BCP_2016"
  }
];

export const SIDE_DATA = [
  { title: "Basic Community profile 2011", id: "BCP_2011" },
  { title: "Basic Community profile 2016", id: "BCP_2016" }
];

export const ALGORITHMS: [string, boolean][] = [
  ["Negative Binomial", true],
  ["Population Weighted", false]
  // ["Poisson Linear", false],
  // ["Ridge Regressor", false]
];

export default class YDYRCatalogFunction extends CatalogFunctionMixin(
  CreateModel(YDYRCatalogFunctionTraits)
) {
  static readonly type = "ydyr";

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get type(): string {
    return YDYRCatalogFunction.type;
  }

  get typeName(): string {
    return "YourDataYourRegions";
  }

  protected createJob(id: string) {
    return Promise.resolve(new YDYRCatalogFunctionJob(id, this.terria));
  }

  async forceLoadMetadata() {
    return super.forceLoadMetadata();
    // TODO: load capabilities from https://ydyr.info/api/v1/capability?format=json
    // https://github.com/TerriaJS/terriajs/issues/4943
  }

  @override
  get description() {
    return (
      super.description ??
      `Your Data Your Regions (YDYR) is an API for the conversion of data between different Australian geographic boundaries. See <a href="https://ydyr.info">ydyr.info</a> for more information`
    );
  }

  @computed
  get selectedTableCatalogMember(): TableMixin.Instance | undefined {
    if (!isDefined(this.inputLayers?.value)) {
      return;
    }
    const layer = this.terria.workbench.items
      .filter(TableMixin.isMixedInto)
      .filter((item) => item.uniqueId === this.inputLayers!.value)[0];

    return layer;
  }

  @computed
  get apiUrl(): StringParameter {
    return new StringParameter(this, {
      id: "apiUrl",
      name: "YDYR API Endpoint",
      isRequired: true
    });
  }

  @computed
  get inputLayers() {
    const possibleValues = this.terria.workbench.items
      .filter(
        (item) =>
          TableMixin.isMixedInto(item) && item.activeTableStyle.isRegions()
      )
      .filter((item) => item.uniqueId)
      .map((item) => {
        return {
          id: item.uniqueId,
          name: CatalogMemberMixin.isMixedInto(item) ? item.name : undefined
        };
      });

    return new EnumerationParameter(this, {
      id: "Input Layer",
      description: `Select a layer which contains the tabular data you want to convert to another geography, It should contain at least two columns:
- A geography column containing unique codes (eg postcodes)
- A data column containing the values you want to convert (eg number of households by postcode)`,
      options: possibleValues,

      isRequired: true
    });
  }

  @computed
  get inputLayersInfo() {
    let value = "";

    if (isDefined(this.inputLayers.value) && !this.inputLayers.isValid) {
      value = `The selected layer "${this.inputLayers.value} does not exist in the map". `;
    }

    if (this.inputLayers.options.length === 0) {
      value = `No supported input layers available, please add a region-mapped data layer to the map.`;
    }

    if (value !== "") {
      return new InfoParameter(this, {
        id: "inputLayersError",
        name: "Input Layer Error",
        errorMessage: true,
        value
      });
    }
  }

  @computed
  get regionColumn(): EnumerationParameter | undefined {
    if (!this.inputLayers.isValid) {
      return;
    }
    const possibleValues =
      this.selectedTableCatalogMember?.tableColumns
        // Filter region columns which use supported regions
        .filter(
          (col) =>
            col.type === TableColumnType.region &&
            isDefined(
              DATASETS.find((d) => d.dataCol === col.regionType?.regionProp)
            )
        )
        .map((col) => {
          return { id: col.name };
        }) || [];

    return new EnumerationParameter(this, {
      id: "Region Column",
      description:
        "The data source field which contains unique codes for the input geography.",
      options: possibleValues,

      isRequired: true
    });
  }

  @computed
  get regionColumnInfo() {
    if (this.inputLayers.isValid && this.regionColumn?.options.length === 0) {
      return new InfoParameter(this, {
        id: "regionColumnError",
        name: "Region Column Error",
        errorMessage: true,
        value: `No region columns available, the selected layer "${
          this.inputLayers.value
        }" doesn't have any supported region columns.
The region mapping can be set in the Workbench.

**Supported regions:**
${DATASETS.map((d) => `\n- ${d.title}`)}`
      });
    }
  }

  @computed
  get dataColumn(): EnumerationParameter | undefined {
    if (!this.inputLayers.isValid) {
      return;
    }
    const possibleValues =
      this.selectedTableCatalogMember?.tableColumns
        .filter((col) => col.type === TableColumnType.scalar)
        .map((col) => {
          return { id: col.name };
        }) || [];

    return new EnumerationParameter(this, {
      id: "Data Column",
      description:
        "The data source field which contains the values for the data to be converted.",
      options: possibleValues,
      isRequired: true
    });
  }

  @computed
  get dataColumnInfo() {
    if (this.inputLayers.isValid && this.dataColumn?.options.length === 0) {
      return new InfoParameter(this, {
        id: "dataColumnError",
        name: "Data Column Error",
        errorMessage: true,
        value: `No data columns available, the selected layer "${this.inputLayers.value}" doesn't have any numerical columns.`
      });
    }
  }

  @computed get availableRegions(): EnumerationParameter | undefined {
    if (!this.regionColumn?.isValid) {
      return;
    }
    return new EnumerationParameter(this, {
      id: "Output Geography",
      description: "The output geography to be converted to.",
      options: DATASETS.map((d) => {
        return { id: d.title };
      }),
      isRequired: true
    });
  }

  @computed get algorithmParametersInfo(): InfoParameter | undefined {
    if (this.algorithmParameters.length > 0) {
      return new InfoParameter(this, {
        id: "algorithmsInfo",
        name: "Select Algorithms",
        value: `Predictive models used to convert data between the input and output geographies:`
      });
    }
  }

  @computed get algorithmParameters(): BooleanParameter[] {
    if (
      !this.regionColumn?.isValid ||
      !this.dataColumn?.isValid ||
      !this.availableRegions?.isValid
    ) {
      return [];
    }
    return ALGORITHMS.map(
      (alg) =>
        new BooleanParameter(this, {
          id: alg[0]
        })
    );
  }

  @computed get submitWarning(): InfoParameter | undefined {
    if (
      this.inputLayers.isValid &&
      this.regionColumn?.isValid &&
      this.dataColumn?.isValid &&
      this.availableRegions?.isValid
    ) {
      return new InfoParameter(this, {
        id: "dataWarning",
        name: "Warning",
        errorMessage: false,
        value: `By submitting this form your tabular data will be sent to ${this.apiUrl.value} for processing.`
      });
    }
  }

  // Disabled due to lack of get capabilities from YDYR server
  // @computed get sidedataParameters(): EnumerationParameter {
  //   const possibleValues = SIDE_DATA.map(data => data.title);
  //   let value = possibleValues[0]
  //   if (isDefined(this.availableRegions.value)) {

  //   }
  //   return new EnumerationParameter({
  //     id: "Side data",
  //     possibleValues,
  //     value: possibleValues[0]
  //   });
  // }

  /**
   *  Maps the input to function parameters.
   */
  @computed
  get functionParameters(): FunctionParameter[] {
    return filterOutUndefined([
      this.apiUrl,
      this.inputLayers,
      this.inputLayersInfo,
      this.regionColumnInfo || this.regionColumn,

      this.dataColumnInfo || this.dataColumn,

      this.availableRegions,
      this.algorithmParametersInfo,
      ...this.algorithmParameters,
      this.submitWarning
      // this.sidedataParameters
    ]);
  }
}
