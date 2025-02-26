import { uniq } from "lodash-es";
import { computed, makeObservable } from "mobx";
import filterOutUndefined from "../Core/filterOutUndefined";
import ConstantColorMap from "../Map/ColorMap/ConstantColorMap";
import { isMakiIcon } from "../Map/Icons/Maki/MakiIcons";
import { isDataSource } from "../ModelMixins/MappableMixin";
import TableMixin from "../ModelMixins/TableMixin";
import createStratumInstance from "../Models/Definition/createStratumInstance";
import LoadableStratum from "../Models/Definition/LoadableStratum";
import { BaseModel } from "../Models/Definition/Model";
import StratumFromTraits from "../Models/Definition/StratumFromTraits";
import StratumOrder from "../Models/Definition/StratumOrder";
import LegendOwnerTraits from "../Traits/TraitsClasses/LegendOwnerTraits";
import LegendTraits, {
  LegendItemTraits
} from "../Traits/TraitsClasses/LegendTraits";
import { OutlineSymbolTraits } from "../Traits/TraitsClasses/Table/OutlineStyleTraits";
import { PointSymbolTraits } from "../Traits/TraitsClasses/Table/PointStyleTraits";
import { ColorStyleLegend } from "./ColorStyleLegend";
import { MergedStyleMapLegend } from "./MergedStyleMapLegend";
import { StyleMapLegend } from "./StyleMapLegend";

export class TableAutomaticLegendStratum extends LoadableStratum(
  LegendOwnerTraits
) {
  static stratumName = "table-legend";
  constructor(private readonly _item: TableMixin.Instance) {
    super();
    makeObservable(this);
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new TableAutomaticLegendStratum(
      newModel as TableMixin.Instance
    ) as this;
  }

  static load(item: TableMixin.Instance): TableAutomaticLegendStratum {
    return new TableAutomaticLegendStratum(item);
  }

  @computed get legendItemOverrides(): Partial<LegendItemTraits> {
    const override = {
      ...(this._item.activeTableStyle.tableColorMap.type === "constant"
        ? {
            color: (
              this._item.activeTableStyle.tableColorMap
                .colorMap as ConstantColorMap
            ).color.toCssColorString(),
            title: (
              this._item.activeTableStyle.tableColorMap
                .colorMap as ConstantColorMap
            ).title
          }
        : {}),
      ...(this.showPointLegend &&
      this._item.activeTableStyle.pointStyleMap.styleMap.type === "constant"
        ? getPointLegend(
            this._item.activeTableStyle.pointStyleMap.styleMap.style
          )
        : {}),
      ...(this._item.activeTableStyle.outlineStyleMap.styleMap.type ===
      "constant"
        ? getOutlineLegend(
            this._item.activeTableStyle.outlineStyleMap.styleMap.style
          )
        : {})
    };
    delete override.addSpacingAbove;
    return override;
  }

  @computed get colorStyleLegend() {
    if (this._item.activeTableStyle.tableColorMap.type !== "constant")
      return new ColorStyleLegend(this._item, this.legendItemOverrides);
  }

  @computed get pointStyleMapLegend() {
    if (this._item.activeTableStyle.pointStyleMap.styleMap.type !== "constant")
      return new StyleMapLegend(
        this._item,
        this._item.activeTableStyle.pointStyleMap,
        getPointLegend,
        this.legendItemOverrides
      );
  }

  @computed get outlineStyleMapLegend() {
    if (
      this._item.activeTableStyle.outlineStyleMap.styleMap.type !== "constant"
    )
      return new StyleMapLegend(
        this._item,
        this._item.activeTableStyle.outlineStyleMap,
        getOutlineLegend,
        this.legendItemOverrides
      );
  }

  @computed get showPointLegend() {
    return !!this._item.mapItems.find(
      (d) => isDataSource(d) && d.entities.values.length > 0
    );
  }

  @computed get mergedLegend() {
    if (this.styleLegends.length === 0) return;

    const mergableStyleTypes = [
      this._item.activeTableStyle.tableColorMap.type,
      this._item.activeTableStyle.pointStyleMap.styleMap.type,
      this._item.activeTableStyle.outlineStyleMap.styleMap.type
    ].filter((type) => type !== "constant");

    const canMergeStyleTypes =
      mergableStyleTypes.every((type) => type === "enum") ||
      mergableStyleTypes.every((type) => type === "bin");

    const canMergeColumns =
      uniq(
        filterOutUndefined([
          this._item.activeTableStyle.colorColumn?.name,
          this._item.activeTableStyle.outlineStyleMap.column?.name,
          this._item.activeTableStyle.pointStyleMap.column?.name
        ])
      ).length <= 1;

    if (canMergeColumns && canMergeStyleTypes) {
      return new MergedStyleMapLegend(
        this.styleLegends,
        this.legendItemOverrides
      );
    }
  }

  @computed get styleLegends() {
    return filterOutUndefined([
      this.colorStyleLegend,
      this.showPointLegend ? this.pointStyleMapLegend : undefined,
      this.outlineStyleMapLegend
    ]);
  }

  @computed get legends(): StratumFromTraits<LegendTraits>[] {
    if (
      this._item.mapItems.length === 0 ||
      (this._item.dataColumnMajor ?? []).length === 0
    )
      return [];

    if (this.mergedLegend) return [this.mergedLegend];

    if (this.styleLegends.length > 0) {
      return this.styleLegends;
    }

    return [
      createStratumInstance(LegendTraits, {
        items: [
          createStratumInstance(LegendItemTraits, this.legendItemOverrides)
        ]
      })
    ];
  }
}

StratumOrder.addLoadStratum(TableAutomaticLegendStratum.stratumName);

type GetLegendForStyle<T> = (
  style: T,
  title?: string
) => Partial<LegendItemTraits>;

const getPointLegend: GetLegendForStyle<PointSymbolTraits> = (
  point,
  defaultLabel: string | undefined
) => {
  const useMakiIcon = isMakiIcon(point.marker);
  return {
    rotation: point.rotation,
    marker: useMakiIcon ? point.marker : undefined,
    imageUrl:
      !useMakiIcon && point.marker !== "point" ? point.marker : undefined,
    imageHeight: 24,
    imageWidth: 24,
    title: point.legendTitle ?? defaultLabel
  };
};

const getOutlineLegend: GetLegendForStyle<OutlineSymbolTraits> = (
  outline,
  defaultLabel
) => {
  return {
    outlineWidth: outline.width,
    outlineColor: outline.color,
    // If we have a dashed array, then show CSS outline-style as dashed, otherwise solid
    outlineStyle: outline.dash && outline.dash.length > 1 ? "dashed" : "solid",
    title: outline.legendTitle ?? defaultLabel
  };
};
