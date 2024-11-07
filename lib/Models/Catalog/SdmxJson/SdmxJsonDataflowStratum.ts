import i18next from "i18next";
import { computed, makeObservable } from "mobx";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import isDefined from "../../../Core/isDefined";
import { networkRequestError } from "../../../Core/TerriaError";
import {
  MetadataUrlTraits,
  ShortReportTraits
} from "../../../Traits/TraitsClasses/CatalogMemberTraits";
import { DimensionOptionTraits } from "../../../Traits/TraitsClasses/DimensionTraits";
import { FeatureInfoTemplateTraits } from "../../../Traits/TraitsClasses/FeatureInfoTraits";
import LegendTraits from "../../../Traits/TraitsClasses/LegendTraits";
import SdmxCatalogItemTraits, {
  SdmxDimensionTraits
} from "../../../Traits/TraitsClasses/SdmxCatalogItemTraits";
import {
  ModelOverrideTraits,
  ModelOverrideType
} from "../../../Traits/TraitsClasses/SdmxCommonTraits";
import TableChartStyleTraits, {
  TableChartLineStyleTraits
} from "../../../Traits/TraitsClasses/Table/ChartStyleTraits";
import TableColorStyleTraits from "../../../Traits/TraitsClasses/Table/ColorStyleTraits";
import TableColumnTraits, {
  ColumnTransformationTraits
} from "../../../Traits/TraitsClasses/Table/ColumnTraits";
import TableStyleTraits from "../../../Traits/TraitsClasses/Table/StyleTraits";
import TableTimeStyleTraits from "../../../Traits/TraitsClasses/Table/TimeStyleTraits";
import createCombinedModel from "../../Definition/createCombinedModel";
import createStratumInstance from "../../Definition/createStratumInstance";
import LoadableStratum from "../../Definition/LoadableStratum";
import Model, { BaseModel } from "../../Definition/Model";
import StratumFromTraits from "../../Definition/StratumFromTraits";
import StratumOrder from "../../Definition/StratumOrder";
import { filterEnums } from "../../SelectableDimensions/SelectableDimensions";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import SdmxJsonCatalogItem from "./SdmxJsonCatalogItem";
import { loadSdmxJsonStructure, parseSdmxUrn } from "./SdmxJsonServerStratum";
import {
  Attribute,
  CodeLists,
  ConceptSchemes,
  ContentConstraints,
  Dataflow,
  DataStructure,
  Dimension,
  SdmxJsonStructureMessage
} from "./SdmxJsonStructureMessage";

