import countBy from "lodash-es/countBy";
import Mexp from "math-expression-evaluator";
import { computed } from "mobx";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import filterOutUndefined from "../Core/filterOutUndefined";
import isDefined from "../Core/isDefined";
import runLater from "../Core/runLater";
import RegionProvider from "../Map/Region/RegionProvider";
import TableMixin from "../ModelMixins/TableMixin";
import createCombinedModel from "../Models/Definition/createCombinedModel";
import Model from "../Models/Definition/Model";
import TableColumnTraits, {
  THIS_COLUMN_EXPRESSION_TOKEN
} from "../Traits/TraitsClasses/TableColumnTraits";
import TableColumnType, { stringToTableColumnType } from "./TableColumnType";
const naturalSort = require("javascript-natural-sort");
naturalSort.insensitive = true;

type TypeHintSet = {
  /** RegEx to match column name */
  hint: RegExp;
  /** TableColumnType to use if match is found */
  type: TableColumnType;
  /** Only match for columns which have `guessColumnTypeFromValues() === typeFromValues`.
   * If undefined, it will accept all types
   */
  typeFromValues?: TableColumnType;
}[];

export interface ColumnValuesAsNumbers {
  readonly values: ReadonlyArray<number | null>;
  readonly minimum: number | undefined;
  readonly maximum: number | undefined;
  readonly numberOfValidNumbers: number;
  readonly numberOfNonNumbers: number;
}

export interface ColumnValuesAsDates {
  readonly values: ReadonlyArray<Date | null>;
  readonly minimum: Date | undefined;
  readonly maximum: Date | undefined;
  readonly numberOfValidDates: number;
  readonly numberOfNonDates: number;
}

export interface ColumnValuesAsRegions {
  readonly regionIds: ReadonlyArray<number | null>;
  readonly uniqueRegionIds: ReadonlyArray<number>;
  readonly numberOfValidRegions: number;
  readonly numberOfNonRegions: number;
  readonly numberOfRegionsWithMultipleRows: number;
  readonly regionIdToRowNumbersMap: ReadonlyMap<
    string | number,
    number | readonly number[]
  >;
}

export interface UniqueColumnValues {
  /**
   * Gets the unique values, ordered from most common to least common.
   */
  readonly values: ReadonlyArray<string>;

  /**
   * Gets the count of each value. This is a parallel array to
   * {@link #values}.
   */
  readonly counts: ReadonlyArray<number>;

  /**
   * Gets the number of rows with null values.
   */
  readonly numberOfNulls: number;
}

/**
 * A column of tabular data.
 */
export default class TableColumn {
  readonly columnNumber: number;
  readonly tableModel: TableMixin.Instance;

  constructor(tableModel: TableMixin.Instance, columnNumber: number) {
    this.columnNumber = columnNumber;
    this.tableModel = tableModel;
  }

  /**
   * Gets the raw, uninterpreted values in the column. This will not apply any transformations to data (eg transformation expressions).
   *
   */
  @computed
  get values(): readonly string[] {
    const result: string[] = [];

    if (this.tableModel.dataColumnMajor !== undefined) {
      // Copy all but the first element (which is the header), and trim along the way.
      const source = this.tableModel.dataColumnMajor[this.columnNumber];
      for (let i = 1; i < source.length; ++i) {
        result.push(source[i].trim());
      }
    }

    return result;
  }

