import i18next from "i18next";
import { action } from "mobx";
import loadCsv from "../../Core/loadCsv";
import loadJson5 from "../../Core/loadJson5";
import { SearchParameterTraits } from "../../Traits/TraitsClasses/SearchableItemTraits";
import { Index, IndexRoot, IndexType, parseIndexRoot } from "./Index";
import ItemSearchProvider, {
  ItemSearchParameter,
  ItemSearchResult
} from "./ItemSearchProvider";
import joinUrl from "./joinUrl";

const t = i18next.t.bind(i18next);

type Parameter = ItemSearchParameter & { index: Index };

/**
 * An ItemSearchProvider for searching an item using a pre-generated static index set.
 *
 */
export default class IndexedItemSearchProvider extends ItemSearchProvider {
  indexRootUrl: string;
  indexRoot?: IndexRoot;
  resultsData?: Promise<Record<string, string>[]>;

  /**
   * Construct a IndexedItemSearchProvider.
   *
   * Throws an error if indexRootUrl option is not defined.
   *
   * @param options An object containing {indexRootUrl: string}
   */
  constructor(options: any, parameterOptions: SearchParameterTraits[]) {
    super(options, parameterOptions);
    const indexRootUrl = options?.indexRootUrl;
    if (typeof indexRootUrl !== "string")
      throw new Error(t("indexedItemSearchProvider.missingOptionIndexRootUrl"));
    this.indexRootUrl = indexRootUrl;
  }

  /**
   * Returns a Map of searchable parameters indexed by the parameter id.
   */
  get parameters(): Map<string, Parameter> {
    const indexes = this.indexRoot?.indexes;
    if (!indexes) return new Map();
    return new Map(
      Object.entries(indexes).map(([propertyId, index]) => [
        propertyId,
        { ...this.buildParameterForIndex(propertyId, index), index }
      ])
    );
  }

  /**
   * Returns a parameter object for the specified property.
   *
   * @param propertyId ID of the property
   * @param index The index definition of the property
   * @return The parameter object
   */
  @action
  private buildParameterForIndex(
    propertyId: string,
    index: Index
  ): ItemSearchParameter {
    const parameterOptions = this.parameterOptions.find(
      ({ id }) => id === propertyId
    );
    switch (index.type) {
      case IndexType.numeric:
        return {
          type: "numeric",
          id: propertyId,
          name: parameterOptions?.name ?? propertyId,
          range: index.range
        };
      case IndexType.enum:
        return {
          type: "enum",
          id: propertyId,
          name: parameterOptions?.name ?? propertyId,
          values: Object.entries(index.values).map(([id, { count }]) => ({
            id,
            count
          }))
        };
      case IndexType.text:
        return {
          type: "text",
          id: propertyId,
          name: parameterOptions?.name ?? propertyId,
          queryOptions: parameterOptions?.queryOptions
        };
    }
  }

  /**
   * Fetches & parses the indexRoot file and then triggers fetching of the data
   * file but does not wait for it to complete.
   */
  async initialize() {
    const indexRootUrl = this.indexRootUrl;
    const json = await loadJson5(indexRootUrl);
    try {
      this.indexRoot = parseIndexRoot(json);
      this.getOrLoadResultsData();
    } catch (parseError) {
      console.warn(parseError);
      throw new Error(
        t("indexedItemSearchProvider.errorParsingIndexRoot", { indexRootUrl })
      );
    }
  }

  getIdPropertyName(): string {
    const idPropertyName = this.indexRoot?.idProperty;
    if (!idPropertyName) throw new Error(`indexRoot is not loaded`);
    return idPropertyName;
  }

  /**
   * @returns A promise that resolves the search parameters.
   */
  async describeParameters(): Promise<ItemSearchParameter[]> {
    return [...this.parameters.values()].map(({ index, ...rest }) => rest);
  }

  /**
   * Pre-emptively load the index while the user is entering input for the
   * parameter.
   */
  loadParameterHint = (parameterId: string, valueHint: any) => {
    const parameter = this.parameters.get(parameterId);
    if (parameter) {
      parameter.index.load(this.indexRootUrl, valueHint);
    }
  };

