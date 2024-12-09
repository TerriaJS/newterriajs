import joinUrl from "./joinUrl";
import loadCsv from "../../Core/loadCsv";
import { IndexBase, IndexType } from "./Types";
import sortedIndexBy from "lodash-es/sortedIndexBy";
import sortedLastIndexBy from "lodash-es/sortedLastIndexBy";

// Minimum and maxiumum values in a numeric range
export type NumericRange = { min: number; max: number };

// Start and end numbers
type NumericSearchQuery = {
  start: number;
  end: number;
};

/**
 * An index used for searching numeric values.
 *
 * It is represented as an array of [id, value] pairs sorted by the value.
 * Searching is done by performing a binary search on the array.
 */
export default class NumericIndex implements IndexBase<NumericSearchQuery> {
  readonly type = IndexType.numeric;

  idValuePairs?: Promise<{ dataRowId: number; value: number }[]>;

  /**
   * Constructs a NumericIndex.
   *
   * @param url    Url of the NumericIndex CSV file. This could be a relative URL.
   * @param range  The maximum and minimum value in the index.
   */
  constructor(
    readonly url: string,
    readonly range: NumericRange
  ) {}

  /**
   * Load a numeric index.
   *
   * @param indexRootUrl   The URL of the index root directory
   * @param _valueHint     Ignored for NumericIndex.
   */
  async load(
    indexRootUrl: string,
    _valueHint: NumericSearchQuery
  ): Promise<void> {
    if (this.idValuePairs) return;
    const indexUrl = joinUrl(indexRootUrl, this.url);
    const promise = loadCsv(indexUrl, {
      dynamicTyping: true,
      header: true
    });
    this.idValuePairs = promise;
    return promise.then(() => {});
  }

  /**
   * Search the numeric index for values between the start and end value in NumericSearchQuery.
   *
   * @param value The start and end value to be searched.
   * @return Set of IDs that matches the search value.
   */
  async search(value: NumericSearchQuery): Promise<Set<number>> {
    if (!this.idValuePairs) throw new Error(`Index not loaded`);
    const range = this.range;
    const idValuePairs = await this.idValuePairs;
    const startValue = value.start === undefined ? range.min : value.start;
    const endValue = value.end === undefined ? range.max : value.end;
    const startIndex = sortedIndexBy(
      idValuePairs,
      { dataRowId: 0, value: startValue },
      (entry) => entry.value
    );
    const endIndex = sortedLastIndexBy(
      idValuePairs,
      { dataRowId: 0, value: endValue },
      (entry) => entry.value
    );
    const matchingIds = idValuePairs
      .slice(startIndex, endIndex)
      .map(({ dataRowId }) => dataRowId);
    return new Set(matchingIds);
  }
}