  /**
   * Gets `math-expression-evaluator` tokens. These allow other column values to be used in an expression.
   * Each token is generated by `transformation.dependencies` trait - which is an array of strings of column names.
   * A token `THIS_COLUMN_EXPRESSION_TOKEN` is also added - which corresponds to the value in **this column**.
   * For example:
   * - if `dependencies = ['columnA']`
   * - then a token will be generated for `columnA`
   * - and then we can access the value in an expression (eg `THIS_COLUMN_EXPRESSION_TOKEN*columnA` will multiple each value in this column, by the value in `columnA`)
   */
  @computed
  get mexpColumnTokens() {
    return [
      {
        type: 3, // This type defines a constant value - see https://bugwheels94.github.io/math-expression-evaluator/#how-to-define-a-token for types
        token: THIS_COLUMN_EXPRESSION_TOKEN,
        show: THIS_COLUMN_EXPRESSION_TOKEN,
        value: THIS_COLUMN_EXPRESSION_TOKEN
      },
      ...filterOutUndefined(
        this.traits.transformation?.dependencies?.map(colName => {
          if (this.tableModel.tableColumns.find(col => col.name === colName)) {
            return {
              type: 3, // This type defines a constant value
              token: colName,
              show: colName,
              value: colName
            };
          } else {
            // TODO: deal with error handling when we have it
            console.log(
              `Failed to add column token - column "${colName}" doesn't exist.\nWith expression: ${
                this.traits.transformation.expression
              }\nWith dependencies: ${this.traits.transformation.dependencies?.join(
                ", "
              )}`
            );
          }
        }) ?? []
      )
    ];
  }

  /**
   * Gets a function which can be used to generate `math-expression-evaluator` pairs for a given row `i`.
   * The function returns key-value pairs which map tokens to values.
   * Each token (see `this.mexpColumnTokens`) represents another column in the table, each value represents corresponding cell for row i.
   *
   * @param rowIndex row number
   * @param value value to transform
   */
  mexpColumnValuePairs(rowIndex: number, value: number) {
    return this.mexpColumnTokens.reduce<{ [key: string]: number | null }>(
      (pairs, token) => {
        if (token.token !== THIS_COLUMN_EXPRESSION_TOKEN)
          pairs[token.value] =
            this.tableModel.tableColumns.find(col => col.name === token.token)
              ?.valuesAsNumbers.values[rowIndex] ?? null;
        // Add column pair for this value (token `THIS_COLUMN_EXPRESSION_TOKEN`)
        else pairs[THIS_COLUMN_EXPRESSION_TOKEN] = value;
        return pairs;
      },
      {}
    );
  }

  /**
   * Gets `math-expression-evaluator` expression in "postfix" notation. This will "bake" tokens from `this.mexpColumnTokens` into the expression.
   * ColumnValuePairs from `this.mexpColumnValuePairs` are added each time the expression is evaluated (see `this.valuesAsNumbers`)
   */
  @computed
  get mexpPostfix() {
    if (this.traits.transformation?.expression) {
      try {
        // Try to parse the expression and then add tokens
        const lexed = Mexp.lex(
          this.traits.transformation.expression,
          this.mexpColumnTokens
        );

        // Converts to postfix notation
        return lexed.toPostfix();
      } catch (error) {
        // TODO: deal with error handling when we have it
        console.log(
          `Failed to setup column transformation: \n${
            this.traits.transformation.expression
          }\nWith dependencies: ${this.traits.transformation.dependencies?.join(
            ", "
          )}`
        );
        console.log(error);
      }
    }
  }

  /**
   * Gets the column values as numbers, and returns information about how many
   * rows were successfully converted to numbers and the range of values.
   */
  @computed
  get valuesAsNumbers(): ColumnValuesAsNumbers {
    const numbers: (number | null)[] = [];
    let minimum = Number.MAX_VALUE;
    let maximum = -Number.MAX_VALUE;
    let numberOfValidNumbers = 0;
    let numberOfNonNumbers = 0;

    const replaceWithZero = this.traits.replaceWithZeroValues;
    const replaceWithNull = this.traits.replaceWithNullValues;

    const values = this.values;
    for (let i = 0; i < values.length; ++i) {
      const value = values[i];

      let n: number | null;
      if (replaceWithZero && replaceWithZero.indexOf(value) >= 0) {
        n = 0;
      } else if (replaceWithNull && replaceWithNull.indexOf(value) >= 0) {
        n = null;
      } else if (value.length === 0) {
        n = null;
      } else {
        n = toNumber(values[i]);
        // Only count as non number if value isn't actually null
        if (value !== "null" && n === null) {
          ++numberOfNonNumbers;
        }
      }

      if (n !== null) {
        // If we have a `math-expression-evaluator` - use it to transform value
        if (isDefined(this.mexpPostfix)) {
          const columnPairs = this.mexpColumnValuePairs(i, n);

          // Only transform value if all columnPairs have been set
          // This means that if one of the columnPairs has a null values - the whole expression WON'T be evaluated
          if (!Object.values(columnPairs).includes(null)) {
            const result = this.mexpPostfix.postfixEval(columnPairs);
            n = typeof result === "string" ? toNumber(result) : result;
          }
        }
      }

      if (n !== null) {
        ++numberOfValidNumbers;
        minimum = Math.min(minimum, n);
        maximum = Math.max(maximum, n);
      }

      numbers.push(n);
    }

    return {
      values: numbers,
      minimum: minimum === Number.MAX_VALUE ? undefined : minimum,
      maximum: maximum === -Number.MAX_VALUE ? undefined : maximum,
      numberOfValidNumbers: numberOfValidNumbers,
      numberOfNonNumbers: numberOfNonNumbers
    };
  }

