import i18next from "i18next";
import {
  action,
  computed,
  IReactionDisposer,
  makeObservable,
  observable,
  ObservableMap,
  reaction,
  runInAction
} from "mobx";
import filterOutUndefined from "../../Core/filterOutUndefined";
import isDefined from "../../Core/isDefined";
import TerriaError from "../../Core/TerriaError";
import ConstantColorMap from "../../Map/ColorMap/ConstantColorMap";
import ContinuousColorMap from "../../Map/ColorMap/ContinuousColorMap";
import DiscreteColorMap from "../../Map/ColorMap/DiscreteColorMap";
import EnumColorMap from "../../Map/ColorMap/EnumColorMap";
import { allIcons, getMakiIcon } from "../../Map/Icons/Maki/MakiIcons";
import ProtomapsImageryProvider from "../../Map/ImageryProvider/ProtomapsImageryProvider";
import { getName } from "../../ModelMixins/CatalogMemberMixin";
import { ImageryParts, isDataSource } from "../../ModelMixins/MappableMixin";
import TableMixin from "../../ModelMixins/TableMixin";
import {
  QualitativeColorSchemeOptionRenderer,
  QuantitativeColorSchemeOptionRenderer
} from "../../ReactViews/SelectableDimensions/ColorSchemeOptionRenderer";
import { MarkerOptionRenderer } from "../../ReactViews/SelectableDimensions/MarkerOptionRenderer";
import Icon from "../../Styled/Icon";
import {
  DEFAULT_DIVERGING,
  DEFAULT_QUALITATIVE,
  DEFAULT_SEQUENTIAL,
  DIVERGING_SCALES,
  QUALITATIVE_SCALES,
  SEQUENTIAL_CONTINUOUS_SCALES,
  SEQUENTIAL_SCALES
} from "../../Table/TableColorMap";
import TableColumnType from "../../Table/TableColumnType";
import TableStyleMap from "../../Table/TableStyleMap";
import ModelTraits from "../../Traits/ModelTraits";
import { EnumColorTraits } from "../../Traits/TraitsClasses/Table/ColorStyleTraits";
import CommonStrata from "../Definition/CommonStrata";
import Model from "../Definition/Model";
import ModelPropertiesFromTraits from "../Definition/ModelPropertiesFromTraits";
import updateModelFromJson from "../Definition/updateModelFromJson";
import {
  FlatSelectableDimension,
  SelectableDimensionButton,
  SelectableDimensionColor,
  SelectableDimensionGroup,
  SelectableDimensionNumeric,
  SelectableDimensionText
} from "../SelectableDimensions/SelectableDimensions";
import ViewingControls from "../ViewingControls";
import SelectableDimensionWorkflow, {
  SelectableDimensionWorkflowGroup
} from "../Workflows/SelectableDimensionWorkflow";

/** The ColorSchemeType is used to change which SelectableDimensions are shown.
 * It is basically the "mode" of the TableStylingWorkflow
 *
 * For example - if we are using "sequential-continuous" - then the dimensions will be shown to configure the following:
 * - Sequential color scales
 * - Minimum/Maximum values
 */
type ColorSchemeType =
  | "no-style"
  | "sequential-continuous"
  | "sequential-discrete"
  | "diverging-continuous"
  | "diverging-discrete"
  | "custom-discrete"
  | "qualitative"
  | "custom-qualitative";

type StyleType =
  | "fill"
  | "point-size"
  | "point"
  | "outline"
  | "label"
  | "trail";

/** Columns/Styles with the following TableColumnTypes will be hidden unless we are showing "advanced" options */
export const ADVANCED_TABLE_COLUMN_TYPES = [
  TableColumnType.latitude,
  TableColumnType.longitude,
  TableColumnType.region,
  TableColumnType.time
];

