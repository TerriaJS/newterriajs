import loadCsv from "../../Core/loadCsv";
import joinUrl from "./joinUrl";
import { IndexBase, IndexType } from "./Types";

// IDs of enum to search
type EnumSearchQuery = string[];

// An enum value definition.
export type EnumValue = {
  count: number; // Number of objects this enum value has
  url: string; // Url of the CSV file containing the enum index
  dataRowIds?: Promise<number[]>; // Array of IDs
};

/**
 * An index used for searching enums (fixed set of strings).
 *
 * Enum indexes contains sub-indexes, one for each enum value.
 * The sub-index is simply an array of IDs that has the enum value.
 * Searching for an enum value simply returns the IDs array for that value.
 */
export default class EnumIndex implements IndexBase<EnumSearchQuery> {
  readonly type = IndexType.enum;

  /**
   * Constructs an EnumIndex.
   *
   * @param values An object mapping an enum value string to the value definition.
   */
  constructor(readonly values: Record<string, EnumValue>) {}

  /**
   * Load an enum index.
   *
   * @param indexRootUrl The URL of the index root directory.
   * @param searchHint   The enum values that will be searched. We only load the sub-indexes for these values.
   */
  async load(indexRootUrl: string, searchHint: EnumSearchQuery): Promise<void> {
    const enumValueIds = searchHint;
    const promises = enumValueIds.map(async valueId => {
      const value = this.values[valueId];
      if (value.dataRowIds) return Promise.resolve();
      const promise = loadCsv(joinUrl(indexRootUrl, value.url), {
        dynamicTyping: true,
        header: true
      }).then(rows => rows.map(({ dataRowId }) => dataRowId));
      value.dataRowIds = promise;
      return promise;
    });
    await Promise.all(promises);
  }

  /**
   * Search the enum index.
   *
   * @param  enumValueIds The enum values to be searched
   * @return Set of IDs for all matching enum values.
   */
  async search(enumValueIds: EnumSearchQuery): Promise<Set<number>> {
    const idSets = await Promise.all(
      enumValueIds.map(async valueId => {
        const value = this.values[valueId];
        if (!value) throw new Error(`Not an enum value: ${valueId}`);
        if (!value.dataRowIds)
          throw new Error(`Index for enum value ${valueId} is not loaded`);
        return await value.dataRowIds;
      })
    );
    const ids = flatten(idSets);
    return new Set(ids);
  }
}

function flatten<T>(array: T[][]): T[] {
  const flattened = array.reduce((acc, a) => acc.concat(a), []);
  return flattened;
}