  /**
   * Gets the column values as dates, and returns information about how many
   * rows were successfully converted to dates and the range of values.
   */
  @computed
  get valuesAsDates(): ColumnValuesAsDates {
    // See ECMA-262 section 15.9.1.1
    // http://ecma-international.org/ecma-262/5.1/#sec-15.9.1.1
    const maxDate = new Date(8.64e15);
    const minDate = new Date(-8.64e15);
    const replaceWithNull = this.traits.replaceWithNullValues;

    // Approach:
    // * See how dd/mm/yyyy parsing goes
    // * If mm/dd/yyyy parsing could work instead use that
    // * Otherwise try `new Date` for everything

    // Try dd/mm/yyyy, but look out for errors that would also make mm/dd/yyyy impossible
    let skipMmddyyyy = false;
    let parsingFailed = false;

    const separators = ["/", "-"];

    type StringToDateFunction = (str: string) => Date | null;

    const centuryFix = (y: number) =>
      y < 50 ? 2000 + y : y < 100 ? 1900 + y : y;

    const ddmmyyyy: StringToDateFunction = value => {
      // Try dd/mm/yyyy and watch out for failures that would also cross out mm/dd/yyyy
      for (const separator of separators) {
        const sep1 = value.indexOf(separator);
        if (sep1 === -1) continue; // Try next separator
        const sep2 = value.indexOf(separator, sep1 + 1);
        if (sep2 === -1) {
          // Neither ddmmyyyy nor mmddyyyy
          parsingFailed = true;
          skipMmddyyyy = true;
          return null;
        }
        const dayString = value.slice(0, sep1);
        const monthString = value.slice(sep1 + 1, sep2);
        const yearString = value.slice(sep2 + 1);
        const d = +dayString;
        const m = +monthString;
        const y = +yearString;
        if (Number.isInteger(d) && Number.isInteger(m) && Number.isInteger(y)) {
          if (d > 31 || y > 9999) {
            // Neither ddmmyyyy nor mmddyyyy
            parsingFailed = true;
            skipMmddyyyy = true;
            return null;
          }
          if (m > 12) {
            // Probably mmddyyyy
            parsingFailed = true;
            return null;
          }
          return new Date(centuryFix(y), m - 1, d);
        } else {
          // Neither ddmmyyyy nor mmddyyyy
          parsingFailed = true;
          skipMmddyyyy = true;
          return null;
        }
      }
      // Neither ddmmyyyy nor mmddyyyy
      parsingFailed = true;
      skipMmddyyyy = true;
      return null;
    };

    const mmddyyyy: StringToDateFunction = value => {
      // This function only exists to allow mm-dd-yyyy dates
      // mm/dd/yyyy dates could be picked up by `new Date`
      const separator = "-";
      const sep1 = value.indexOf(separator);
      if (sep1 === -1) {
        parsingFailed = true;
        return null;
      }
      const sep2 = value.indexOf(separator, sep1 + 1);
      if (sep2 === -1) {
        parsingFailed = true;
        return null;
      }
      const monthString = value.slice(0, sep1);
      const dayString = value.slice(sep1 + 1, sep2);
      const yearString = value.slice(sep2 + 1);
      const d = +dayString;
      const m = +monthString;
      const y = +yearString;
      if (Number.isInteger(d) && Number.isInteger(m) && Number.isInteger(y)) {
        if (d > 31 || m > 12 || y > 9999) {
          parsingFailed = true;
          return null;
        }
        return new Date(centuryFix(y), m - 1, d);
      } else {
        parsingFailed = true;
        return null;
      }
    };

    const yyyyQQ: StringToDateFunction = value => {
      // Is it quarterly data in the format yyyy-Qx ? (Ignoring null values, and failing on any purely numeric values)
      if (value[4] === "-" && value[5] === "Q") {
        const year = +value.slice(0, 4);
        if (!Number.isInteger(year)) {
          parsingFailed = true;
          return null;
        }
        const quarter = value.slice(6);
        let monthString: string;
        if (quarter === "1") {
          monthString = "01/01";
        } else if (quarter === "2") {
          monthString = "04/01";
        } else if (quarter === "3") {
          monthString = "07/01";
        } else if (quarter === "4") {
          monthString = "10/01";
        } else {
          parsingFailed = true;
          return null;
        }
        return new Date(centuryFix(year) + "/" + monthString);
      }
      parsingFailed = true;
      return null;
    };

    const dateConstructor: StringToDateFunction = value => {
      const ms = Date.parse(value);
      if (!Number.isNaN(ms)) {
        return new Date(ms);
      }
      return null;
    };

    function convertValuesToDates(
      values: readonly string[],
      toDate: StringToDateFunction
    ): ColumnValuesAsDates {
      let minimum = maxDate;
      let maximum = minDate;
      let numberOfValidDates = 0;
      let numberOfNonDates = 0;
      const dates: (Date | null)[] = [];

      for (let i = 0; i < values.length; ++i) {
        const value = values[i];
        let d: Date | null;
        if (
          (replaceWithNull && replaceWithNull.indexOf(value) >= 0) ||
          value.length === 0
        ) {
          dates.push(null);
        } else {
          d = toDate(values[i]);
          if (d === null) {
            ++numberOfNonDates;
          }

          if (d !== null) {
            ++numberOfValidDates;
            minimum = d < minimum ? d : minimum;
            maximum = d > maximum ? d : maximum;
          }

          dates.push(d);
        }
        if (parsingFailed) {
          break;
        }
      }
      return {
        values: dates,
        minimum: minimum === maxDate ? undefined : minimum,
        maximum: maximum === minDate ? undefined : maximum,
        numberOfValidDates: numberOfValidDates,
        numberOfNonDates: numberOfNonDates
      };
    }

    let result = convertValuesToDates(this.values, ddmmyyyy);
    if (!parsingFailed) return result;
    parsingFailed = false;
    if (!skipMmddyyyy) {
      result = convertValuesToDates(this.values, mmddyyyy);
      if (!parsingFailed) return result;
      parsingFailed = false;
    }
    result = convertValuesToDates(this.values, yyyyQQ);
    if (!parsingFailed) return result;
    parsingFailed = false;

    return convertValuesToDates(this.values, dateConstructor);
  }

