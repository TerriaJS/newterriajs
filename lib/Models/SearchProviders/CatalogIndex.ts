import { Document } from "flexsearch";
import { action, makeObservable, observable, runInAction } from "mobx";
import { isJsonObject, isJsonString, isJsonStringArray } from "../../Core/Json";
import loadBlob, { isZip, parseZipJsonBlob } from "../../Core/loadBlob";
import loadJson from "../../Core/loadJson";
import CatalogIndexReferenceTraits from "../../Traits/TraitsClasses/CatalogIndexReferenceTraits";
import CatalogIndexReference from "../Catalog/CatalogReferences/CatalogIndexReference";
import CommonStrata from "../Definition/CommonStrata";
import updateModelFromJson from "../Definition/updateModelFromJson";
import Terria from "../Terria";
import SearchResult from "./SearchResult";

export interface CatalogIndexFile {
  [id: string]: Partial<CatalogIndexReferenceTraits>;
}

export interface ModelIndex {
  name: string;
  knownContainerUniqueIds: string[];
}

export default class CatalogIndex {
  /** Map from share key -> id */
  readonly shareKeysMap = observable.map<string, string>();
  private _models: Map<string, CatalogIndexReference> | undefined;

  private _searchIndex:
    | Document<{ id: string; name: string; description: string }>
    | undefined; // Flex-search document index

  @observable
  private _loadPromise: Promise<void> | undefined;

  constructor(
    private readonly terria: Terria,
    private readonly url: string
  ) {
    makeObservable(this);
  }

  get models() {
    return this._models;
  }

  get searchIndex() {
    return this._searchIndex;
  }

  get loadPromise() {
    return this._loadPromise;
  }

  getModelByIdOrShareKey(modelId: string) {
    if (this.models?.has(modelId)) {
      return this.models.get(modelId);
    }

    const shareKeyId = this.shareKeysMap.get(modelId);
    if (shareKeyId) {
      return this.models?.get(shareKeyId);
    }
  }

  load() {
    if (this._loadPromise) return this._loadPromise;

    runInAction(() => (this._loadPromise = this.loadCatalogIndex()));

    return this._loadPromise!;
  }

  /** The catalog index is loaded automatically on startup.
   * It is loaded the first time loadInitSources is called (see Terria.forceLoadInitSources) */
  @action
  private async loadCatalogIndex() {
    // Load catalog index
    try {
      const url = this.terria.corsProxy.getURLProxyIfNecessary(this.url);

      const index = (
        isZip(url)
          ? await parseZipJsonBlob(await loadBlob(url))
          : await loadJson(url)
      ) as CatalogIndexFile;

      this._models = new Map<string, CatalogIndexReference>();

      /**
       * https://github.com/nextapps-de/flexsearch
       * Create search index for fields "name" and "description"
       *  - tokenize property
       *    - "full" = index every possible combination
       *    - "strict" = index whole words
       *  - resolution property = score resolution
       *
       * Note: because we have set `worker: true`, we must use async calls
       */
      this._searchIndex = new Document({
        worker: true,
        document: {
          id: "id",
          index: [
            {
              field: "name",
              tokenize: "full",
              resolution: 9
            },
            {
              field: "description",
              tokenize: "strict",
              resolution: 1
            }
          ]
        }
      });

      const indexModels = Object.entries(index);
      const promises: Promise<unknown>[] = [];

      for (let idx = 0; idx < indexModels.length; idx++) {
        const [id, model] = indexModels[idx];
        if (!isJsonObject(model, false)) return;
        const reference = new CatalogIndexReference(id, this.terria);

        updateModelFromJson(reference, CommonStrata.definition, model).logError(
          "Error ocurred adding adding catalog model reference"
        );

        if (isJsonStringArray(model.shareKeys)) {
          model.shareKeys.map((s) => this.shareKeysMap.set(s, id));
        }
        // Add model to CatalogIndexReference map
        this._models!.set(id, reference);

        // Add document to search index
        promises.push(
          this._searchIndex.addAsync(id, {
            id,
            name: isJsonString(model.name) ? model.name : "",
            description: isJsonString(model.description)
              ? model.description
              : ""
          })
        );
      }

      await Promise.all(promises);
    } catch (error) {
      this.terria.raiseErrorToUser(error, "Failed to load catalog index");
    }
  }

  public async search(q: string) {
    const results: SearchResult[] = [];
    /** Example matches object
    ```json
    [
      {
        "field": "name",
        "result": [
          "some-id-1"
        ]
      },
      {
        "field": "description",
        "result": [
          "some-id-2"
        ]
      }
    ]
    ```
*/
    if (!this.searchIndex) return [];

    const matches = await this.searchIndex.searchAsync(q);
    const matchedIds = new Set<string>();
    matches.forEach((fieldResult: any) => {
      fieldResult.result.forEach((id: string) => {
        const indexReference = this.models?.get(id);
        if (indexReference && !matchedIds.has(id)) {
          matchedIds.add(id);
          results.push(
            runInAction(
              () =>
                new SearchResult({
                  name: indexReference.name ?? indexReference.uniqueId,
                  catalogItem: indexReference
                })
            )
          );
        }
      });
    });

    return results;
  }
}
