import { computed, makeObservable } from "mobx";
import { PickProperties } from "ts-essentials";
import JsonValue from "../Core/Json";
import { NotUndefined } from "../Core/TypeModifiers";
import TableMixin from "../ModelMixins/TableMixin";
import Model from "../Models/Definition/Model";
import {
  BinStyleTraits,
  EnumStyleTraits,
  TableStyleMapSymbolTraits,
  TableStyleMapTraits
} from "../Traits/TraitsClasses/Table/StyleMapTraits";
import TableStyleTraits from "../Traits/TraitsClasses/Table/StyleTraits";

export interface TableStyleMapModel<T extends TableStyleMapSymbolTraits> {
  enabled?: boolean;
  mapType: StyleMapType | undefined;
  column: string | undefined;

  enum: Readonly<(EnumStyle & T)[]>;
  bin: Readonly<(BinStyle & T)[]>;
  null: T;
}

export interface BinStyle {
  maxValue?: number | null;
}
export interface EnumStyle {
  value?: string | null;
}

export type StyleMapType = "continuous" | "enum" | "bin" | "constant";

type MapValueToStyle<T> = (value: JsonValue | undefined) => T;

export interface EnumStyleMap<T> {
  type: "enum";
  mapRowIdToStyle: (rowId: number) => T;
  mapValueToStyle: MapValueToStyle<T>;
}

export interface BinStyleMap<T> {
  type: "bin";
  mapRowIdToStyle: (rowId: number) => T;
  mapValueToStyle: MapValueToStyle<T>;
}

export interface ConstantStyleMap<T> {
  type: "constant";
  style: T;
}

export default class TableStyleMap<T extends TableStyleMapSymbolTraits> {
  constructor(
    readonly tableModel: TableMixin.Instance,
    readonly styleTraits: Model<TableStyleTraits>,
    readonly key: NotUndefined<
      keyof PickProperties<TableStyleTraits, TableStyleMapModel<T>>
    >
  ) {
    makeObservable(this);
  }

  /** Get traits for TableStyleMapSymbolTraits */
  @computed get commonTraits() {
    return this.styleTraits[this.key] as Model<
      {
        enum: EnumStyleTraits[];
        bin: BinStyleTraits[];
      } & TableStyleMapTraits
    >;
  }

  /** Get all traits (this includes TableStyleMapTraits and specific SymbolTraits) */
  @computed get traits() {
    return this.styleTraits[this.key];
  }

  /** Get all trait values for this TableStyleMapModel.
   * This is a JSON object
   */
  @computed get traitValues() {
    return this.styleTraits.traits[this.key].toJson(
      this.traits
    ) as TableStyleMapModel<T>;
  }

  @computed get column() {
    return this.traitValues.column
      ? this.tableModel.tableColumns.find(
          (column) => column.name === this.traitValues.column
        )
      : undefined;
  }

  /**
   *
   */
  @computed
  get styleMap(): EnumStyleMap<T> | BinStyleMap<T> | ConstantStyleMap<T> {
    // If column type is `scalar` and binStyles
    if (
      (this.traitValues.mapType === "bin" || !this.traitValues.mapType) &&
      this.traitValues.bin &&
      this.traitValues.bin.length > 0
    ) {
      const mapValueToStyle: MapValueToStyle<T> = (value) => {
        if (typeof value !== "number") {
          return this.traitValues.null;
        }

        const binStyles = this.traitValues.bin ?? [];
        let i;
        for (
          i = 0;
          i < binStyles.length - 1 &&
          value > (binStyles[i].maxValue ?? Infinity);
          ++i
        ) {
          continue;
        }

        return {
          ...this.traitValues.null,
          ...(this.traitValues.bin?.[i] ?? {})
        };
      };

      return {
        type: "bin",
        mapRowIdToStyle: (rowId) =>
          mapValueToStyle(this.column?.valuesForType[rowId]),
        mapValueToStyle
      };
    } else if (
      (this.traitValues.mapType === "enum" || !this.traitValues.mapType) &&
      this.traitValues.enum &&
      this.traitValues.enum.length > 0
    ) {
      const mapValueToStyle: MapValueToStyle<T> = (value) => {
        const style = this.traitValues.enum!.find(
          (enumStyle) => enumStyle.value !== null && enumStyle.value === value
        );

        return { ...this.traitValues.null, ...(style ?? {}) };
      };
      return {
        type: "enum",
        mapRowIdToStyle: (rowId) => mapValueToStyle(this.column?.values[rowId]),
        mapValueToStyle
      };
    }

    // Return default settings
    return {
      type: "constant",
      style: this.traitValues.null
    };
  }
}

export function isConstantStyleMap<T>(
  map: EnumStyleMap<T> | BinStyleMap<T> | ConstantStyleMap<T>
): map is ConstantStyleMap<T> {
  return map.type === "constant";
}