  @computed
  get valuesAsJulianDates() {
    const valuesAsDates = this.valuesAsDates;
    return {
      ...this.valuesAsDates,
      values: valuesAsDates.values.map(
        date => date && JulianDate.fromDate(date)
      ),
      minimum:
        valuesAsDates.minimum && JulianDate.fromDate(valuesAsDates.minimum),
      maximum:
        valuesAsDates.maximum && JulianDate.fromDate(valuesAsDates.maximum)
    };
  }

  /**
   * Gets the unique values in this column.
   */
  @computed
  get uniqueValues(): UniqueColumnValues {
    const replaceWithNull = this.traits.replaceWithNullValues;

    const values = this.values.map(value => {
      if (value.length === 0) {
        return "";
      } else if (replaceWithNull && replaceWithNull.indexOf(value) >= 0) {
        return "";
      }
      return value;
    });

    const count = countBy(values);
    const nullCount = count[""] ?? 0;
    delete count[""];

    function toArray(key: string, value: number): [string, number] {
      return [key, value];
    }
    const countArray = Object.keys(count).map(key => toArray(key, count[key]));

    countArray.sort(function(a, b) {
      return b[1] - a[1];
    });

    return {
      values: countArray.map(a => a[0]),
      counts: countArray.map(a => a[1]),
      numberOfNulls: nullCount
    };
  }