/** SelectableDimensionWorkflow to set styling options for TableMixin models */
export default class TableStylingWorkflow
  implements SelectableDimensionWorkflow
{
  static type = "table-styling";

  /** This is used to simplify SelectableDimensions available to the user.
   * For example - if equal to `diverging-continuous` - then only Diverging continuous color scales will be presented as options
   * See setColorSchemeTypeFromPalette and setColorSchemeType for how this is set. */
  @observable colorSchemeType: ColorSchemeType | undefined;
  @observable styleType: StyleType = "fill";

  /** Which bin is currently open in `binMaximumsSelectableDims` or `enumColorsSelectableDim`.
   * This is used in `SelectableDimensionGroup.onToggle` and `SelectableDimensionGroup.isOpen` to make the groups act like an accordion - so only one bin can be edited at any given time.
   */
  @observable
  private readonly openBinIndex = new ObservableMap<
    StyleType,
    number | undefined
  >();

  private activeStyleDisposer: IReactionDisposer;

  constructor(readonly item: TableMixin.Instance) {
    makeObservable(this);
    // We need to reset colorSchemeType every time Table.activeStyle changes
    this.activeStyleDisposer = reaction(
      () => this.item.activeStyle,
      () => {
        // If the active style is of "advanced" TableColumnType, then set colorSchemeType to "no-style"
        if (
          isDefined(this.item.activeTableStyle.colorColumn) &&
          ADVANCED_TABLE_COLUMN_TYPES.includes(
            this.item.activeTableStyle.colorColumn.type
          )
        ) {
          runInAction(() => (this.colorSchemeType = "no-style"));
        } else {
          this.setColorSchemeTypeFromPalette();
        }
      }
    );
    this.setColorSchemeTypeFromPalette();
  }

  onClose() {
    this.activeStyleDisposer();
  }

  @computed
  get menu() {
    return {
      options: filterOutUndefined([
        {
          text: this.showAdvancedOptions
            ? i18next.t("models.tableStyling.hideAdvancedOptions")
            : i18next.t("models.tableStyling.showAdvancedOptions"),
          onSelect: action(() => {
            this.showAdvancedOptions = !this.showAdvancedOptions;
          })
        },
        this.showAdvancedOptions
          ? {
              text: i18next.t("models.tableStyling.copyUserStratum"),
              onSelect: () => {
                const stratum = JSON.stringify(
                  this.item.strata.get(CommonStrata.user)
                );
                try {
                  navigator.clipboard.writeText(
                    JSON.stringify(this.item.strata.get(CommonStrata.user))
                  );
                } catch (e) {
                  TerriaError.from(e).raiseError(
                    this.item.terria,
                    "Failed to copy to clipboard. User stratum has been printed to console"
                  );
                  console.log(stratum);
                }
              },
              disable: !this.showAdvancedOptions
            }
          : undefined
      ])
    };
  }

  get name() {
    return i18next.t("models.tableStyling.name");
  }

  get icon() {
    return Icon.GLYPHS.layers;
  }

  get footer() {
    return {
      buttonText: i18next.t("models.tableStyling.reset"),
      /** Delete all user strata values for TableColumnTraits and TableStyleTraits for the current activeStyle */
      onClick: action(() => {
        this.getTableColumnTraits(CommonStrata.user)?.strata.delete(
          CommonStrata.user
        );
        this.getTableStyleTraits(CommonStrata.user)?.strata.delete(
          CommonStrata.user
        );
        this.setColorSchemeTypeFromPalette();
      })
    };
  }

  /** This will look at the current `colorMap` and `colorPalette` to guess which `colorSchemeType` is active.
   * This is because `TableMixin` doesn't have an explicit `"colorSchemeType"` flag - it will choose the appropriate type based on `TableStyleTraits`
   * `colorTraits.colorPalette` is also set here if we are only using `tableColorMap.defaultColorPaletteName`
   */
  @action
  setColorSchemeTypeFromPalette(): void {
    const colorMap = this.tableStyle.colorMap;
    const colorPalette = this.tableStyle.colorTraits.colorPalette;
    const defaultColorPalette =
      this.tableStyle.tableColorMap.defaultColorPaletteName;

    const colorPaletteWithDefault = colorPalette ?? defaultColorPalette;

    this.colorSchemeType = undefined;

    if (colorMap instanceof ConstantColorMap) {
      this.colorSchemeType = "no-style";
    } else if (colorMap instanceof ContinuousColorMap) {
      if (
        SEQUENTIAL_SCALES.includes(colorPaletteWithDefault) ||
        SEQUENTIAL_CONTINUOUS_SCALES.includes(colorPaletteWithDefault)
      ) {
        this.colorSchemeType = "sequential-continuous";
        if (!colorPalette) {
          this.getTableStyleTraits(CommonStrata.user)?.color.setTrait(
            CommonStrata.user,
            "colorPalette",
            DEFAULT_SEQUENTIAL
          );
        }
      } else if (DIVERGING_SCALES.includes(colorPaletteWithDefault)) {
        this.colorSchemeType = "diverging-continuous";
        if (!colorPalette) {
          this.getTableStyleTraits(CommonStrata.user)?.color.setTrait(
            CommonStrata.user,
            "colorPalette",
            DEFAULT_DIVERGING
          );
        }
      }
    } else if (colorMap instanceof DiscreteColorMap) {
      if (
        this.tableStyle.colorTraits.binColors &&
        this.tableStyle.colorTraits.binColors.length > 0
      ) {
        this.colorSchemeType = "custom-discrete";
      } else if (SEQUENTIAL_SCALES.includes(colorPaletteWithDefault)) {
        this.colorSchemeType = "sequential-discrete";
        if (!colorPalette) {
          this.getTableStyleTraits(CommonStrata.user)?.color.setTrait(
            CommonStrata.user,
            "colorPalette",
            DEFAULT_SEQUENTIAL
          );
        }
      } else if (DIVERGING_SCALES.includes(colorPaletteWithDefault)) {
        this.colorSchemeType = "diverging-discrete";
        if (!colorPalette) {
          this.getTableStyleTraits(CommonStrata.user)?.color.setTrait(
            CommonStrata.user,
            "colorPalette",
            DEFAULT_DIVERGING
          );
        }
      }
    } else if (
      colorMap instanceof EnumColorMap &&
      QUALITATIVE_SCALES.includes(colorPaletteWithDefault)
    ) {
      if (
        this.tableStyle.colorTraits.enumColors &&
        this.tableStyle.colorTraits.enumColors.length > 0
      ) {
        this.colorSchemeType = "custom-qualitative";
      } else {
        this.colorSchemeType = "qualitative";
        if (!colorPalette) {
          this.getTableStyleTraits(CommonStrata.user)?.color.setTrait(
            CommonStrata.user,
            "colorPalette",
            DEFAULT_QUALITATIVE
          );
        }
      }
    }
  }

  /** Handle change on colorType - this is called by the "Type" selectable dimension in `this.colorSchemeSelectableDim` */
  @action setColorSchemeType(
    stratumId: string,
    id: ColorSchemeType | string | undefined
  ) {
    if (!id) return;
    // Set `activeStyle` trait so the value doesn't change
    this.item.setTrait(stratumId, "activeStyle", this.tableStyle.id);

    // Hide any open bin
    this.openBinIndex.clear();

    // Here we use item.activeTableStyle.colorTraits.colorPalette instead of this.colorPalette because we only want this to be defined, if the trait is defined - we don't care about defaultColorPaletteName
    const colorPalette = this.tableStyle.colorTraits.colorPalette;

    // **Discrete color maps**
    // Reset bins
    if (id === "sequential-discrete" || id === "diverging-discrete") {
      this.colorSchemeType = id;
      this.getTableStyleTraits(stratumId)?.color.setTrait(
        stratumId,
        "mapType",
        "bin"
      );
      this.getTableStyleTraits(stratumId)?.color.setTrait(
        stratumId,
        "binColors",
        []
      );

      // Set numberOfBins according to limits of sequential and diverging color scales:
      // - Sequential is [3,9]
      // - Diverging is [3,11]

      // If numberOfBins is 0 - set to sensible default (7)
      if (this.tableStyle.colorTraits.numberOfBins === 0) {
        this.getTableStyleTraits(stratumId)?.color.setTrait(
          stratumId,
          "numberOfBins",
          7
        );
      } else if (
        id === "sequential-discrete" &&
        this.tableStyle.tableColorMap.binColors.length > 9
      ) {
        this.getTableStyleTraits(stratumId)?.color.setTrait(
          stratumId,
          "numberOfBins",
          9
        );
      } else if (
        id === "diverging-discrete" &&
        this.tableStyle.tableColorMap.binColors.length > 11
      ) {
        this.getTableStyleTraits(stratumId)?.color.setTrait(
          stratumId,
          "numberOfBins",
          11
        );
      } else if (this.tableStyle.tableColorMap.binColors.length < 3) {
        this.getTableStyleTraits(stratumId)?.color.setTrait(
          stratumId,
          "numberOfBins",
          3
        );
      }

      // If no user stratum - reset bin maximums
      if (!this.tableStyle.colorTraits.strata.get(stratumId)?.binMaximums) {
        this.resetBinMaximums(stratumId);
      }
    }
    // **Continuous color maps**
    else if (id === "sequential-continuous" || id === "diverging-continuous") {
      this.colorSchemeType = id;
      this.getTableStyleTraits(stratumId)?.color.setTrait(
        stratumId,
        "mapType",
        "continuous"
      );
    }
    // **Qualitative (enum) color maps**
    else if (id === "qualitative") {
      this.colorSchemeType = id;
      this.getTableStyleTraits(stratumId)?.color.setTrait(
        stratumId,
        "mapType",
        "enum"
      );
      this.getTableStyleTraits(stratumId)?.color.setTrait(
        stratumId,
        "enumColors",
        []
      );
    }

    // **No style (constant) color maps**
    else if (id === "no-style") {
      this.colorSchemeType = id;
      this.getTableStyleTraits(stratumId)?.color.setTrait(
        stratumId,
        "mapType",
        "constant"
      );
    }

    // If the current colorPalette is incompatible with the selected type - change colorPalette to default for the selected type
    if (
      id === "sequential-continuous" &&
      (!colorPalette ||
        ![...SEQUENTIAL_SCALES, ...SEQUENTIAL_CONTINUOUS_SCALES].includes(
          colorPalette
        ))
    ) {
      this.getTableStyleTraits(stratumId)?.color.setTrait(
        stratumId,
        "colorPalette",
        DEFAULT_SEQUENTIAL
      );
    }
    if (
      id === "sequential-discrete" &&
      (!colorPalette || !SEQUENTIAL_SCALES.includes(colorPalette))
    ) {
      this.getTableStyleTraits(stratumId)?.color.setTrait(
        stratumId,
        "colorPalette",
        DEFAULT_SEQUENTIAL
      );
    }
    if (
      (id === "diverging-continuous" || id === "diverging-discrete") &&
      (!colorPalette || !DIVERGING_SCALES.includes(colorPalette))
    ) {
      this.getTableStyleTraits(stratumId)?.color.setTrait(
        stratumId,
        "colorPalette",
        DEFAULT_DIVERGING
      );
    }
    if (
      id === "qualitative" &&
      (!colorPalette || !QUALITATIVE_SCALES.includes(colorPalette))
    ) {
      this.getTableStyleTraits(stratumId)?.color.setTrait(
        stratumId,
        "colorPalette",
        DEFAULT_QUALITATIVE
      );
    }
  }

  /** Show advances options
   * - Show all column types in "Data" select
   * - Show "Data type (advanced)" select. This allow user to change column type */
  @observable showAdvancedOptions: boolean = false;

  @computed get hasCesiumDataSource() {
    return !!this.item.mapItems.find(
      (d) => isDataSource(d) && d.entities.values.length > 0
    );
  }

  @computed get hasProtomapsImageryProvider() {
    return !!this.item.mapItems.find(
      (d) =>
        ImageryParts.is(d) &&
        d.imageryProvider instanceof ProtomapsImageryProvider
    );
  }

  /** Table Style dimensions:
   * - Dataset (Table models in workbench)
   * - Variable (Table style in model)
   * - TableColumn type (advanced only)
   */
  @computed get tableStyleSelectableDim(): SelectableDimensionWorkflowGroup {
    // Show point style options if current catalog item has any points showing (or uses ProtomapsImageryProvider)
    const showPointStyles =
      this.hasCesiumDataSource || this.hasProtomapsImageryProvider;

    // Show point size options if current catalog item has points and any scalar columns
    const showPointSize =
      this.hasCesiumDataSource &&
      (this.tableStyle.pointSizeColumn ||
        this.item.tableColumns.find((t) => t.type === TableColumnType.scalar));

    // Show label style options if current catalog item has points
    const showLabelStyles = this.hasCesiumDataSource;

    // Show trail style options if current catalog item has time-series points
    const showTrailStyles =
      this.hasCesiumDataSource && this.tableStyle.isTimeVaryingPointsWithId();

    return {
      type: "group",
      id: "data",

      name: i18next.t("models.tableStyling.data.name"),
      selectableDimensions: filterOutUndefined([
        {
          type: "select",
          id: "dataset",

          name: i18next.t(
            "models.tableStyling.data.selectableDimensions.dataset.name"
          ),
          selectedId: this.item.uniqueId,

          // Find all workbench items which have TableStylingWorkflow
          options: this.item.terria.workbench.items
            .filter(
              (item) =>
                ViewingControls.is(item) &&
                item.viewingControls.find(
                  (control) => control.id === TableStylingWorkflow.type
                )
            )
            .map((item) => ({
              id: item.uniqueId,
              name: getName(item)
            })),
          setDimensionValue: (_stratumId, value) => {
            const item = this.item.terria.workbench.items.find(
              (i) => i.uniqueId === value
            );
            if (item && TableMixin.isMixedInto(item)) {
              // Trigger new TableStylingWorkflow
              if (
                item.viewingControls.find(
                  (control) => control.id === TableStylingWorkflow.type
                )
              ) {
                item.terria.selectableDimensionWorkflow =
                  new TableStylingWorkflow(item);
              }
            }
          }
        },
        {
          type: "select",
          id: "table-style",

          name: i18next.t(
            "models.tableStyling.data.selectableDimensions.tableStyle.name"
          ),
          selectedId: this.tableStyle.id,
          options: this.item.tableStyles.map((style) => ({
            id: style.id,
            name: style.title
          })),
          allowCustomInput: true,
          setDimensionValue: (stratumId, value) => {
            if (!this.item.tableStyles.find((style) => style.id === value)) {
              this.getTableStyleTraits(stratumId, value);
            }
            this.item.setTrait(stratumId, "activeStyle", value);
            // Note - the activeStyle reaction in TableStylingWorkflow.constructor handles all side effects
            // The reaction will call this.setColorSchemeTypeFromPalette()
          }
        },
        {
          type: "select",
          id: "table-style-type",

          name: i18next.t(
            "models.tableStyling.data.selectableDimensions.tableStyleType.name"
          ),
          selectedId: this.styleType,
          options: filterOutUndefined([
            {
              id: "fill",

              name: i18next.t(
                "models.tableStyling.data.selectableDimensions.tableStyleType.options.fill.name"
              )
            },
            showPointSize
              ? {
                  id: "point-size",

                  name: i18next.t(
                    "models.tableStyling.data.selectableDimensions.tableStyleType.options.pointSize.name"
                  )
                }
              : undefined,
            showPointStyles
              ? {
                  id: "point",

                  name: i18next.t(
                    "models.tableStyling.data.selectableDimensions.tableStyleType.options.point.name"
                  )
                }
              : undefined,
            {
              id: "outline",

              name: i18next.t(
                "models.tableStyling.data.selectableDimensions.tableStyleType.options.outline.name"
              )
            },
            showLabelStyles
              ? {
                  id: "label",

                  name: i18next.t(
                    "models.tableStyling.data.selectableDimensions.tableStyleType.options.label.name"
                  )
                }
              : undefined,
            showTrailStyles
              ? {
                  id: "trail",

                  name: i18next.t(
                    "models.tableStyling.data.selectableDimensions.tableStyleType.options.trail.name"
                  )
                }
              : undefined
          ]),
          setDimensionValue: (_stratumId, value) => {
            if (
              value === "fill" ||
              value === "point-size" ||
              value === "point" ||
              value === "outline" ||
              value === "trail" ||
              value === "label"
            )
              this.styleType = value;
          }
        }
      ])
    };
  }

  /** List of color schemes available for given `colorSchemeType` */
  @computed get colorSchemesForType() {
    const type = this.colorSchemeType;
    if (!isDefined(type)) return [];

    if (type === "sequential-continuous")
      return [...SEQUENTIAL_SCALES, ...SEQUENTIAL_CONTINUOUS_SCALES];
    if (type === "sequential-discrete") return SEQUENTIAL_SCALES;
    if (type === "diverging-discrete" || type === "diverging-continuous")
      return DIVERGING_SCALES;
    if (type === "qualitative") return QUALITATIVE_SCALES;

    return [];
  }

  /** Color scheme dimensions:
   * - Type (see `this.colorSchemeType`)
   * - Color scheme (see `this.colorSchemesForType`)
   * - Number of bins (for discrete)
   */
  @computed get colorSchemeSelectableDim(): SelectableDimensionWorkflowGroup {
    return {
      type: "group",
      id: "fill",

      name: i18next.t("models.tableStyling.fill.name"),
      selectableDimensions: filterOutUndefined([
        // Show "Variable" selector to pick colorColumn if tableStyle ID is different from colorColumn ID
        // OR if we are in advanced mode
        this.tableStyle.id !== this.tableStyle.colorColumn?.name ||
        this.showAdvancedOptions
          ? {
              type: "select",
              id: "table-color-column",

              name: i18next.t(
                "models.tableStyling.fill.selectableDimensions.tableColorColumn.name"
              ),
              selectedId: this.tableStyle.colorColumn?.name,
              options: this.item.tableColumns.map((col) => ({
                id: col.name,
                name: col.title
              })),
              setDimensionValue: (stratumId, value) => {
                // Make sure `activeStyle` is set, otherwise it may change when we change `colorColumn`
                this.item.setTrait(
                  stratumId,
                  "activeStyle",
                  this.tableStyle.id
                );
                const prevColumnType = this.tableStyle.colorColumn?.type;
                this.getTableStyleTraits(stratumId)?.color.setTrait(
                  stratumId,
                  "colorColumn",
                  value
                );
                const newColumnType = this.tableStyle.colorColumn?.type;
                // Reset color palette and color scheme type if color column type has changed
                // For example, if the color column type changes from `scalar` to `enum` - we don't want to still have a `scalar` color palette
                if (prevColumnType !== newColumnType) {
                  this.tableStyle.colorTraits.setTrait(
                    stratumId,
                    "colorPalette",
                    undefined
                  );
                  this.setColorSchemeTypeFromPalette();
                }
              }
            }
          : undefined,
        this.showAdvancedOptions
          ? {
              type: "select",
              id: "data-type",

              name: i18next.t(
                "models.tableStyling.fill.selectableDimensions.dataType.name"
              ),
              options: Object.keys(TableColumnType)
                .filter((type) => type.length > 1)
                .map((colType) => ({ id: colType })),
              selectedId: isDefined(this.tableStyle.colorColumn?.type)
                ? TableColumnType[this.tableStyle.colorColumn!.type]
                : undefined,
              setDimensionValue: (stratumId, id) => {
                this.getTableColumnTraits(stratumId)?.setTrait(
                  stratumId,
                  "type",
                  id
                );
                this.setColorSchemeTypeFromPalette();
              }
            }
          : undefined,
        this.tableStyle.colorColumn
          ? {
              type: "select",
              id: "type",

              name: i18next.t(
                "models.tableStyling.fill.selectableDimensions.type.name"
              ),

              undefinedLabel: i18next.t(
                "models.tableStyling.fill.selectableDimensions.type.undefinedLabel"
              ),
              options: filterOutUndefined([
                {
                  id: "no-style",

                  name: i18next.t(
                    "models.tableStyling.fill.selectableDimensions.type.options.noStyle.name"
                  )
                },
                ...(this.tableStyle.colorColumn.type === TableColumnType.scalar
                  ? [
                      {
                        id: "sequential-continuous",

                        name: i18next.t(
                          "models.tableStyling.fill.selectableDimensions.type.options.sequentialContinuous.name"
                        )
                      },
                      {
                        id: "sequential-discrete",

                        name: i18next.t(
                          "models.tableStyling.fill.selectableDimensions.type.options.sequentialDiscrete.name"
                        )
                      },
                      {
                        id: "diverging-continuous",

                        name: i18next.t(
                          "models.tableStyling.fill.selectableDimensions.type.options.divergingContinuous.name"
                        )
                      },
                      {
                        id: "diverging-discrete",

                        name: i18next.t(
                          "models.tableStyling.fill.selectableDimensions.type.options.divergingDiscrete.name"
                        )
                      }
                    ]
                  : []),
                {
                  id: "qualitative",

                  name: i18next.t(
                    "models.tableStyling.fill.selectableDimensions.type.options.qualitative.name"
                  )
                },
                // Add options for "custom" color palettes if we are in "custom-qualitative" or "custom-discrete" mode
                this.colorSchemeType === "custom-qualitative"
                  ? {
                      id: "custom-qualitative",

                      name: i18next.t(
                        "models.tableStyling.fill.selectableDimensions.type.options.customQualitative.name"
                      )
                    }
                  : undefined,
                this.colorSchemeType === "custom-discrete"
                  ? {
                      id: "custom-discrete",

                      name: i18next.t(
                        "models.tableStyling.fill.selectableDimensions.type.options.customDiscrete.name"
                      )
                    }
                  : undefined
              ]),
              selectedId: this.colorSchemeType,
              setDimensionValue: (stratumId, id) => {
                this.setColorSchemeType(stratumId, id);
              }
            }
          : undefined,

        {
          type: "select",
          id: "scheme",

          name: i18next.t(
            "models.tableStyling.fill.selectableDimensions.scheme.name"
          ),

          selectedId:
            this.tableStyle.colorTraits.colorPalette ??
            this.tableStyle.tableColorMap.defaultColorPaletteName,
          options: this.colorSchemesForType.map((style) => ({
            id: style
          })),
          optionRenderer:
            this.colorSchemeType === "qualitative"
              ? QualitativeColorSchemeOptionRenderer
              : QuantitativeColorSchemeOptionRenderer(
                  this.colorSchemeType === "sequential-discrete" ||
                    this.colorSchemeType === "diverging-discrete"
                    ? this.tableStyle.tableColorMap.binColors.length
                    : undefined
                ),
          setDimensionValue: (stratumId, id) => {
            this.getTableStyleTraits(stratumId)?.color.setTrait(
              stratumId,
              "colorPalette",
              id
            );
            this.getTableStyleTraits(stratumId)?.color.setTrait(
              stratumId,
              "binColors",
              []
            );
            this.getTableStyleTraits(stratumId)?.color.setTrait(
              stratumId,
              "enumColors",
              []
            );
          }
        },
        // Show "Number of Bins" if in discrete mode
        this.colorSchemeType === "sequential-discrete" ||
        this.colorSchemeType === "diverging-discrete"
          ? {
              type: "numeric",
              id: "number-of-bins",

              name: i18next.t(
                "models.tableStyling.fill.selectableDimensions.numberOfBins.name"
              ),
              allowUndefined: true,
              min:
                // Sequential and diverging color scales must have at least 3 bins
                this.colorSchemeType === "sequential-discrete" ||
                this.colorSchemeType === "diverging-discrete"
                  ? 3
                  : // Custom color scales only need at least 1
                    1,
              max:
                // Sequential discrete color scales support up to 9 bins
                this.colorSchemeType === "sequential-discrete"
                  ? 9
                  : // Diverging discrete color scales support up to 11 bins
                  this.colorSchemeType === "diverging-discrete"
                  ? 11
                  : // Custom discrete color scales can be any number of bins
                    undefined,
              value: this.tableStyle.colorTraits.numberOfBins,
              setDimensionValue: (stratumId, value) => {
                if (!isDefined(value)) return;
                this.getTableStyleTraits(stratumId)?.color.setTrait(
                  stratumId,
                  "numberOfBins",
                  value
                );

                this.resetBinMaximums(stratumId);
              }
            }
          : undefined
      ])
    };
  }

  @computed get minimumValueSelectableDim(): SelectableDimensionNumeric {
    return {
      type: "numeric",
      id: "min",

      name: i18next.t("models.tableStyling.min.name"),
      max: this.tableStyle.tableColorMap.maximumValue,
      value: this.tableStyle.tableColorMap.minimumValue,
      setDimensionValue: (stratumId, value) => {
        this.getTableStyleTraits(stratumId)?.color.setTrait(
          stratumId,
          "minimumValue",
          value
        );
        if (
          this.colorSchemeType === "sequential-discrete" ||
          this.colorSchemeType === "diverging-discrete" ||
          this.colorSchemeType === "custom-discrete"
        ) {
          this.setBinMaximums(stratumId);
        }
      }
    };
  }

  /** Display range dimensions:
   * - Minimum value
   * - Maximum value
   */
  @computed get displayRangeDim(): SelectableDimensionWorkflowGroup {
    return {
      type: "group",
      id: "display-range",

      name: i18next.t("models.tableStyling.displayRange.name"),
      isOpen: false,
      selectableDimensions: filterOutUndefined([
        this.minimumValueSelectableDim,
        {
          type: "numeric",
          id: "max",

          name: i18next.t(
            "models.tableStyling.displayRange.selectableDimensions.max.name"
          ),
          min: this.tableStyle.tableColorMap.minimumValue,
          value: this.tableStyle.tableColorMap.maximumValue,
          setDimensionValue: (stratumId, value) => {
            this.getTableStyleTraits(stratumId)?.color.setTrait(
              stratumId,
              "maximumValue",
              value
            );
          }
        },
        this.item.outlierFilterDimension
      ])
    };
  }

  /** Group to show bins with color, start/stop numbers.
   */
  @computed get binColorDims(): SelectableDimensionWorkflowGroup {
    return {
      type: "group",
      id: "bins",

      name: i18next.t("models.tableStyling.bins.name"),
      isOpen: false,
      selectableDimensions: [
        ...this.tableStyle.tableColorMap.binMaximums
          .map(
            (bin, idx) =>
              ({
                type: "group",
                id: `bin-${idx}-start`,
                name: getColorPreview(
                  this.tableStyle.tableColorMap.binColors[idx] ?? "#aaa",
                  i18next.t(
                    "models.tableStyling.bins.selectableDimensions.start.name",
                    {
                      value1:
                        idx === 0
                          ? this.minimumValueSelectableDim.value
                          : this.tableStyle.tableColorMap.binMaximums[idx - 1],
                      value2: bin
                    }
                  )
                ),
                isOpen: this.openBinIndex.get("fill") === idx,
                onToggle: (open) => {
                  if (open && this.openBinIndex.get("fill") !== idx) {
                    runInAction(() => this.openBinIndex.set("fill", idx));
                    return true;
                  }
                },
                selectableDimensions: [
                  {
                    type: "color",
                    id: `bin-${idx}-color`,

                    name: i18next.t(
                      "models.tableStyling.bins.selectableDimensions.start.selectableDimensions.color.name"
                    ),
                    value: this.tableStyle.tableColorMap.binColors[idx],
                    setDimensionValue: (stratumId, value) => {
                      const binColors = [
                        ...this.tableStyle.tableColorMap.binColors
                      ];
                      if (isDefined(value)) binColors[idx] = value;
                      this.getTableStyleTraits(stratumId)?.color.setTrait(
                        stratumId,
                        "binColors",
                        binColors
                      );
                      this.colorSchemeType = "custom-discrete";
                    }
                  },
                  idx === 0
                    ? this.minimumValueSelectableDim
                    : {
                        type: "numeric",
                        id: `bin-${idx}-start`,

                        name: i18next.t(
                          "models.tableStyling.bins.selectableDimensions.start.selectableDimensions.start.name"
                        ),
                        value:
                          this.tableStyle.tableColorMap.binMaximums[idx - 1],
                        setDimensionValue: (stratumId, value) => {
                          const binMaximums = [
                            ...this.tableStyle.tableColorMap.binMaximums
                          ];
                          if (isDefined(value)) binMaximums[idx - 1] = value;
                          this.setBinMaximums(stratumId, binMaximums);
                        }
                      },
                  {
                    type: "numeric",
                    id: `bin-${idx}-stop`,

                    name: i18next.t(
                      "models.tableStyling.bins.selectableDimensions.start.selectableDimensions.stop.name"
                    ),
                    value: bin,
                    setDimensionValue: (stratumId, value) => {
                      const binMaximums = [
                        ...this.tableStyle.tableColorMap.binMaximums
                      ];
                      if (isDefined(value)) binMaximums[idx] = value;
                      this.setBinMaximums(stratumId, binMaximums);
                    }
                  }
                ]
              } as SelectableDimensionGroup)
          )
          .reverse() // Reverse array of bins to match Legend (descending order)
      ]
    };
  }

  /** Groups to show enum "bins" with colors and value */
  @computed get enumColorDims(): SelectableDimensionWorkflowGroup {
    return {
      type: "group",
      id: "colors",

      name: i18next.t("models.tableStyling.colors.name"),
      isOpen: false,
      selectableDimensions: filterOutUndefined([
        ...this.tableStyle.tableColorMap.enumColors.map((enumCol, idx) => {
          if (!enumCol.value) return;
          const dims: SelectableDimensionGroup = {
            type: "group",
            id: `enum-${idx}-start`,
            name: getColorPreview(enumCol.color ?? "#aaa", enumCol.value),
            isOpen: this.openBinIndex.get("fill") === idx,
            onToggle: (open) => {
              if (open && this.openBinIndex.get("fill") !== idx) {
                runInAction(() => this.openBinIndex.set("fill", idx));
                return true;
              }
            },
            selectableDimensions: [
              {
                type: "color",
                id: `enum-${idx}-color`,

                name: i18next.t(
                  "models.tableStyling.colors.selectableDimensions.color.name"
                ),
                value: enumCol.color,
                setDimensionValue: (stratumId, value) => {
                  this.colorSchemeType = "custom-qualitative";
                  this.setEnumColorTrait(stratumId, idx, enumCol.value, value);
                }
              },
              {
                type: "select",
                id: `enum-${idx}-value`,

                name: i18next.t(
                  "models.tableStyling.colors.selectableDimensions.value.name"
                ),
                selectedId: enumCol.value,
                // Find unique column values which don't already have an enumCol
                // We prepend the current enumCol.value
                options: [
                  { id: enumCol.value },
                  ...(this.tableStyle.colorColumn?.uniqueValues.values
                    ?.filter(
                      (value) =>
                        !this.tableStyle.tableColorMap.enumColors.find(
                          (enumCol) => enumCol.value === value
                        )
                    )
                    .map((id) => ({ id })) ?? [])
                ],
                setDimensionValue: (stratumId, value) => {
                  this.colorSchemeType = "custom-qualitative";
                  this.setEnumColorTrait(stratumId, idx, value, enumCol.color);
                }
              },
              {
                type: "button",
                id: `enum-${idx}-remove`,

                value: i18next.t(
                  "models.tableStyling.colors.selectableDimensions.remove.value"
                ),
                setDimensionValue: (stratumId) => {
                  this.colorSchemeType = "custom-qualitative";
                  // Remove element by clearing `value`
                  this.setEnumColorTrait(stratumId, idx, undefined, undefined);
                }
              }
            ]
          };
          return dims;
        }),

        // Are there more colors to add (are there more unique values in the column than enumCols)
        // Create "Add" to user can add more
        this.tableStyle.colorColumn &&
        this.tableStyle.tableColorMap.enumColors.filter((col) => col.value)
          .length < this.tableStyle.colorColumn?.uniqueValues.values.length
          ? {
              type: "button",
              id: `enum-add`,

              value: i18next.t(
                "models.tableStyling.colors.selectableDimensions.add.value"
              ),
              setDimensionValue: (stratumId) => {
                this.colorSchemeType = "custom-qualitative";
                const firstValue =
                  this.tableStyle.colorColumn?.uniqueValues.values.find(
                    (value) =>
                      !this.tableStyle.tableColorMap.enumColors.find(
                        (col) => col.value === value
                      )
                  );
                if (!isDefined(firstValue)) return;

                // Can we find any unused colors in the colorPalette
                const unusedColor = this.tableStyle.tableColorMap
                  .colorScaleCategorical(
                    this.tableStyle.tableColorMap.enumColors.length + 1
                  )
                  .find(
                    (col) =>
                      !this.tableStyle.tableColorMap.enumColors.find(
                        (enumColor) => enumColor.color === col
                      )
                  );

                this.setEnumColorTrait(
                  stratumId,
                  this.tableStyle.tableColorMap.enumColors.length,
                  firstValue,
                  unusedColor ?? "#000000"
                );

                this.openBinIndex.set(
                  "fill",
                  this.tableStyle.tableColorMap.enumColors.length - 1
                );
              }
            }
          : undefined
      ])
    };
  }

  @computed get nullColorDimension(): SelectableDimensionColor {
    return {
      type: "color",
      id: `null-color`,

      name: i18next.t("models.tableStyling.nullColor.name"),
      value: this.tableStyle.colorTraits.nullColor,
      allowUndefined: true,
      setDimensionValue: (stratumId, value) => {
        this.getTableStyleTraits(stratumId)?.color.setTrait(
          stratumId,
          "nullColor",
          value
        );
      }
    };
  }

  @computed get outlierColorDimension(): SelectableDimensionColor {
    return {
      type: "color",
      id: `outlier-color`,

      name: i18next.t("models.tableStyling.outlierColor.name"),
      allowUndefined: true,
      value:
        this.tableStyle.colorTraits.outlierColor ??
        this.tableStyle.tableColorMap.outlierColor?.toCssHexString(),
      setDimensionValue: (stratumId, value) => {
        this.getTableStyleTraits(stratumId)?.color.setTrait(
          stratumId,
          "outlierColor",
          value
        );
      }
    };
  }

  /** Misc table style color dimensions:
   * - Region color
   * - Null color
   * - Outlier color
   */
  @computed get additionalColorDimensions(): SelectableDimensionGroup {
    return {
      type: "group",
      id: "additional-colors",

      name: i18next.t("models.tableStyling.additionalColors.name"),
      // Open group by default is no activeStyle is selected
      isOpen: !this.item.activeStyle || this.colorSchemeType === "no-style",
      selectableDimensions: filterOutUndefined([
        this.tableStyle.colorColumn?.type === TableColumnType.region
          ? {
              type: "color",
              id: `region-color`,

              name: i18next.t(
                "models.tableStyling.additionalColors.selectableDimensions.regionColor.name"
              ),
              value: this.tableStyle.colorTraits.regionColor,
              allowUndefined: true,
              setDimensionValue: (stratumId, value) => {
                this.getTableStyleTraits(stratumId)?.color.setTrait(
                  stratumId,
                  "regionColor",
                  value
                );
              }
            }
          : {
              type: "color",
              id: `null-color`,

              name: i18next.t(
                "models.tableStyling.additionalColors.selectableDimensions.nullColor.name"
              ),
              value: this.tableStyle.colorTraits.nullColor,
              allowUndefined: true,
              setDimensionValue: (stratumId, value) => {
                this.getTableStyleTraits(stratumId)?.color.setTrait(
                  stratumId,
                  "nullColor",
                  value
                );
              }
            },
        this.tableStyle.colorColumn?.type === TableColumnType.scalar
          ? {
              type: "color",
              id: `outlier-color`,

              name: i18next.t(
                "models.tableStyling.additionalColors.selectableDimensions.outlierColor.name"
              ),
              allowUndefined: true,
              value:
                this.tableStyle.colorTraits.outlierColor ??
                this.tableStyle.tableColorMap.outlierColor?.toCssHexString(),
              setDimensionValue: (stratumId, value) => {
                this.getTableStyleTraits(stratumId)?.color.setTrait(
                  stratumId,
                  "outlierColor",
                  value
                );
              }
            }
          : undefined
      ])
    };
  }

  @computed get pointSizeDimensions(): SelectableDimensionGroup {
    return {
      type: "group",
      id: "point-size",

      name: i18next.t("models.tableStyling.pointSize.name"),
      isOpen: true,
      selectableDimensions: [
        {
          type: "select",
          id: `point-size-column`,

          name: i18next.t(
            "models.tableStyling.pointSize.selectableDimensions.pointSizeColumn.name"
          ),
          selectedId: this.tableStyle.pointSizeTraits.pointSizeColumn,
          options: this.item.tableColumns
            .filter((col) => col.type === TableColumnType.scalar)
            .map((col) => ({
              id: col.name,
              name: col.title
            })),
          allowUndefined: true,
          setDimensionValue: (stratumId, value) => {
            this.getTableStyleTraits(stratumId)?.pointSize.setTrait(
              stratumId,
              "pointSizeColumn",
              value
            );
          }
        },
        ...((this.tableStyle.pointSizeColumn
          ? [
              {
                type: "numeric",
                id: "point-size-null",

                name: i18next.t(
                  "models.tableStyling.pointSize.selectableDimensions.pointSizeNull.name"
                ),
                min: 0,
                value: this.tableStyle.pointSizeTraits.nullSize,
                setDimensionValue: (stratumId, value) => {
                  this.getTableStyleTraits(stratumId)?.pointSize.setTrait(
                    stratumId,
                    "nullSize",
                    value
                  );
                }
              },
              {
                type: "numeric",
                id: "point-sizes-factor",

                name: i18next.t(
                  "models.tableStyling.pointSize.selectableDimensions.pointSizesFactor.name"
                ),
                min: 0,
                value: this.tableStyle.pointSizeTraits.sizeFactor,
                setDimensionValue: (stratumId, value) => {
                  this.getTableStyleTraits(stratumId)?.pointSize.setTrait(
                    stratumId,
                    "sizeFactor",
                    value
                  );
                }
              },
              {
                type: "numeric",
                id: "point-size-offset",

                name: i18next.t(
                  "models.tableStyling.pointSize.selectableDimensions.pointSizeOffset.name"
                ),
                min: 0,
                value: this.tableStyle.pointSizeTraits.sizeOffset,
                setDimensionValue: (stratumId, value) => {
                  this.getTableStyleTraits(stratumId)?.pointSize.setTrait(
                    stratumId,
                    "sizeOffset",
                    value
                  );
                }
              }
            ]
          : []) as SelectableDimensionNumeric[])
      ]
    };
  }

  /** Advanced region mapping - pulled from TableMixin.regionColumnDimensions and TableMixin.regionProviderDimensions
   */
  @computed
  get advancedRegionMappingDimensions(): SelectableDimensionWorkflowGroup {
    return {
      type: "group",
      id: "region-mapping",

      name: i18next.t("models.tableStyling.regionMapping.name"),
      isOpen: false,
      selectableDimensions: filterOutUndefined([
        this.item.regionColumnDimensions,
        this.item.regionProviderDimensions
      ])
    };
  }

  /** Advanced table dimensions:
   * - Legend (title, ticks, item titles...)
   * - Style options (title, lat/lon columns)
   * - Time options (column, id columns, spread start/finish time, ...)
   * - Workbench options (show style selector, show disable style/time in workbench, ...)
   * - Variable/Column options (title, units)
   */
  @computed
  get advancedTableDimensions(): SelectableDimensionWorkflowGroup[] {
    return [
      {
        type: "group",
        id: "legend",

        name: i18next.t("models.tableStyling.legend.name"),
        isOpen: false,
        selectableDimensions: filterOutUndefined([
          {
            type: "text",
            id: "legend-title",

            name: i18next.t(
              "models.tableStyling.legend.selectableDimensions.legendTitle.name"
            ),
            value: this.tableStyle.colorTraits.legend.title,
            setDimensionValue: (stratumId, value) => {
              this.getTableStyleTraits(stratumId)?.color.legend.setTrait(
                stratumId,
                "title",
                value
              );
            }
          },
          this.colorSchemeType === "diverging-continuous" ||
          this.colorSchemeType === "sequential-continuous"
            ? {
                type: "numeric",
                id: "legend-ticks",

                name: i18next.t(
                  "models.tableStyling.legend.selectableDimensions.legendTicks.name"
                ),
                min: 2,
                value: this.tableStyle.colorTraits.legendTicks,
                setDimensionValue: (stratumId, value) => {
                  this.getTableStyleTraits(stratumId)?.color.setTrait(
                    stratumId,
                    "legendTicks",
                    value
                  );
                }
              }
            : undefined,

          ...this.tableStyle.colorTraits.legend.items.map(
            (legendItem, idx) =>
              ({
                type: "text",
                id: `legend-${idx}-title`,
                name: i18next.t(
                  "models.tableStyling.legend.selectableDimensions.title.name",
                  { index: idx + 1 }
                ),
                value: legendItem.title,
                setDimensionValue: (stratumId, value) => {
                  legendItem.setTrait(stratumId, "title", value);
                }
              } as SelectableDimensionText)
          )
        ])
      },
      {
        type: "group",
        id: "style-options",

        name: i18next.t("models.tableStyling.styleOptions.name"),
        isOpen: false,
        selectableDimensions: filterOutUndefined([
          {
            type: "text",
            id: "style-title",

            name: i18next.t(
              "models.tableStyling.styleOptions.selectableDimensions.styleTitle.name"
            ),
            value: this.tableStyle.title,
            setDimensionValue: (stratumId, value) => {
              this.getTableStyleTraits(stratumId)?.setTrait(
                stratumId,
                "title",
                value
              );
            }
          },
          {
            type: "select",
            id: "longitude-column",

            name: i18next.t(
              "models.tableStyling.styleOptions.selectableDimensions.longitudeColumn.name"
            ),
            selectedId: this.tableStyle.longitudeColumn?.name,
            allowUndefined: true,
            options: this.item.tableColumns.map((col) => ({
              id: col.name,
              name: col.title
            })),
            setDimensionValue: (stratumId, value) => {
              this.getTableStyleTraits(stratumId)?.setTrait(
                stratumId,
                "longitudeColumn",
                value
              );
            }
          },
          {
            type: "select",
            id: "latitude-column",

            name: i18next.t(
              "models.tableStyling.styleOptions.selectableDimensions.latitudeColumn.name"
            ),
            selectedId: this.tableStyle.latitudeColumn?.name,
            allowUndefined: true,
            options: this.item.tableColumns.map((col) => ({
              id: col.name,
              name: col.title
            })),
            setDimensionValue: (stratumId, value) => {
              this.getTableStyleTraits(stratumId)?.setTrait(
                stratumId,
                "latitudeColumn",
                value
              );
            }
          }
        ])
      },
      {
        type: "group",
        id: "time-options",

        name: i18next.t("models.tableStyling.timeOptions.name"),
        isOpen: false,
        selectableDimensions: filterOutUndefined([
          {
            type: "select",
            id: "table-time-column",

            name: i18next.t(
              "models.tableStyling.timeOptions.selectableDimensions.tableTimeColumn.name"
            ),
            selectedId: this.tableStyle.timeColumn?.name,
            allowUndefined: true,
            options: this.item.tableColumns.map((col) => ({
              id: col.name,
              name: col.title
            })),
            setDimensionValue: (stratumId, value) => {
              this.getTableStyleTraits(stratumId)?.time.setTrait(
                stratumId,
                "timeColumn",
                value
              );
            }
          },
          {
            type: "select",
            id: "table-end-time-column",

            name: i18next.t(
              "models.tableStyling.timeOptions.selectableDimensions.tableEndTimeColumn.name"
            ),
            selectedId: this.tableStyle.endTimeColumn?.name,
            allowUndefined: true,
            options: this.item.tableColumns.map((col) => ({
              id: col.name,
              name: col.title
            })),
            setDimensionValue: (stratumId, value) => {
              this.getTableStyleTraits(stratumId)?.time.setTrait(
                stratumId,
                "endTimeColumn",
                value
              );
            }
          },

          {
            type: "select-multi",
            id: "table-time-id-columns",

            name: i18next.t(
              "models.tableStyling.timeOptions.selectableDimensions.tableTimeIdColumns.name"
            ),
            selectedIds: this.tableStyle.idColumns?.map((c) => c.name),
            allowUndefined: true,
            options: this.item.tableColumns.map((col) => ({
              id: col.name,
              name: col.title
            })),
            setDimensionValue: (stratumId, value) => {
              this.getTableStyleTraits(stratumId)?.time.setTrait(
                stratumId,
                "idColumns",
                value
              );
            }
          },
          {
            type: "checkbox",
            id: "table-time-is-sampled",

            name: i18next.t(
              "models.tableStyling.timeOptions.selectableDimensions.tableTimeIsSampled.name"
            ),
            options: [
              {
                id: "true",
                name: i18next.t(
                  "models.tableStyling.timeOptions.selectableDimensions.tableTimeIsSampled.options.true.name"
                )
              },

              {
                id: "false",
                name: i18next.t(
                  "models.tableStyling.timeOptions.selectableDimensions.tableTimeIsSampled.options.false.name"
                )
              }
            ],
            selectedId: this.tableStyle.isSampled ? "true" : "false",
            setDimensionValue: (stratumId, value) => {
              this.getTableStyleTraits(stratumId)?.time.setTrait(
                stratumId,
                "isSampled",
                value === "true"
              );
            }
          },
          {
            type: "numeric",
            id: `table-time-display-duration`,

            name: i18next.t(
              "models.tableStyling.timeOptions.selectableDimensions.tableTimeDisplayDuration.name"
            ),
            value: this.tableStyle.timeTraits.displayDuration,
            setDimensionValue: (stratumId, value) => {
              this.getTableStyleTraits(stratumId)?.time.setTrait(
                stratumId,
                "displayDuration",
                value
              );
            }
          },
          {
            type: "checkbox",
            id: "table-time-spread-start-time",

            name: i18next.t(
              "models.tableStyling.timeOptions.selectableDimensions.tableTimeSpreadStartTime.name"
            ),
            options: [
              {
                id: "true",
                name: i18next.t(
                  "models.tableStyling.timeOptions.selectableDimensions.tableTimeSpreadStartTime.options.true.name"
                )
              },

              {
                id: "false",
                name: i18next.t(
                  "models.tableStyling.timeOptions.selectableDimensions.tableTimeSpreadStartTime.options.false.name"
                )
              }
            ],
            selectedId: this.tableStyle.timeTraits.spreadStartTime
              ? "true"
              : "false",
            setDimensionValue: (stratumId, value) => {
              this.getTableStyleTraits(stratumId)?.time.setTrait(
                stratumId,
                "spreadStartTime",
                value === "true"
              );
            }
          },
          {
            type: "checkbox",
            id: "table-time-spread-finish-time",

            name: i18next.t(
              "models.tableStyling.timeOptions.selectableDimensions.tableTimeSpreadFinishTime.name"
            ),
            options: [
              {
                id: "true",
                name: i18next.t(
                  "models.tableStyling.timeOptions.selectableDimensions.tableTimeSpreadFinishTime.options.true.name"
                )
              },

              {
                id: "false",
                name: i18next.t(
                  "models.tableStyling.timeOptions.selectableDimensions.tableTimeSpreadFinishTime.options.false.name"
                )
              }
            ],
            selectedId: this.tableStyle.timeTraits.spreadFinishTime
              ? "true"
              : "false",
            setDimensionValue: (stratumId, value) => {
              this.getTableStyleTraits(stratumId)?.time.setTrait(
                stratumId,
                "spreadFinishTime",
                value === "true"
              );
            }
          }
        ])
      },
      {
        type: "group",
        id: "workbench-options",

        name: i18next.t("models.tableStyling.workbenchOptions.name"),
        isOpen: false,
        selectableDimensions: filterOutUndefined([
          {
            type: "checkbox",
            id: "table-style-enabled",

            name: i18next.t(
              "models.tableStyling.workbenchOptions.selectableDimensions.tableStyleEnalbed.name"
            ),
            options: [
              {
                id: "true",
                name: i18next.t(
                  "models.tableStyling.workbenchOptions.selectableDimensions.tableStyleEnalbed.options.true.name"
                )
              },

              {
                id: "false",
                name: i18next.t(
                  "models.tableStyling.workbenchOptions.selectableDimensions.tableStyleEnalbed.options.false.name"
                )
              }
            ],
            selectedId: this.item.activeTableStyle.hidden ? "false" : "true",
            setDimensionValue: (stratumId, value) => {
              this.getTableStyleTraits(stratumId)?.setTrait(
                stratumId,
                "hidden",
                value === "false"
              );
            }
          },
          {
            type: "checkbox",
            id: "show-disable-style-option",

            name: i18next.t(
              "models.tableStyling.workbenchOptions.selectableDimensions.showDisableStyleOption.name"
            ),
            options: [{ id: "true" }, { id: "false" }],
            selectedId: this.item.showDisableStyleOption ? "true" : "false",
            setDimensionValue: (stratumId, value) => {
              this.item.setTrait(
                stratumId,
                "showDisableStyleOption",
                value === "true"
              );
            }
          },
          {
            type: "checkbox",
            id: "show-disable-time-option",

            name: i18next.t(
              "models.tableStyling.workbenchOptions.selectableDimensions.showDisableTimeOption.name"
            ),
            options: [{ id: "true" }, { id: "false" }],
            selectedId: this.item.showDisableTimeOption ? "true" : "false",
            setDimensionValue: (stratumId, value) => {
              this.item.setTrait(
                stratumId,
                "showDisableTimeOption",
                value === "true"
              );
            }
          },
          {
            type: "checkbox",
            id: "enable-manual-region-mapping",

            name: i18next.t(
              "models.tableStyling.workbenchOptions.selectableDimensions.enableManualRegionMapping.name"
            ),
            options: [{ id: "true" }, { id: "false" }],
            selectedId: this.item.enableManualRegionMapping ? "true" : "false",
            setDimensionValue: (stratumId, value) => {
              this.item.setTrait(
                stratumId,
                "enableManualRegionMapping",
                value === "true"
              );
            }
          }
        ])
      },
      {
        type: "group",
        id: "variable-and-column",

        name: i18next.t("models.tableStyling.variableAndColumn.name"),
        isOpen: false,
        selectableDimensions: filterOutUndefined([
          {
            type: "text",
            id: "column-title",

            name: i18next.t(
              "models.tableStyling.variableAndColumn.selectableDimensions.columnTitle.name"
            ),
            value: this.tableStyle.colorColumn?.title,
            setDimensionValue: (stratumId, value) => {
              this.getTableColumnTraits(stratumId)?.setTrait(
                stratumId,
                "title",
                value
              );
            }
          },
          {
            type: "text",
            id: "column-units",

            name: i18next.t(
              "models.tableStyling.variableAndColumn.selectableDimensions.columnUnits.name"
            ),
            value: this.tableStyle.colorColumn?.units,
            setDimensionValue: (stratumId, value) => {
              this.getTableColumnTraits(stratumId)?.setTrait(
                stratumId,
                "units",
                value
              );
            }
          }
        ])
      }
    ];
  }

  getStyleDims<T extends ModelTraits>(
    title: string,
    key: StyleType,
    tableStyleMap: TableStyleMap<T>,
    getDims: (
      id: string,
      pointTraits: Model<T>,
      nullValues: T
    ) => FlatSelectableDimension[],
    getPreview: (point: T, nullValues: T, label: string) => string
  ): SelectableDimensionWorkflowGroup[] {
    const traits = tableStyleMap.commonTraits;
    if (!isDefined(traits)) return [];
    return filterOutUndefined([
      {
        type: "group",
        id: key,
        name: title,
        isOpen: true,
        selectableDimensions: filterOutUndefined([
          {
            type: "checkbox",
            id: `${key}-enabled`,
            options: [{ id: "true" }, { id: "false" }],
            selectedId: traits.enabled ? "true" : "false",
            setDimensionValue: (stratumId, value) => {
              traits.setTrait(stratumId, "enabled", value === "true");
            }
          },
          {
            type: "select",
            id: `${key}-column`,

            name: i18next.t(
              "models.tableStyling.style.selectableDimensions.column.name"
            ),
            selectedId: tableStyleMap.column?.name,
            allowUndefined: true,
            options: this.item.tableColumns.map((col) => ({
              id: col.name,
              name: col.title
            })),
            setDimensionValue: (stratumId, value) => {
              tableStyleMap.commonTraits.setTrait(stratumId, "column", value);
            }
          },
          tableStyleMap.column
            ? {
                type: "select",
                id: `${key}-style-type`,

                name: i18next.t(
                  "models.tableStyling.style.selectableDimensions.styleType.name"
                ),

                undefinedLabel: i18next.t(
                  "models.tableStyling.style.selectableDimensions.styleType.undefinedLabel"
                ),
                options: filterOutUndefined([
                  {
                    id: "constant",

                    name: i18next.t(
                      "models.tableStyling.style.selectableDimensions.styleType.constant.name"
                    )
                  },
                  tableStyleMap.column.type === TableColumnType.scalar
                    ? {
                        id: "bin",

                        name: i18next.t(
                          "models.tableStyling.style.selectableDimensions.styleType.bin.name"
                        )
                      }
                    : undefined,
                  {
                    id: "enum",

                    name: i18next.t(
                      "models.tableStyling.style.selectableDimensions.styleType.enum.name"
                    )
                  }
                ]),
                selectedId: traits.mapType ?? tableStyleMap.styleMap.type,
                setDimensionValue: (stratumId, id) => {
                  if (id === "bin" || id === "enum" || id === "constant")
                    traits.setTrait(stratumId, "mapType", id);
                }
              }
            : undefined
        ])
      },

      tableStyleMap.column &&
      (traits.mapType ?? tableStyleMap.styleMap.type) === "enum"
        ? {
            type: "group",
            id: `${key}-enum`,

            name: i18next.t(
              "models.tableStyling.style.selectableDimensions.enum.name"
            ),
            isOpen: true,
            selectableDimensions: filterOutUndefined([
              // eslint-disable-next-line no-unsafe-optional-chaining
              ...traits.enum?.map((enumPoint, idx) => {
                const dims: SelectableDimensionGroup = {
                  type: "group",
                  id: `${key}-enum-${idx}`,
                  name: getPreview(
                    tableStyleMap.traitValues.enum[idx],
                    tableStyleMap.traitValues.null,
                    tableStyleMap.commonTraits.enum[idx].value ??
                      i18next.t(
                        "models.tableStyling.style.selectableDimensions.enum.selectableDimensions.enum.noValue"
                      )
                  ),
                  isOpen: this.openBinIndex.get(key) === idx,
                  onToggle: (open) => {
                    if (open && this.openBinIndex.get(key) !== idx) {
                      runInAction(() => this.openBinIndex.set(key, idx));
                      return true;
                    }
                  },
                  selectableDimensions: [
                    {
                      type: "select",
                      id: `${key}-enum-${idx}-value`,

                      name: i18next.t(
                        "models.tableStyling.style.selectableDimensions.enum.selectableDimensions.enum.selectableDimensions.value.name"
                      ),
                      selectedId: enumPoint.value ?? undefined,
                      // Find unique column values which don't already have an enumCol
                      // We prepend the current enumCol.value
                      options: filterOutUndefined([
                        enumPoint.value ? { id: enumPoint.value } : undefined,
                        ...(tableStyleMap.column?.uniqueValues.values
                          ?.filter(
                            (value) =>
                              !traits.enum.find(
                                (enumCol) => enumCol.value === value
                              )
                          )
                          .map((id) => ({ id })) ?? [])
                      ]),
                      setDimensionValue: (stratumId, value) => {
                        enumPoint.setTrait(stratumId, "value", value);
                      }
                    },
                    ...getDims(
                      `${key}-enum-${idx}`,
                      tableStyleMap.traits.enum[idx] as any,
                      tableStyleMap.traitValues.null
                    ),

                    {
                      type: "button",
                      id: `${key}-enum-${idx}-remove`,

                      value: i18next.t(
                        "models.tableStyling.style.selectableDimensions.enum.selectableDimensions.enum.selectableDimensions.remove.value"
                      ),
                      setDimensionValue: (stratumId) => {
                        enumPoint.setTrait(stratumId, "value", null);
                      }
                    }
                  ]
                };
                return dims;
              }),
              // Are there more colors to add (are there more unique values in the column than enumCols)
              // Create "Add" to user can add more

              tableStyleMap.column?.uniqueValues.values.filter(
                (v) => !traits.enum?.find((col) => col.value === v)
              ).length > 0
                ? ({
                    type: "button",
                    id: `${key}-enum-add`,

                    value: i18next.t(
                      "models.tableStyling.style.selectableDimensions.enum.selectableDimensions.enum.add.value"
                    ),
                    setDimensionValue: (stratumId) => {
                      const firstValue =
                        tableStyleMap.column?.uniqueValues.values.find(
                          (value) =>
                            !traits.enum?.find((col) => col.value === value)
                        );
                      if (!isDefined(firstValue)) return;

                      const newModel = traits.addObject(stratumId, "enum");

                      if (newModel)
                        // Copy over values from null/default traitValues for new enum value
                        updateModelFromJson(newModel, stratumId, {
                          ...tableStyleMap.traitValues.null,
                          value: firstValue
                        }).logError("Error while adding `enum` item");

                      this.openBinIndex.set(key, traits.enum.length - 1);
                    }
                  } as SelectableDimensionButton)
                : undefined
            ])
          }
        : undefined,
      tableStyleMap.column &&
      (traits.mapType ?? tableStyleMap.styleMap.type) === "bin"
        ? {
            type: "group",
            id: `${key}-bin`,

            name: i18next.t(
              "models.tableStyling.style.selectableDimensions.bin.name"
            ),
            isOpen: true,
            selectableDimensions: filterOutUndefined([
              {
                type: "button",
                id: `${key}-bin-add`,

                value: i18next.t(
                  "models.tableStyling.style.selectableDimensions.bin.selectableDimensions.add.value"
                ),
                setDimensionValue: (stratumId) => {
                  const newModel = traits.addObject(stratumId, "bin");

                  if (newModel)
                    // Copy over values from null/default traitValues for new bin
                    updateModelFromJson(
                      newModel,
                      stratumId,
                      tableStyleMap.traitValues.null
                    ).logError("Error while adding `bin` item");
                  this.openBinIndex.set(key, traits.bin.length - 1);
                }
              } as SelectableDimensionButton,
              ...traits.bin
                .map((bin, idx) => {
                  const dims: SelectableDimensionGroup = {
                    type: "group",
                    id: `${key}-bin-${idx}`,
                    name: getPreview(
                      tableStyleMap.traitValues.bin[idx],
                      tableStyleMap.traitValues.null,
                      !isDefined(bin.maxValue ?? undefined)
                        ? i18next.t(
                            "models.tableStyling.style.selectableDimensions.bin.selectableDimensions.bin.noValue"
                          )
                        : idx > 0 &&
                          isDefined(traits.bin[idx - 1].maxValue ?? undefined)
                        ? i18next.t(
                            "models.tableStyling.style.selectableDimensions.bin.selectableDimensions.bin.range",
                            {
                              value1: traits.bin[idx - 1].maxValue,
                              value2: bin.maxValue
                            }
                          )
                        : `${bin.maxValue}`
                    ),

                    isOpen: this.openBinIndex.get(key) === idx,
                    onToggle: (open) => {
                      if (open && this.openBinIndex.get(key) !== idx) {
                        runInAction(() => this.openBinIndex.set(key, idx));
                        return true;
                      }
                    },
                    selectableDimensions: filterOutUndefined([
                      idx > 0
                        ? {
                            type: "numeric",
                            id: `${key}-bin-${idx}-start`,

                            name: i18next.t(
                              "models.tableStyling.style.selectableDimensions.bin.selectableDimensions.bin.selectableDimensions.start.name"
                            ),
                            value: traits.bin[idx - 1].maxValue ?? undefined,
                            setDimensionValue: (stratumId, value) => {
                              traits.bin[idx - 1].setTrait(
                                stratumId,
                                "maxValue",
                                value
                              );
                            }
                          }
                        : undefined,
                      {
                        type: "numeric",
                        id: `${key}-bin-${idx}-stop`,

                        name: i18next.t(
                          "models.tableStyling.style.selectableDimensions.bin.selectableDimensions.bin.selectableDimensions.stop.name"
                        ),
                        value: bin.maxValue ?? undefined,
                        setDimensionValue: (stratumId, value) => {
                          bin.setTrait(stratumId, "maxValue", value);
                        }
                      },
                      ...getDims(
                        `${key}-bin-${idx}`,
                        tableStyleMap.traits.bin[idx] as any,
                        tableStyleMap.traitValues.null
                      ),
                      {
                        type: "button",
                        id: `${key}-bin-${idx}-remove`,

                        value: i18next.t(
                          "models.tableStyling.style.selectableDimensions.bin.selectableDimensions.bin.selectableDimensions.remove.value"
                        ),
                        setDimensionValue: (stratumId) => {
                          bin.setTrait(stratumId, "maxValue", null);
                        }
                      }
                    ])
                  };
                  return dims;
                })
                .reverse() // Reverse to match legend order
            ])
          }
        : undefined,
      {
        type: "group",
        id: `${key}-null`,

        name: i18next.t("models.tableStyling.style.null.name"),
        isOpen:
          !tableStyleMap.column ||
          !traits.mapType ||
          traits.mapType === "constant",
        selectableDimensions: getDims(
          `${key}-null`,
          tableStyleMap.traits.null as any,
          tableStyleMap.traitValues.null
        )
      }
    ]);
  }

  @computed get markerDims(): SelectableDimensionWorkflowGroup[] {
    return this.getStyleDims(
      i18next.t("models.tableStyling.point.name"),
      "point",
      this.tableStyle.pointStyleMap,
      (id, pointTraits, nullValues) =>
        filterOutUndefined([
          // Only show marker selection if we have a Cesium data source
          this.hasCesiumDataSource
            ? {
                type: "select",
                id: `${id}-marker`,
                name: `<terriatooltip title="${i18next.t(
                  "models.tableStyling.point.selectableDimensions.marker.name"
                )}">${i18next.t(
                  "models.tableStyling.point.selectableDimensions.marker.tooltip"
                )}</terriatooltip>`,
                selectedId:
                  (pointTraits.marker ?? nullValues.marker) || "point",
                allowUndefined: true,
                allowCustomInput: true,
                options: [...allIcons, "point"].map((icon) => ({
                  id: icon
                })),
                optionRenderer: MarkerOptionRenderer,
                setDimensionValue: (stratumId, value) => {
                  pointTraits.setTrait(stratumId, "marker", value || "point");
                }
              }
            : undefined,

          // Only show rotation if we have a Cesium data source
          this.hasCesiumDataSource
            ? {
                type: "numeric",
                id: `${id}-rotation`,

                name: i18next.t(
                  "models.tableStyling.point.selectableDimensions.rotation.name"
                ),
                value: pointTraits.rotation ?? nullValues.rotation,
                setDimensionValue: (stratumId, value) => {
                  pointTraits.setTrait(stratumId, "rotation", value);
                }
              }
            : undefined,
          !this.tableStyle.pointSizeColumn
            ? {
                type: "numeric",
                id: `${id}-height`,

                name: i18next.t(
                  "models.tableStyling.point.selectableDimensions.height.name"
                ),
                value: pointTraits.height ?? nullValues.height,
                setDimensionValue: (stratumId, value) => {
                  pointTraits.setTrait(stratumId, "height", value);
                }
              }
            : undefined,
          !this.tableStyle.pointSizeColumn
            ? {
                type: "numeric",
                id: `${id}-width`,

                name: i18next.t(
                  "models.tableStyling.point.selectableDimensions.width.name"
                ),
                value: pointTraits.width ?? nullValues.width,
                setDimensionValue: (stratumId, value) => {
                  pointTraits.setTrait(stratumId, "width", value);
                }
              }
            : undefined
        ]),
      (point, nullValue, label) =>
        `<div><img height="${24}px" style="margin-bottom: -4px; transform: rotate(${
          point.rotation ?? 0
        }deg)" src="${
          getMakiIcon(
            point.marker ?? nullValue.marker,
            "#fff",
            1,
            "#000",
            24,
            24
          ) ?? point.marker
        }"></img> ${label}</div>`
    );
  }

  @computed get outlineDims(): SelectableDimensionWorkflowGroup[] {
    return this.getStyleDims(
      i18next.t("models.tableStyling.outline.name"),
      "outline",
      this.tableStyle.outlineStyleMap,
      (id, outlineTraits, nullValues) => [
        {
          type: "color",
          id: `${id}-color`,

          name: i18next.t(
            "models.tableStyling.outline.selectableDimensions.color.name"
          ),
          allowUndefined: true,
          value: outlineTraits.color ?? nullValues.color,
          setDimensionValue: (stratumId, value) => {
            outlineTraits.setTrait(stratumId, "color", value);
          }
        },
        {
          type: "numeric",
          id: `${id}-width`,

          name: i18next.t(
            "models.tableStyling.outline.selectableDimensions.width.name"
          ),
          value: outlineTraits.width ?? nullValues.width,
          setDimensionValue: (stratumId, value) => {
            outlineTraits.setTrait(stratumId, "width", value);
          }
        }
      ],
      (outline, nullValue, label) =>
        getColorPreview(outline.color ?? nullValue.color ?? "#aaa", label)
    );
  }

  @computed get labelDims(): SelectableDimensionWorkflowGroup[] {
    return this.getStyleDims(
      i18next.t("models.tableStyling.label.name"),
      "label",
      this.tableStyle.labelStyleMap,
      (id, labelTraits, nullValues) =>
        filterOutUndefined([
          {
            type: "select",
            id: `${id}-column`,

            name: i18next.t(
              "models.tableStyling.label.selectableDimensions.column.name"
            ),
            selectedId: labelTraits.labelColumn ?? nullValues.labelColumn,
            allowUndefined: true,
            options: this.item.tableColumns.map((col) => ({
              id: col.name,
              name: col.title
            })),
            setDimensionValue: (stratumId, value) => {
              labelTraits.setTrait(stratumId, "labelColumn", value);
            }
          },
          {
            type: "text",
            id: `${id}-font`,

            name: i18next.t(
              "models.tableStyling.label.selectableDimensions.font.name"
            ),
            value: labelTraits.font ?? nullValues.font,
            setDimensionValue: (stratumId, value) => {
              labelTraits.setTrait(stratumId, "font", value);
            }
          },
          {
            type: "select",
            id: `${id}-style`,

            name: i18next.t(
              "models.tableStyling.label.selectableDimensions.style.name"
            ),
            selectedId: labelTraits.style ?? nullValues.style,
            options: [
              {
                id: "FILL",

                name: i18next.t(
                  "models.tableStyling.label.selectableDimensions.style.options.fill.name"
                )
              },
              {
                id: "OUTLINE",

                name: i18next.t(
                  "models.tableStyling.label.selectableDimensions.style.options.outline.name"
                )
              },
              {
                id: "FILL_AND_OUTLINE",

                name: i18next.t(
                  "models.tableStyling.label.selectableDimensions.style.options.fillAndOutline.name"
                )
              }
            ],
            setDimensionValue: (stratumId, value) => {
              labelTraits.setTrait(stratumId, "style", value);
            }
          },
          {
            type: "numeric",
            id: `${id}-scale`,

            name: i18next.t(
              "models.tableStyling.label.selectableDimensions.scale.name"
            ),
            value: labelTraits.scale ?? nullValues.scale,
            setDimensionValue: (stratumId, value) => {
              labelTraits.setTrait(stratumId, "scale", value);
            }
          },
          // Show style traits depending on `style`
          // three options "FILL", "FILL_AND_OUTLINE" and "OUTLINE"
          labelTraits.style === "FILL" ||
          labelTraits.style === "FILL_AND_OUTLINE"
            ? {
                type: "color",
                id: `${id}-fill-color`,

                name: i18next.t(
                  "models.tableStyling.label.selectableDimensions.fillColor.name"
                ),
                value: labelTraits.fillColor ?? nullValues.fillColor,
                setDimensionValue: (stratumId, value) => {
                  labelTraits.setTrait(stratumId, "fillColor", value);
                }
              }
            : undefined,
          labelTraits.style === "OUTLINE" ||
          labelTraits.style === "FILL_AND_OUTLINE"
            ? {
                type: "color",
                id: `${id}-outline-color`,

                name: i18next.t(
                  "models.tableStyling.label.selectableDimensions.outlineColor.name"
                ),
                value: labelTraits.outlineColor ?? nullValues.outlineColor,
                setDimensionValue: (stratumId, value) => {
                  labelTraits.setTrait(stratumId, "outlineColor", value);
                }
              }
            : undefined,
          labelTraits.style === "OUTLINE" ||
          labelTraits.style === "FILL_AND_OUTLINE"
            ? {
                type: "numeric",
                id: `${id}-outline-width`,

                name: i18next.t(
                  "models.tableStyling.label.selectableDimensions.outlineWidth.name"
                ),
                value: labelTraits.outlineWidth ?? nullValues.outlineWidth,
                setDimensionValue: (stratumId, value) => {
                  labelTraits.setTrait(stratumId, "outlineWidth", value);
                }
              }
            : undefined,
          {
            type: "select",
            id: `${id}-horizontal-origin`,

            name: i18next.t(
              "models.tableStyling.label.selectableDimensions.horizontalOrigin.name"
            ),
            selectedId:
              labelTraits.horizontalOrigin ?? nullValues.horizontalOrigin,
            options: [
              {
                id: "LEFT",

                name: i18next.t(
                  "models.tableStyling.label.selectableDimensions.horizontalOrigin.options.left.name"
                )
              },
              {
                id: "CENTER",

                name: i18next.t(
                  "models.tableStyling.label.selectableDimensions.horizontalOrigin.options.center.name"
                )
              },
              {
                id: "RIGHT",

                name: i18next.t(
                  "models.tableStyling.label.selectableDimensions.horizontalOrigin.options.right.name"
                )
              }
            ],
            setDimensionValue: (stratumId, value) => {
              labelTraits.setTrait(stratumId, "horizontalOrigin", value);
            }
          },
          {
            type: "select",
            id: `${id}-vertical-origin`,

            name: i18next.t(
              "models.tableStyling.label.selectableDimensions.verticalOrigin.name"
            ),
            selectedId: labelTraits.verticalOrigin ?? nullValues.verticalOrigin,
            options: [
              {
                id: "TOP",

                name: i18next.t(
                  "models.tableStyling.label.selectableDimensions.verticalOrigin.options.top.name"
                )
              },
              {
                id: "CENTER",

                name: i18next.t(
                  "models.tableStyling.label.selectableDimensions.verticalOrigin.options.center.name"
                )
              },
              {
                id: "BASELINE",

                name: i18next.t(
                  "models.tableStyling.label.selectableDimensions.verticalOrigin.options.baseline.name"
                )
              },
              {
                id: "BOTTOM",

                name: i18next.t(
                  "models.tableStyling.label.selectableDimensions.verticalOrigin.options.bottom.name"
                )
              }
            ],
            setDimensionValue: (stratumId, value) => {
              labelTraits.setTrait(stratumId, "verticalOrigin", value);
            }
          },
          {
            type: "numeric",
            id: `${id}-pixel-offset-x`,

            name: i18next.t(
              "models.tableStyling.label.selectableDimensions.offsetX.name"
            ),
            value: labelTraits.pixelOffset[0] ?? nullValues.pixelOffset[0],
            setDimensionValue: (stratumId, value) => {
              labelTraits.setTrait(stratumId, "pixelOffset", [
                value ?? 0,
                labelTraits.pixelOffset[1]
              ]);
            }
          },
          {
            type: "numeric",
            id: `${id}-pixel-offset-y`,

            name: i18next.t(
              "models.tableStyling.label.selectableDimensions.offsetY.name"
            ),
            value: labelTraits.pixelOffset[1] ?? nullValues.pixelOffset[1],
            setDimensionValue: (stratumId, value) => {
              labelTraits.setTrait(stratumId, "pixelOffset", [
                labelTraits.pixelOffset[0],
                value ?? 0
              ]);
            }
          }
        ]),
      (_labelTraits, _nullValue, label) => label
    );
  }

  @computed get trailDims(): SelectableDimensionWorkflowGroup[] {
    return [
      ...this.getStyleDims(
        "Trail style",
        "trail",
        this.tableStyle.trailStyleMap,
        (id, trailTraits, nullValues) =>
          filterOutUndefined([
            {
              type: "numeric",
              id: `${id}-lead-time`,
              name: i18next.t(
                "models.tableStyling.trail.selectableDimensions.leadTime.name"
              ),
              value: trailTraits.leadTime ?? nullValues.leadTime,
              setDimensionValue: (stratumId, value) => {
                trailTraits.setTrait(stratumId, "leadTime", value);
              }
            },
            {
              type: "numeric",
              id: `${id}-trail-time`,

              name: i18next.t(
                "models.tableStyling.trail.selectableDimensions.trailTime.name"
              ),
              value: trailTraits.trailTime ?? nullValues.trailTime,
              setDimensionValue: (stratumId, value) => {
                trailTraits.setTrait(stratumId, "trailTime", value);
              }
            },
            {
              type: "numeric",
              id: `${id}-width`,

              name: i18next.t(
                "models.tableStyling.trail.selectableDimensions.width.name"
              ),
              value: trailTraits.width ?? nullValues.width,
              setDimensionValue: (stratumId, value) => {
                trailTraits.setTrait(stratumId, "width", value);
              }
            },
            {
              type: "numeric",
              id: `${id}-resolution`,

              name: i18next.t(
                "models.tableStyling.trail.selectableDimensions.resolution.name"
              ),
              value: trailTraits.resolution ?? nullValues.resolution,
              setDimensionValue: (stratumId, value) => {
                trailTraits.setTrait(stratumId, "resolution", value);
              }
            },
            // Show material traits based on materialType
            // "polylineGlow" or "solidColor"
            ...((this.tableStyle.trailStyleMap.traits.materialType ===
            "polylineGlow"
              ? [
                  {
                    type: "color",
                    id: `${id}-glow-color`,

                    name: i18next.t(
                      "models.tableStyling.trail.selectableDimensions.growColor.name"
                    ),
                    value:
                      trailTraits.polylineGlow.color ??
                      nullValues.polylineGlow?.color,
                    setDimensionValue: (stratumId, value) => {
                      trailTraits.polylineGlow.setTrait(
                        stratumId,
                        "color",
                        value
                      );
                    }
                  },
                  {
                    type: "numeric",
                    id: `${id}-glow-power`,

                    name: i18next.t(
                      "models.tableStyling.trail.selectableDimensions.growPower.name"
                    ),
                    value:
                      trailTraits.polylineGlow.glowPower ??
                      nullValues.polylineGlow?.glowPower,
                    setDimensionValue: (stratumId, value) => {
                      trailTraits.polylineGlow.setTrait(
                        stratumId,
                        "glowPower",
                        value
                      );
                    }
                  },
                  {
                    type: "numeric",
                    id: `${id}-taper-power`,

                    name: i18next.t(
                      "models.tableStyling.trail.selectableDimensions.taperPower.name"
                    ),
                    value:
                      trailTraits.polylineGlow.taperPower ??
                      nullValues.polylineGlow?.taperPower,
                    setDimensionValue: (stratumId, value) => {
                      trailTraits.polylineGlow.setTrait(
                        stratumId,
                        "taperPower",
                        value
                      );
                    }
                  }
                ]
              : [
                  {
                    type: "color",
                    id: `${id}-solid-color`,

                    name: i18next.t(
                      "models.tableStyling.trail.selectableDimensions.solidColor.name"
                    ),
                    value:
                      trailTraits.solidColor.color ??
                      nullValues.solidColor?.color,
                    setDimensionValue: (stratumId, value) => {
                      trailTraits.solidColor.setTrait(
                        stratumId,
                        "color",
                        value
                      );
                    }
                  }
                ]) as FlatSelectableDimension[])
          ]),
        (_trail, _nullValue, label) => label
      ),
      {
        type: "group",
        id: "trail-style-options",

        name: i18next.t(
          "models.tableStyling.trail.selectableDimensions.trailStyleOptions.name"
        ),
        isOpen: false,
        selectableDimensions: filterOutUndefined([
          {
            type: "select",
            id: "trail-style-options-material",

            name: i18next.t(
              "models.tableStyling.trail.selectableDimensions.trailStyleOptions.selectableDimensions.material.name"
            ),
            selectedId: this.tableStyle.trailStyleMap.traits.materialType,
            options: [
              {
                id: "solidColor",

                name: i18next.t(
                  "models.tableStyling.trail.selectableDimensions.trailStyleOptions.selectableDimensions.material.options.solidColor.name"
                )
              },
              {
                id: "polylineGlow",

                name: i18next.t(
                  "models.tableStyling.trail.selectableDimensions.trailStyleOptions.selectableDimensions.material.options.polylineGlow.name"
                )
              }
            ],
            setDimensionValue: (stratumId, value) => {
              if (value === "solidColor" || value === "polylineGlow")
                this.getTableStyleTraits(stratumId)?.trail.setTrait(
                  stratumId,
                  "materialType",
                  value
                );
            }
          }
        ])
      }
    ];
  }

  @computed get fillStyleDimensions(): SelectableDimensionWorkflowGroup[] {
    return filterOutUndefined([
      // Only show color scheme selection if activeStyle exists
      this.item.activeStyle ? this.colorSchemeSelectableDim : undefined,

      // If we are in continuous realm:
      // - Display range
      this.colorSchemeType === "sequential-continuous" ||
      this.colorSchemeType === "diverging-continuous"
        ? this.displayRangeDim
        : undefined,
      // If we are in discrete realm:
      // - Bin maximums
      this.colorSchemeType === "sequential-discrete" ||
      this.colorSchemeType === "diverging-discrete" ||
      this.colorSchemeType === "custom-discrete"
        ? this.binColorDims
        : undefined,
      // If we are in qualitative realm
      this.colorSchemeType === "qualitative" ||
      this.colorSchemeType === "custom-qualitative"
        ? this.enumColorDims
        : undefined,

      this.additionalColorDimensions
    ]);
  }

  /** All of the dimensions! */
  @computed
  get selectableDimensions(): SelectableDimensionWorkflowGroup[] {
    return filterOutUndefined([
      this.tableStyleSelectableDim,

      ...(this.styleType === "fill" ? this.fillStyleDimensions : []),
      ...(this.styleType === "point" ? this.markerDims : []),
      ...(this.styleType === "outline" ? this.outlineDims : []),
      ...(this.styleType === "label" ? this.labelDims : []),
      ...(this.styleType === "trail" ? this.trailDims : []),

      this.styleType === "point-size" ? this.pointSizeDimensions : undefined,

      // Show region mapping dimensions if using region column and showing advanced options
      this.showAdvancedOptions &&
      this.styleType === "fill" &&
      this.tableStyle.colorColumn?.type === TableColumnType.region
        ? this.advancedRegionMappingDimensions
        : undefined,

      // Show advanced table options
      ...(this.showAdvancedOptions ? this.advancedTableDimensions : [])
    ]);
  }

  /**
   * Set `TableColorStyleTraits.binMaximums`
   *
   * If the maximum value of the dataset is greater than the last value in this array, an additional bin is added automatically (See `TableColorStyleTraits.binMaximums`)
   * Because of this, we may need to update `maximumValue` so we don't get more bins added automatically
   */
  setBinMaximums(stratumId: string, binMaximums?: number[]) {
    if (!binMaximums)
      binMaximums = [...this.tableStyle.tableColorMap.binMaximums];
    const colorTraits = this.getTableStyleTraits(stratumId)?.color;
    if (
      binMaximums[binMaximums.length - 1] !==
      this.tableStyle.tableColorMap.maximumValue
    ) {
      colorTraits?.setTrait(
        stratumId,
        "maximumValue",
        binMaximums[binMaximums.length - 1]
      );
    }
    colorTraits?.setTrait(stratumId, "binMaximums", binMaximums);
  }

  /** Clear binMaximums (which will automatically generate new ones based on numberOfBins, minimumValue and maximumValue).
   * Then set them have a sensible precision (otherwise there will be way too many digits).
   * This will also clear `minimumValue` and `maximumValue` */
  resetBinMaximums(stratumId: string) {
    this.getTableStyleTraits(stratumId)?.color.setTrait(
      stratumId,
      "minimumValue",
      undefined
    );
    this.getTableStyleTraits(stratumId)?.color.setTrait(
      stratumId,
      "maximumValue",
      undefined
    );
    this.getTableStyleTraits(stratumId)?.color.setTrait(
      stratumId,
      "binMaximums",
      undefined
    );
    const binMaximums = this.tableStyle.tableColorMap.binMaximums.map((bin) =>
      parseFloat(
        bin.toFixed(this.tableStyle.numberFormatOptions?.maximumFractionDigits)
      )
    );
    this.getTableStyleTraits(stratumId)?.color.setTrait(
      stratumId,
      "binMaximums",
      binMaximums
    );
  }

  /** Set enum value and color for specific index in `enumColors` array */
  setEnumColorTrait(
    stratumId: string,
    index: number,
    value?: string,
    color?: string
  ) {
    const enumColors = this.tableStyle.colorTraits.traits.enumColors.toJson(
      this.tableStyle.tableColorMap.enumColors
    ) as ModelPropertiesFromTraits<EnumColorTraits>[];

    // Remove element if value and color are undefined
    if (!isDefined(value) && !isDefined(color)) enumColors.splice(index, 1);
    else enumColors[index] = { value, color };

    this.getTableStyleTraits(stratumId)?.color.setTrait(
      stratumId,
      "enumColors",
      enumColors
    );
  }

  /** Convenience getter for item.activeTableStyle */
  @computed get tableStyle() {
    return this.item.activeTableStyle;
  }

  /** Get `TableStyleTraits` for the active table style (so we can call `setTraits`).
   */
  getTableStyleTraits(stratumId: string, id: string = this.tableStyle.id) {
    if (id === "Default Style") {
      id = "User Style";
      runInAction(() =>
        this.item.setTrait(stratumId, "activeStyle", "User Style")
      );
    }

    const style =
      this.item.styles?.find((style) => style.id === id) ??
      this.item.addObject(stratumId, "styles", id);

    style?.setTrait(stratumId, "hidden", false);

    return style;
  }

  /** Get `TableColumnTraits` for the active table style `colorColumn` (so we can call `setTraits`) */
  getTableColumnTraits(stratumId: string) {
    if (!this.tableStyle.colorColumn?.name) return;
    return (
      this.item.columns?.find(
        (col) => col.name === this.tableStyle.colorColumn!.name
      ) ??
      this.item.addObject(
        stratumId,
        "columns",
        this.tableStyle.colorColumn.name
      )
    );
  }
}

function getColorPreview(col: string, label: string) {
  return `<div><div style="margin-bottom: -4px; width:20px; height:20px; display:inline-block; background-color:${col} ;"></div> ${label}</div>`;
}