  /**
   * Search the indexes for all the given parameter values and return the results.
   *
   * @param parameterValues A Map from parameterId to a search query
   * @returns A promise that resolves to the search results.
   */
  async search(parameterValues: Map<string, any>): Promise<ItemSearchResult[]> {
    // This is roughly what happens in this function
    // 1) For each parameter search the corresponding index
    // 2) This gives a set of matching IDs
    // 3) Lookup the data corresponding to each matching ID from resultsData
    // 4) Use the data to build the search results.

    // Iterate each parameter and search its index.
    const search = Promise.all(
      Array.from(parameterValues).map(async ([parameterId, value]) => {
        const parameter = this.parameters.get(parameterId);
        if (!parameter) throw new Error(`Unexpected parameter ${parameterId}`);
        const ids = await this.searchParameter(parameter, value);
        return ids;
      })
    );

    // Meanwhile, load resultsData
    const data = await this.getOrLoadResultsData();

    // Merge the IDs from the search into a single set
    const idSets = await search;
    const matchingIds = intersectSets(idSets);

    // Map the IDs to data and build the search result.
    const results = [...matchingIds].map(id =>
      this.buildResult(this.lookupDataForId(data, id), id)
    );
    return results;
  }

  searchParameter(parameter: Parameter, value: any): Promise<Set<number>> {
    const index = parameter.index;
    return index
      .load(this.indexRootUrl, value)
      .then(() => index.search(value, parameter.queryOptions));
  }

  /**
   * Fetch resultsData URL and return it.
   *
   * Caches the data so that subsequent calls do not result in a network request & parsing.
   *
   * @return A promise that resolves to resultsData
   */
  async getOrLoadResultsData() {
    if (this.resultsData) {
      return this.resultsData;
    }
    if (!this.indexRoot?.resultsDataUrl) {
      throw new Error(`indexRoot is not loaded`);
    }
    const resultsDataUrl = joinUrl(
      this.indexRootUrl,
      this.indexRoot.resultsDataUrl
    );
    const promise = loadCsv(resultsDataUrl, {
      dynamicTyping: true,
      header: true
    });
    this.resultsData = promise;
    return promise;
  }

  lookupDataForId(
    rows: Record<string, string>[],
    id: number
  ): Record<string, string> {
    const row = rows[id];
    if (!row) throw new Error(`No data record found for item id: ${id}`);
    return row;
  }

  /**
   * Build search result from raw data.
   *
   * @param record The resultData for the result item
   * @param dataIdx The index of the record in resultsData
   */
  buildResult(
    record: Record<string, string>,
    dataIdx: number
  ): ItemSearchResult {
    if (!this.indexRoot) throw new Error(`indexRoot is not loaded`);
    const id = record[this.indexRoot.idProperty];
    if (id === undefined) {
      throw new Error(
        `ID property not defined for data record at index ${dataIdx}`
      );
    }

    // The record can have a bunch of arbitrary properties and a few known
    // properties. We use the latitude, longitude, height & radius for
    // constructing a zoom target for the search result.
    let { latitude, longitude, height, ...properties } = record;
    const _latitude = parseFloat(latitude);
    const _longitude = parseFloat(longitude);
    const _featureHeight = parseFloat(height);
    if (isNaN(_latitude) || isNaN(_longitude) || isNaN(_featureHeight)) {
      throw new Error(
        `No valid zoom point defined for data record at index ${dataIdx}`
      );
    }

    const featureCoordinate = {
      latitudeDegrees: _latitude,
      longitudeDegrees: _longitude,
      featureHeight: _featureHeight
    };
    return {
      id,
      idPropertyName: this.indexRoot.idProperty,
      featureCoordinate,
      properties
    };
  }
}

export function intersectSets<T>(sets: Set<T>[]): Set<T> {
  if (sets.length === 0) return new Set();
  return sets
    .sort((a, b) => a.size - b.size)
    .reduce((a, b) => new Set([...a].filter(x => b.has(x))));
}