  @computed
  get valuesAsRegions(): ColumnValuesAsRegions {
    const values = this.values;
    const map = new Map<number, number | number[]>();

    const regionType = this.regionType;
    if (!isDefined(regionType) || !regionType.loaded) {
      // No regions.
      return {
        numberOfValidRegions: 0,
        numberOfNonRegions: values.length,
        numberOfRegionsWithMultipleRows: 0,
        regionIds: values.map(() => null),
        regionIdToRowNumbersMap: map,
        uniqueRegionIds: []
      };
    }

    const regionIds: (number | null)[] = [];
    const uniqueRegionIds = new Set<number>();
    let numberOfValidRegions = 0;
    let numberOfNonRegions = 0;
    let numberOfRegionsWithMultipleRows = 0;

    for (let i = 0; i < values.length; ++i) {
      const value = values[i];

      let regionIndex: number | null = this.regionType!.findRegionIndex(
        value,
        this.regionDisambiguationColumn?.values?.[i]
      );

      regionIndex = regionIndex === -1 ? null : regionIndex;

      regionIds.push(regionIndex);
      if (regionIndex !== null) uniqueRegionIds.add(regionIndex);

      if (regionIndex !== null) {
        ++numberOfValidRegions;

        const rows = map.get(regionIndex);
        if (rows === undefined) {
          map.set(regionIndex, i);
        } else if (typeof rows === "number") {
          numberOfRegionsWithMultipleRows++;
          map.set(regionIndex, [rows, i]);
        } else {
          rows.push(i);
        }
      } else {
        ++numberOfNonRegions;
      }
    }

    return {
      regionIds: regionIds,
      uniqueRegionIds: Array.from(uniqueRegionIds),
      regionIdToRowNumbersMap: map,
      numberOfValidRegions: numberOfValidRegions,
      numberOfNonRegions: numberOfNonRegions,
      numberOfRegionsWithMultipleRows: numberOfRegionsWithMultipleRows
    };
  }

  /**
   * Gets the name of this column. If the column's name is blank, this property
   * will return `Column#` where `#` is the zero-based index of the column.
   */
  @computed
  get name(): string {
    const data = this.tableModel.dataColumnMajor;
    if (
      data === undefined ||
      data.length < this.columnNumber ||
      data[this.columnNumber].length < 1 ||
      data[this.columnNumber].length === 0
    ) {
      return "Column" + this.columnNumber;
    }
    return data[this.columnNumber][0];
  }

  @computed
  get title(): string {
    return (
      this.tableModel.columnTitles[this.columnNumber] ??
      this.traits.title ??
      // If no title set, use `name` and:
      // - un-camel case
      // - remove underscores
      // - capitalise
      this.name
        .replace(/[A-Z][a-z]/g, letter => ` ${letter.toLowerCase()}`)
        .replace(/_/g, " ")
        .trim()
        .toLowerCase()
        .replace(/(^\w|\s\w)/g, m => m.toUpperCase())
    );
  }

  @computed
  get units(): string | undefined {
    return this.tableModel.columnUnits[this.columnNumber]
      ? this.tableModel.columnUnits[this.columnNumber]
      : this.traits.units;
  }

  /**
   * Gets the {@link TableColumnTraits} for this column. The trait are derived
   * from the default column plus this column layered on top of the default.
   */
  @computed
  get traits(): Model<TableColumnTraits> {
    // It is important to match on column name and not column number because the column numbers can vary between stratum
    const thisColumn = this.tableModel.columns.find(
      column => column.name === this.name
    );
    if (thisColumn !== undefined) {
      const result = createCombinedModel(
        thisColumn,
        this.tableModel.defaultColumn
      );
      return result;
    } else {
      return this.tableModel.defaultColumn;
    }
  }