export interface SdmxJsonDataflow {
  /** metadata for dataflow (eg description) */
  dataflow: Dataflow;
  /** lists this dataflow's dimensions (including time), attributes, primary measure, ... */
  dataStructure: DataStructure;
  /** codelists describe dimension/attribute values (usually to make them human-readable) */
  codelists?: CodeLists;
  /** concept schemes: used to describe dimensions and attributes */
  conceptSchemes?: ConceptSchemes;
  /** contentConstraints: describe allowed values for enumerated dimensions/attributes */
  contentConstraints?: ContentConstraints;
}
export class SdmxJsonDataflowStratum extends LoadableStratum(
  SdmxCatalogItemTraits
) {
  static stratumName = "sdmxJsonDataflow";

  duplicateLoadableStratum(model: BaseModel): this {
    return new SdmxJsonDataflowStratum(
      model as SdmxJsonCatalogItem,
      this.sdmxJsonDataflow
    ) as this;
  }

  /**
   * Load SDMX-JSON dataflow - will also load references (dataStructure, codelists, conceptSchemes, contentConstraints)
   */
  static async load(
    catalogItem: SdmxJsonCatalogItem
  ): Promise<SdmxJsonDataflowStratum> {
    // Load dataflow (+ all related references)
    const dataflowStructure: SdmxJsonStructureMessage =
      await loadSdmxJsonStructure(
        proxyCatalogItemUrl(
          catalogItem,
          `${catalogItem.baseUrl}/dataflow/${catalogItem.agencyId}/${catalogItem.dataflowId}?references=all`
        ),
        false
      );

    // Check response
    if (!isDefined(dataflowStructure.data)) {
      throw networkRequestError({
        title: i18next.t("models.sdmxJsonDataflowStratum.loadDataErrorTitle"),
        message: i18next.t(
          "models.sdmxJsonDataflowStratum.loadDataErrorMessage.invalidResponse"
        )
      });
    }
    if (
      !Array.isArray(dataflowStructure.data.dataflows) ||
      dataflowStructure.data.dataflows.length === 0
    ) {
      throw networkRequestError({
        title: i18next.t("models.sdmxJsonDataflowStratum.loadDataErrorTitle"),
        message: i18next.t(
          "models.sdmxJsonDataflowStratum.loadDataErrorMessage.noDataflow",
          this
        )
      });
    }
    if (
      !Array.isArray(dataflowStructure.data.dataStructures) ||
      dataflowStructure.data.dataStructures.length === 0
    ) {
      throw networkRequestError({
        title: i18next.t("models.sdmxJsonDataflowStratum.loadDataErrorTitle"),
        message: i18next.t(
          "models.sdmxJsonDataflowStratum.loadDataErrorMessage.noDatastructure",
          this
        )
      });
    }

    return new SdmxJsonDataflowStratum(catalogItem, {
      dataflow: dataflowStructure.data.dataflows[0],
      dataStructure: dataflowStructure.data.dataStructures[0],
      codelists: dataflowStructure.data.codelists,
      conceptSchemes: dataflowStructure.data.conceptSchemes,
      contentConstraints: dataflowStructure.data.contentConstraints
    });
  }

  constructor(
    private readonly catalogItem: SdmxJsonCatalogItem,
    private readonly sdmxJsonDataflow: SdmxJsonDataflow
  ) {
    super();
    makeObservable(this);
  }

  @computed
  get description() {
    return this.sdmxJsonDataflow.dataflow.description;
  }

  /** Transform dataflow annotations with type "EXT_RESOURCE"
   * These can be of format:
   * - ${title}|${url}|${imageUrl}
   * - EG "Metadata|http://purl.org/spc/digilib/doc/7thdz|https://sdd.spc.int/themes/custom/sdd/images/icons/metadata.png"
   */
  @computed get metadataUrls() {
    return filterOutUndefined(
      this.sdmxJsonDataflow?.dataflow.annotations
        ?.filter((a) => a.type === "EXT_RESOURCE" && a.text)
        .map((annotation) => {
          const text = annotation.texts?.[i18next.language] ?? annotation.text!;
          const title = text.includes("|") ? text.split("|")[0] : undefined;
          const url = text.includes("|") ? text.split("|")[1] : text;
          return createStratumInstance(MetadataUrlTraits, { title, url });
        }) ?? []
    );
  }

  get sdmxAttributes() {
    return (
      this.sdmxJsonDataflow.dataStructure.dataStructureComponents?.attributeList
        ?.attributes ?? []
    );
  }

  get sdmxDimensions() {
    return (
      this.sdmxJsonDataflow.dataStructure.dataStructureComponents?.dimensionList
        ?.dimensions ?? []
    );
  }

  get sdmxTimeDimensions() {
    return (
      this.sdmxJsonDataflow.dataStructure.dataStructureComponents?.dimensionList
        .timeDimensions ?? []
    );
  }

  get sdmxPrimaryMeasure() {
    return this.sdmxJsonDataflow.dataStructure.dataStructureComponents
      ?.measureList.primaryMeasure;
  }

  /**
   * If we get a dataflow with a single value (and not region-mapped), show the exact value in a short report
   */
  @computed
  get shortReportSections() {
    if (this.catalogItem.mapItems.length !== 0 || this.catalogItem.isLoading)
      return;

    const primaryCol = this.catalogItem.tableColumns.find(
      (col) => col.name === this.primaryMeasureColumn?.name
    );
    if (
      primaryCol?.valuesAsNumbers.values.length === 1 &&
      typeof primaryCol?.valuesAsNumbers.values[0] === "number"
    ) {
      return [
        createStratumInstance(ShortReportTraits, {
          name: this.chartTitle,
          content: primaryCol?.valuesAsNumbers.values[0].toLocaleString(
            undefined,
            primaryCol.traits.format
          )
        })
      ];
    }
  }

  // ------------- START SDMX TRAITS STRATUM -------------

  /** Merge codelist and concept model overrides (codelist takes priority) */
  getMergedModelOverride(
    dim: Attribute | Dimension
  ): Model<ModelOverrideTraits> | undefined {
    const conceptOverride = this.catalogItem.modelOverrides.find(
      (concept) => concept.id === dim.conceptIdentity
    );
    const codelistOverride = this.catalogItem.modelOverrides.find(
      (codelist) => codelist.id === dim.localRepresentation?.enumeration
    );

    let modelOverride = conceptOverride;
    if (!modelOverride) {
      modelOverride = codelistOverride;

      // If there is a codelist and concept override, merge them
    } else if (codelistOverride) {
      modelOverride = createCombinedModel(codelistOverride, modelOverride);
    }

    return modelOverride;
  }
  /**
   * This maps SDMX-JSON dataflow structure to `SdmxDimensionTraits` (which gets turned into `SelectableDimensions`) - it uses:
   * - Data structure's dimensions (filtered to only include "enumerated" dimensions)
   * - Content constraints to find dimension options
   * - Codelists to add human readable labels to dimension options
   *
   * It will also apply ModelOverrides - which are used to override dimension values based on concept/codelist ID.
   * - @see ModelOverrideTraits
   */
  @computed
  get dimensions(): StratumFromTraits<SdmxDimensionTraits>[] | undefined {
    // Constraint contains allowed dimension values for a given dataflow
    // Get 'actual' constraints (rather than 'allowed' constraints)
    const constraints = this.sdmxJsonDataflow.contentConstraints?.filter(
      (c) => c.type === "Actual"
    );

    return (
      this.sdmxDimensions
        // Filter normal enum dimensions
        .filter(
          (dim) =>
            dim.id &&
            dim.type === "Dimension" &&
            dim.localRepresentation?.enumeration
        )
        .map((dim) => {
          const modelOverride = this.getMergedModelOverride(dim);

          // Concept maps dimension's ID to a human-readable name
          const concept = this.getConceptByUrn(dim.conceptIdentity);

          // Codelist maps dimension enum values to human-readable labels
          const codelist = this.getCodelistByUrn(
            dim.localRepresentation?.enumeration
          );

          // Get allowed options from constraints.cubeRegions (there may be multiple - take union of all values)
          const allowedOptionIds = Array.isArray(constraints)
            ? constraints.reduce<Set<string>>((keys, constraint) => {
                constraint.cubeRegions?.forEach((cubeRegion) =>
                  cubeRegion.keyValues
                    ?.filter((kv) => kv.id === dim.id)
                    ?.forEach((regionKey) =>
                      regionKey.values?.forEach((value) => keys.add(value))
                    )
                );
                return keys;
              }, new Set())
            : new Set();

          // Get codes by merging allowedOptionIds with codelist
          const filteredCodesList =
            (allowedOptionIds.size > 0
              ? codelist?.codes?.filter((code) =>
                  allowedOptionIds.has(code.id!)
                )
              : // If no allowedOptions were found -> return all codes
                codelist?.codes) ?? [];

          // Create options object
          // If modelOverride `options` has been defined -> use it
          // Other wise use filteredCodesList
          const overrideOptions = modelOverride?.options;
          const options: StratumFromTraits<DimensionOptionTraits>[] =
            isDefined(overrideOptions) && overrideOptions.length > 0
              ? overrideOptions.map((option) => {
                  return {
                    id: option.id,
                    name: option.name,
                    value: undefined
                  };
                })
              : filteredCodesList.map((code) => {
                  return { id: code.id!, name: code.name, value: undefined };
                });

          // Use first option as default if no other default is provided
          let selectedId: string | undefined = modelOverride?.allowUndefined
            ? undefined
            : options[0]?.id;

          // Override selectedId if it a valid option
          const selectedIdOverride = modelOverride?.selectedId;

          if (
            isDefined(selectedIdOverride) &&
            options.find((option) => option.id === selectedIdOverride)
          ) {
            selectedId = selectedIdOverride;
          }

          return {
            id: dim.id!,
            name: modelOverride?.name ?? concept?.name,
            options: options,
            position: dim.position,
            disable: modelOverride?.disable,
            allowUndefined: modelOverride?.allowUndefined,
            selectedId: selectedId
          };
        })
        .filter(isDefined)
    );
  }

  /**
   * Adds SDMX Common concepts as model overrides:
   * - `UNIT_MEASURE` (see `this.unitMeasure`)
   * - `UNIT_MULT` (see `this.primaryMeasureColumn`)
   * - `FREQ` (see `this.unitMeasure`)
   */
  @computed
  get modelOverrides() {
    return filterOutUndefined(
      // Map through all dimensions and attributes to find ones which use common concepts
      [...this.sdmxDimensions, ...this.sdmxAttributes].map((dimAttr) => {
        const conceptUrn = parseSdmxUrn(dimAttr.conceptIdentity);
        // Add UNIT_MEASURE common concept override for unit-measure
        if (conceptUrn?.descendantIds?.[0] === "UNIT_MEASURE") {
          return createStratumInstance(ModelOverrideTraits, {
            id: dimAttr.conceptIdentity,
            type: "unit-measure"
          });
          // Add UNIT_MULT common concept override for unit-multiplier
        } else if (conceptUrn?.descendantIds?.[0] === "UNIT_MULT") {
          return createStratumInstance(ModelOverrideTraits, {
            id: dimAttr.conceptIdentity,
            type: "unit-multiplier"
          });
          // Add FREQUENCY common concept override for frequency
        } else if (conceptUrn?.descendantIds?.[0] === "FREQ") {
          return createStratumInstance(ModelOverrideTraits, {
            id: dimAttr.conceptIdentity,
            type: "frequency"
          });
        }
      })
    );
  }

  /**
   * Get unitMeasure string using modelOverrides.
   * - Search for columns linked to dimensions/attributes which have modelOverrides of type "unit-measure"
   * - We will only use a column if it has a single unique value - as this unitMeasure it used effectively as "units" for the dataset
   * - Also search for dimensions which have modelOverrides of type "frequency".
   * - These will be used to add the frequency to the end of the unitMeasure string
   * For example: "Value (Yearly)" or "AUD (Quarterly)"
   *
   */
  @computed
  get unitMeasure(): string | undefined {
    // Find tableColumns which have corresponding modelOverride with type `unit-measure`
    // We will only use columns if they have a single unique value
    const unitMeasure = filterOutUndefined(
      this.catalogItem.modelOverrides
        ?.filter((override) => override.type === "unit-measure" && override.id)
        .map((override) => {
          // Find dimension/attribute id with concept or codelist override
          const dimOrAttr =
            this.getAttributionWithConceptOrCodelist(override.id!) ??
            this.getDimensionWithConceptOrCodelist(override.id!);

          const column = this.catalogItem.findColumnByName(dimOrAttr?.id);

          if (column?.uniqueValues.values.length === 1) {
            // If this column has a codelist, use it to format the value
            const codelist = this.getCodelistByUrn(
              dimOrAttr?.localRepresentation?.enumeration
            );

            const value = column?.uniqueValues.values[0];

            return codelist?.codes?.find((c) => c.id === value)?.name ?? value;
          }
        })
    ).join(", ");

    // Find frequency from dimensions with modelOverrides of type "frequency".
    const frequencyDim = this.getDimensionsWithOverrideType("frequency").find(
      (dim) => isDefined(dim.selectedId)
    );

    // Try to get option label if it exists
    const frequency =
      frequencyDim?.options.find((o) => o.id === frequencyDim.selectedId)
        ?.name ?? frequencyDim?.id;

    return `${
      unitMeasure ||
      i18next.t("models.sdmxJsonDataflowStratum.defaultUnitMeasure")
    }${frequency ? ` (${frequency})` : ""}`;
  }

  // ------------- START TABLE TRAITS STRATUM -------------

  /**
   * Add TableColumnTraits for primary measure column - this column contains observational values to be visualised on chart or map:
   * - `name` to dimension id
   * - `title` to concept name
   * - `transformation` if unit multiplier attribute has been found (which will apply `x*(10^unitMultiplier)` to all observation values)
   */
  @computed
  get primaryMeasureColumn(): StratumFromTraits<TableColumnTraits> | undefined {
    if (!this.sdmxPrimaryMeasure) return;

    const primaryMeasureConcept = this.getConceptByUrn(
      this.sdmxPrimaryMeasure?.conceptIdentity
    );

    // Find unit multiplier columns by searching for attributes/dimensions which have modelOverrides of type "unit-multiplier".
    // Use the first column found
    const unitMultiplier = filterOutUndefined(
      this.catalogItem.modelOverrides
        ?.filter(
          (override) => override.type === "unit-multiplier" && override.id
        )
        .map((override) => {
          // Find dimension/attribute id with concept or codelist
          const dimOrAttr =
            this.getAttributionWithConceptOrCodelist(override.id!) ??
            this.getDimensionWithConceptOrCodelist(override.id!);

          return dimOrAttr?.id;
        })
    )[0];

    return createStratumInstance(TableColumnTraits, {
      name: this.sdmxPrimaryMeasure?.id,
      title: primaryMeasureConcept?.name,
      type: "scalar",
      // If a unitMultiplier was found, we add `x*(10^unitMultiplier)` transformation
      transformation: unitMultiplier
        ? createStratumInstance(ColumnTransformationTraits, {
            expression: `x*(10^${unitMultiplier})`,
            dependencies: [unitMultiplier]
          })
        : undefined
    });
  }

  /**
   * Add TableColumnTraits for dimensions
   * The main purpose of this is to try to find the region type for columns.
   * It also adds:
   * - `name` as dimension id
   * - `title` as concept name (more human-readable than dimension id)
   * - `type` to `region` if a valid region-type is found, or `hidden` if the dimension is disabled
   */

  @computed
  get dimensionColumns(): StratumFromTraits<TableColumnTraits>[] {
    // Get columns for all dimensions (excluding time dimensions)
    return (
      this.sdmxDimensions

        .filter((dim) => isDefined(dim.id))
        .map((dim) => {
          // Hide dimension columns if they are disabled
          if (this.dimensions?.find((d) => d.id === dim.id)?.disable) {
            return createStratumInstance(TableColumnTraits, {
              name: dim.id,
              type: "hidden"
            });
          }

          // Get concept for the current dimension
          const concept = this.getConceptByUrn(dim.conceptIdentity);
          // Get codelist for current dimension
          const codelist = this.getCodelistByUrn(
            dim.localRepresentation?.enumeration
          );

          const modelOverride = this.getMergedModelOverride(dim);

          // Try to find region type
          let regionType: string | undefined;

          // Are any regionTypes present in modelOverride
          regionType = this.catalogItem.matchRegionProvider(
            modelOverride?.regionType
          )?.regionType;

          // Next try fetching region type from another dimension (only if this modelOverride type 'region')
          // It will look through dimensions which have modelOverrides of type `region-type` and have a selectedId, if one is found - it will be used as the regionType of this column
          // Note this will override previous regionType
          if (modelOverride?.type === "region") {
            // Use selectedId of first dimension with one
            regionType =
              this.catalogItem.matchRegionProvider(
                this.getDimensionsWithOverrideType("region-type").find((d) =>
                  isDefined(d.selectedId)
                )?.selectedId
              )?.regionType ?? regionType;
          }

          // Try to find valid region type from:
          // - dimension ID
          // - codelist name
          // - codelist ID
          // - concept name?
          // - concept id (the string, not the full URN)

          if (!isDefined(regionType))
            regionType =
              this.catalogItem.matchRegionProvider(dim.id)?.regionType ??
              this.catalogItem.matchRegionProvider(codelist?.name)
                ?.regionType ??
              this.catalogItem.matchRegionProvider(codelist?.id)?.regionType ??
              this.catalogItem.matchRegionProvider(concept?.name)?.regionType ??
              this.catalogItem.matchRegionProvider(concept?.id)?.regionType;

          // Apply regionTypeReplacements (which can replace regionType with a different regionType - using [{find:string, replace:string}] pattern)
          if (modelOverride?.type === "region") {
            const replacement = modelOverride?.regionTypeReplacements?.find(
              (r) => r.find === regionType
            )?.replace;
            if (isDefined(replacement)) {
              regionType = replacement;
            }
          }

          return createStratumInstance(TableColumnTraits, {
            name: dim.id,
            title: concept?.name,
            // We set columnType to hidden for all columns except for region columns - as we are never interested in visualising them
            // For "time" columns see `get timeColumns()`
            // For primary measure ("scalar") column - see `get primaryMeasureColumn()`
            type: isDefined(regionType) ? "region" : "hidden",
            regionType
          });
        }) ?? []
    );
  }

  /**
   * Add traits for time columns:
   * - `name` to dimension id
   * - `type = time`
   * - `title` to concept name (if it exists)
   */
  @computed
  get timeColumns(): StratumFromTraits<TableColumnTraits>[] {
    return (
      this.sdmxTimeDimensions.map((dim) => {
        const concept = this.getConceptByUrn(dim.conceptIdentity);
        return createStratumInstance(TableColumnTraits, {
          name: dim.id,
          title: concept?.name ?? dim.id,
          type: "time"
        });
      }) ?? []
    );
  }

  /**
   * Add traits for attribute columns - all attribute columns are hidden, they are used to describe the primary measure (in feature info, unit measure, unit multiplier...):
   * - `name` to attribute id
   * - `type = hidden`
   */
  @computed
  get attributeColumns(): StratumFromTraits<TableColumnTraits>[] {
    return (
      this.sdmxAttributes.map((attr) => {
        return createStratumInstance(TableColumnTraits, {
          name: attr.id,
          type: "hidden"
        });
      }) ?? []
    );
  }

  /**
   * Munge all columns together
   */
  @computed
  get columns() {
    return filterOutUndefined([
      this.primaryMeasureColumn,
      ...this.dimensionColumns,
      ...this.timeColumns,
      ...this.attributeColumns
    ]);
  }

  /** Get region TableColumn by searching catalogItem.tableColumns for region dimension
   * NOTE: this is searching through catalogItem.tableColumns to find the completely resolved regionColumn
   * This can only be used in computed/fns outside of ColumnTraits - or you will get infinite recursion
   */
  @computed get resolvedRegionColumn() {
    return this.catalogItem.tableColumns.find(
      (tableCol) =>
        tableCol.name ===
        this.dimensionColumns.find((dimCol) => dimCol.type === "region")?.name
    );
  }

  /** If we only have a single region (or no regions)
   * We want to:
   * - disable the region column so we get a chart instead - see `get styles()`
   * - get region name for chart title (if single region) - see `get chartTitle()`
   **/
  @computed get disableRegion() {
    return (
      !this.catalogItem.isLoading &&
      this.resolvedRegionColumn?.ready &&
      (this.resolvedRegionColumn?.valuesAsRegions.uniqueRegionIds.length ??
        0) <= 1
    );
  }

  /** Get nice title to use for chart
   * If we have a region column with a single region, it will append the region name to the title
   */
  @computed get chartTitle() {
    if (this.disableRegion) {
      const regionValues = this.resolvedRegionColumn?.uniqueValues.values;
      if (regionValues && regionValues.length === 1) {
        // Get region dimension ID
        const regionDimensionId =
          this.getDimensionsWithOverrideType("region")[0]?.id;
        // Lookup in sdmxDimensions to get codelist (this is needed because region dimensions which have more options than MAX_SELECTABLE_DIMENSION_OPTIONS will not return any dimension.options)
        const regionDimension = this.sdmxDimensions.find(
          (dim) => dim.id === regionDimensionId
        );
        if (regionDimension) {
          // Try to get human readable region name from codelist
          const codelist = this.getCodelistByUrn(
            regionDimension.localRepresentation?.enumeration
          );
          const regionName =
            codelist?.codes?.find((c) => c.id === regionValues[0])?.name ??
            regionValues[0];
          return `${regionName} - ${this.unitMeasure}`;
        }
      }
    }

    return this.unitMeasure;
  }

  /**
   * Set TableStyleTraits for primary measure column:
   * - Legend title is set to `unitMeasure` to add context - eg "AUD (Quarterly)"
   * - Chart traits are set if this dataflow is time-series with no region-mapping:
   *   - `xAxisColumn` to time column name
   *   - `lines.name` set to `unitMeasure`
   *   - `lines.yAxisColumn` set to primary measure column
   * - `regionColumn` set to region dimension name (if one exists)
   */
  @computed
  get styles() {
    if (this.primaryMeasureColumn) {
      return [
        createStratumInstance(TableStyleTraits, {
          id: this.primaryMeasureColumn.name,

          color: createStratumInstance(TableColorStyleTraits, {
            legend: createStratumInstance(LegendTraits, {
              title: this.unitMeasure
            }),
            /** Enable z-score filtering (see TableColorStyleTraits.zScoreFilter) */
            zScoreFilter: 4
          }),
          time: createStratumInstance(TableTimeStyleTraits, {
            timeColumn: this.timeColumns[0].name,
            spreadStartTime: true,
            spreadFinishTime: true
          }),
          // Add chart if there is a time column but no region column
          chart:
            this.timeColumns.length > 0 &&
            (this.disableRegion || !this.resolvedRegionColumn)
              ? createStratumInstance(TableChartStyleTraits, {
                  xAxisColumn: this.timeColumns[0].name,
                  lines: [
                    createStratumInstance(TableChartLineStyleTraits, {
                      name: this.chartTitle,
                      yAxisColumn: this.primaryMeasureColumn.name
                    })
                  ]
                })
              : undefined,
          regionColumn: this.disableRegion
            ? null
            : this.resolvedRegionColumn?.name
        })
      ];
    }
    return [];
  }

  /**
   * Set active table style to primary measure column
   */
  @computed
  get activeStyle() {
    return this.primaryMeasureColumn?.name;
  }

  /**
   * Set default time to last time of dataset
   */
  @computed
  get initialTimeSource() {
    return "stop";
  }

  /**
   * Formats feature info table to add:
   * - Current time (if time-series)
   * - Selected region (if region-mapped)
   * - All dimension values
   * - Formatted primary measure (the actual value)
   * - Time-series chart
   */
  @computed
  get featureInfoTemplate() {
    const regionType = this.resolvedRegionColumn?.regionType;
    if (!regionType) return;

    let template = '<table class="cesium-infoBox-defaultTable">';

    // Function to format row with title and value
    const row = (title: string, value: string) =>
      `<tr><td style="vertical-align: middle">${title}</td><td>${value}</td></tr>`;

    // Get time dimension values
    template += this.timeColumns
      ?.map((col) => row(col.title ?? "Time", `{{${col.name}}}`))
      .join(", ");

    // Get region dimension values

    template += row(regionType?.description, `{{${regionType?.nameProp}}}`);

    // Get other dimension values
    template += filterEnums(this.catalogItem.sdmxSelectableDimensions)
      ?.filter((d) => (d.name || d.id) && !d.disable && d.selectedId)
      .map((d) => {
        const selectedOption = d.options?.find((o) => o.id === d.selectedId);
        return row((d.name || d.id)!, selectedOption?.name ?? d.selectedId!);
      })
      .join("");

    const primaryMeasureName =
      this.unitMeasure ??
      this.primaryMeasureColumn?.title ??
      this.primaryMeasureColumn?.name ??
      "Value";

    template +=
      row("", "") +
      row(
        primaryMeasureName,
        `{{#terria.formatNumber}}{useGrouping: true}{{${this.primaryMeasureColumn?.name}}}{{/terria.formatNumber}}`
      );

    // Add timeSeries chart if more than one time observation
    if (
      this.catalogItem.discreteTimes &&
      this.catalogItem.discreteTimes.length > 1
    ) {
      const chartName = `${this.catalogItem.name}: {{${regionType.nameProp}}}`;
      template += `</table>{{#terria.timeSeries.data}}<chart title="${chartName}" x-column="{{terria.timeSeries.xName}}" y-column="${this.primaryMeasureColumn?.title}" >{{terria.timeSeries.data}}</chart>{{/terria.timeSeries.data}}`;
    }

    return createStratumInstance(FeatureInfoTemplateTraits, { template });
  }

  // ------------- START SDMX STRUCTURE HELPER FUNCTIONS -------------
  getConceptScheme(id: string) {
    if (!isDefined(id)) return;
    return this.sdmxJsonDataflow.conceptSchemes?.find((c) => c.id === id);
  }

  getConceptByUrn(urn?: string) {
    if (!urn) return;
    const conceptUrn = parseSdmxUrn(urn);
    const conceptSchemeId = conceptUrn?.resourceId;
    const conceptId = conceptUrn?.descendantIds?.[0];

    if (!isDefined(conceptId)) return;
    const resolvedConceptScheme =
      typeof conceptSchemeId === "string"
        ? this.getConceptScheme(conceptSchemeId)
        : conceptSchemeId;

    return resolvedConceptScheme?.concepts?.find((d) => d.id === conceptId);
  }

  getCodelistByUrn(urn?: string) {
    if (!urn) return;
    const codelistUrn = parseSdmxUrn(urn);
    const id = codelistUrn?.resourceId;
    if (!isDefined(id)) return;
    return this.sdmxJsonDataflow.codelists?.find((c) => c.id === id);
  }

  /**
   * Find modelOverrides with type 'region-type' to try to extract regionType from another dimension
   * For example, ABS have a regionType dimension which may have values (SA1, SA2, ...), which could be used to determine regionType
   */
  getDimensionsWithOverrideType(type: ModelOverrideType) {
    return filterOutUndefined(
      this.catalogItem.modelOverrides
        ?.filter((override) => override.type === type && override.id)
        .map((override) => {
          // Find dimension id with concept or codelist
          return this.catalogItem.dimensions?.find(
            (d) =>
              d.id === this.getDimensionWithConceptOrCodelist(override.id!)?.id
          );
        })
    );
  }

  getDimensionWithConceptOrCodelist(id: string) {
    return this.sdmxDimensions.find(
      (dim) =>
        dim.conceptIdentity === id ||
        dim.localRepresentation?.enumeration === id
    );
  }

  getAttributionWithConceptOrCodelist(id: string) {
    return this.sdmxAttributes.find(
      (attr) =>
        attr.conceptIdentity === id ||
        attr.localRepresentation?.enumeration === id
    );
  }
}

StratumOrder.addLoadStratum(SdmxJsonDataflowStratum.stratumName);