  /**
   * Gets the type of this column. If {@link #traits} has an explicit
   * {@link TableColumnTraits#type} specified, it is returned directly.
   * Otherwise, the type is guessed from the column name and contents.
   */
  @computed
  get type(): TableColumnType {
    // Use the explicit column type, if any.
    let type: TableColumnType | undefined;
    if (
      this.traits.type !== undefined &&
      stringToTableColumnType(this.traits.type)
    ) {
      type = stringToTableColumnType(this.traits.type);
    }

    if (type) {
      return type;
    } else if (this.regionType !== undefined) {
      return TableColumnType.region;
    }

    return (
      this.guessColumnTypeFromName(this.name) ??
      this.guessColumnTypeFromValues()
    );
  }

  @computed
  get isScalarBinary() {
    if (this.type === TableColumnType.scalar) {
      return (
        this.uniqueValues.values.length === 2 &&
        this.uniqueValues.values[0] === "0" &&
        this.uniqueValues.values[1] === "1"
      );
    }
  }

  /** Is column ready to be used.
   * This will be false if regionType is not loaded
   */
  @computed
  get ready() {
    return !isDefined(this.regionType) || this.regionType.loaded;
  }

  @computed
  get regionType(): RegionProvider | undefined {
    let regionProvider: RegionProvider | undefined;
    const regions = this.tableModel.regionProviderList;
    if (regions === undefined) {
      return undefined;
    }

    const regionType = this.traits.regionType;
    if (regionType !== undefined) {
      // Explicit region type specified, we just need to resolve it.
      regionProvider = regions.getRegionProvider(regionType);
    }

    if (!isDefined(regionProvider)) {
      // No region type specified, so match the column name against the region
      // aliases.
      const details = regions.getRegionDetails(
        [this.name],
        undefined,
        undefined
      );
      if (details.length > 0) {
        regionProvider = details[0].regionProvider;
      }
    }

    // Load region IDs for region type
    // Note: loadRegionIDs is called in TableMixin.forceLoadMapItems()
    // So this will only load region IDs if style/regionType changes after initial loadMapItems
    runLater(() => regionProvider?.loadRegionIDs());

    return regionProvider;
  }

  @computed
  get regionDisambiguationColumn(): TableColumn | undefined {
    if (this.regionType === undefined) {
      return undefined;
    }

    const columnName = this.traits.regionDisambiguationColumn;
    if (columnName !== undefined) {
      // Resolve the explicit disambiguation column.
      return this.tableModel.tableColumns.find(
        column => column.name === columnName
      );
    }

    // See if the region provider likes any of the table's other columns for
    // disambiguation.
    const disambigName = this.regionType.findDisambigVariable(
      this.tableModel.tableColumns.map(column => column.name)
    );
    if (disambigName === undefined) {
      return undefined;
    }

    return this.tableModel.tableColumns.find(
      column => column.name === disambigName
    );
  }

  /**
   * Gets a function that can be used to retrieve the value of this column for
   * a given row as a type appropriate for the column {@link #type}. For
   * example, if {@link #type} is {@link TableColumnType#scalar}, the value
   * will be a number or null.
   */
  @computed
  get valueFunctionForType(): (rowIndex: number) => string | number | null {
    if (this.type === TableColumnType.scalar) {
      const values = this.valuesAsNumbers.values;
      return function(rowIndex: number) {
        return values[rowIndex];
      };
    }

    const values = this.values;
    return function(rowIndex: number) {
      return values[rowIndex];
    };
  }

  /** Gets value as a type appropriate for the column {@link #type}. For
   * example, if {@link #type} is {@link TableColumnType#scalar}, the values
   * will be number or null. */
  @computed get valuesForType() {
    if (this.type === TableColumnType.scalar) {
      return this.valuesAsNumbers.values;
    }

    return this.values;
  }

  @computed
  get scaledValueFunctionForType(): (rowIndex: number) => number | null {
    if (this.type === TableColumnType.scalar) {
      const valuesAsNumbers = this.valuesAsNumbers;
      const minimum = valuesAsNumbers.minimum;
      const maximum = valuesAsNumbers.maximum;

      if (minimum === undefined || maximum === undefined) {
        return nullFunction;
      }

      const delta = maximum - minimum;
      if (delta === 0.0) {
        return nullFunction;
      }

      const values = valuesAsNumbers.values;
      return function(rowIndex: number) {
        const value = values[rowIndex];
        if (value === null) {
          return null;
        }
        return (value - minimum) / delta;
      };
    }

    return nullFunction;
  }

  private guessColumnTypeFromValues(): TableColumnType {
    let type: TableColumnType | undefined;

    // We'll treat it as a scalar if _most_ of values can be successfully
    // parsed as numbers, i.e. the number of successful parsings is ~10x
    // the number of failed parsings. Note that replacements with null
    // or zero are counted as neither failed nor successful.

    // We need more than 1 number to create a `scalar` column
    if (
      this.valuesAsNumbers.numberOfValidNumbers > 1 &&
      this.valuesAsNumbers.numberOfNonNumbers <=
        Math.ceil(this.valuesAsNumbers.numberOfValidNumbers * 0.1)
    ) {
      type = TableColumnType.scalar;
    } else {
      // Lots of strings that can't be parsed as numbers.
      // If there are relatively few different values, treat it as an enumeration.
      // If there are heaps of different values, treat it as just ordinary
      // free-form text.
      const uniqueValues = this.uniqueValues.values;
      if (
        // We need more than 1 unique value (including nulls)
        (this.uniqueValues.numberOfNulls ? 1 : 0) + uniqueValues.length > 1 &&
        (uniqueValues.length <= 7 ||
          // The number of unique values is less than 12% of total number of values
          // Or, each value in the column exists 8.33 times on average
          uniqueValues.length < this.values.length * 0.12)
      ) {
        type = TableColumnType.enum;
      } else {
        type = TableColumnType.text;
      }
    }
    return type;
  }

  private guessColumnTypeFromName(name: string): TableColumnType | undefined {
    const typeHintSet: TypeHintSet = [
      { hint: /^(lon|long|longitude|lng)$/i, type: TableColumnType.longitude },
      { hint: /^(lat|latitude)$/i, type: TableColumnType.latitude },
      // Hide easting column if scalar
      {
        hint: /^(easting|eastings)$/i,
        type: TableColumnType.hidden,
        typeFromValues: TableColumnType.scalar
      },
      // Hide northing column if scalar
      {
        hint: /^(northing|northings)$/i,
        type: TableColumnType.hidden,
        typeFromValues: TableColumnType.scalar
      },
      // Hide ID columns if they are scalar
      {
        hint: /^(_id_|id|fid|objectid)$/i,
        type: TableColumnType.hidden,
        typeFromValues: TableColumnType.scalar
      },
      { hint: /^(address|addr)$/i, type: TableColumnType.address },
      // Disable until we actually do something with the height data
      // {
      //   hint: /^(.*[_ ])?(depth|height|elevation|altitude)$/i,
      //   type: TableColumnType.height
      // },
      { hint: /^(.*[_ ])?(time|date)/i, type: TableColumnType.time }, // Quite general, eg. matches "Start date (AEST)".
      { hint: /^(year)$/i, type: TableColumnType.time } // Match "year" only, not "Final year" or "0-4 years".
    ];

    const match = typeHintSet.find(hint => {
      if (hint.hint.test(name)) {
        if (hint.typeFromValues) {
          return hint.typeFromValues === this.guessColumnTypeFromValues();
        }
        return true;
      }
      return false;
    });
    if (match !== undefined) {
      return match.type;
    }
    return undefined;
  }
}

const allCommas = /,/g;

function toNumber(value: string): number | null {
  // Remove commas and try to parse as a number.
  const strippedValue = value.replace(allCommas, "").replace("$", "");
  if (strippedValue.length === 0) {
    // Treat an empty string as not a number rather than as zero.
    return null;
  }

  // `Number()` requires that the entire string form a number, unlike
  // parseInt and parseFloat which allow extra non-number characters
  // at the end.
  const asNumber = Number(strippedValue);
  if (!Number.isNaN(asNumber)) {
    return asNumber;
  }
  return null;
}

function nullFunction() {
  return null;
}
