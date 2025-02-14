import {
  action,
  computed,
  observable,
  runInAction,
  toJS,
  makeObservable
} from "mobx";
import filterOutUndefined from "../../Core/filterOutUndefined";
import flatten from "../../Core/flatten";
import isDefined from "../../Core/isDefined";
import TerriaError from "../../Core/TerriaError";
import { getObjectId } from "../../Traits/ArrayNestedStrataMap";
import { ObjectArrayTrait } from "../../Traits/Decorators/objectArrayTrait";
import { ModelId } from "../../Traits/ModelReference";
import ModelTraits from "../../Traits/ModelTraits";
import TraitsConstructor from "../../Traits/TraitsConstructor";
import Terria from "../Terria";
import addModelStrataView from "./addModelStrataView";
import createStratumInstance from "./createStratumInstance";
import { isLoadableStratum } from "./LoadableStratum";
import ModelType, {
  ArrayElementTypes,
  BaseModel,
  ModelConstructor,
  ModelInterface
} from "./Model";
import StratumFromTraits from "./StratumFromTraits";
import StratumOrder from "./StratumOrder";

export default function CreateModel<T extends TraitsConstructor<ModelTraits>>(
  Traits: T
): ModelConstructor<ModelType<InstanceType<T>>> {
  type StratumTraits = StratumFromTraits<InstanceType<T>>;

  abstract class Model
    extends BaseModel
    implements ModelInterface<InstanceType<T>>
  {
    abstract get type(): string;
    static readonly TraitsClass = Traits;
    static readonly traits = Traits.traits;
    readonly traits = Traits.traits;
    readonly TraitsClass: TraitsConstructor<InstanceType<T>> = Traits as any;
    readonly strata: Map<string, StratumTraits>;

    /**
     * Gets the uniqueIds of models that are known to contain this one.
     * This is important because strata sometimes flow from container to
     * container, so the properties of this model may not be complete
     * if the container isn't loaded yet. It's also important for locating
     * this model in a hierarchical catalog.
     */
    @observable
    readonly knownContainerUniqueIds: string[] = [];

    constructor(
      id: string | undefined,
      terria: Terria,
      sourceReference: BaseModel | undefined,
      strata: Map<string, StratumTraits> | undefined
    ) {
      super(id, terria, sourceReference);
      makeObservable(this);
      this.strata = strata || observable.map<string, StratumTraits>();
    }

    dispose() {}

    private getOrCreateStratum(id: string): StratumTraits {
      let result = this.strata.get(id);
      if (!result) {
        const newStratum = createStratumInstance(Traits);
        runInAction(() => {
          this.strata.set(id, newStratum);
        });
        result = newStratum;
      }
      return result;
    }

    duplicateModel(newId: ModelId, sourceReference?: BaseModel): this {
      let newModel: this;
      try {
        newModel = new (this.constructor as any)(
          newId,
          this.terria,
          sourceReference
        );
      } catch (_e) {
        throw TerriaError.from(`Failed to create model \`"${newId}"\``);
      }

      this.strata.forEach((stratum, stratumId) => {
        try {
          const newStratum = isLoadableStratum(stratum)
            ? stratum.duplicateLoadableStratum(newModel)
            : createStratumInstance(Traits, toJS(stratum));
          newModel.strata.set(stratumId, newStratum);
        } catch (e) {
          throw TerriaError.from(e, {
            message: `Failed to duplicate stratum \`${stratumId}\` for model \`${newId}\`.`,
            importance: -1
          });
        }
      });
      return newModel;
    }

    @computed
    get strataTopToBottom(): ReadonlyMap<string, StratumTraits> {
      return StratumOrder.sortTopToBottom(this.strata);
    }

    @computed
    get strataBottomToTop(): ReadonlyMap<string, StratumTraits> {
      return StratumOrder.sortBottomToTop(this.strata);
    }

    @action
    setTrait<Key extends keyof StratumTraits>(
      stratumId: string,
      trait: Key,
      value: StratumTraits[Key]
    ): void {
      this.getOrCreateStratum(stratumId)[trait] = value;
    }

    getTrait<Key extends keyof StratumTraits>(
      stratumId: string,
      trait: Key
    ): StratumTraits[Key] {
      return this.getOrCreateStratum(stratumId)[trait];
    }

    addObject<Key extends keyof ArrayElementTypes<InstanceType<T>>>(
      stratumId: string,
      traitId: Key,
      objectId?: string | undefined
    ): ModelType<ArrayElementTypes<InstanceType<T>>[Key]> | undefined {
      const trait = this.traits[traitId as string] as ObjectArrayTrait<
        ArrayElementTypes<InstanceType<T>>[Key]
      >;
      const nestedTraitsClass = trait.type;
      const newStratum = createStratumInstance(nestedTraitsClass);

      const stratum: any = this.getOrCreateStratum(stratumId);
      let array = stratum[traitId];
      if (array === undefined) {
        stratum[traitId] = [];
        array = stratum[traitId];
      }

      // If objectID is provided, set idProperty and then return new object
      if (isDefined(objectId)) {
        (newStratum as any)[trait.idProperty] = objectId;
        array.push(newStratum);

        const models: readonly ModelType<
          ArrayElementTypes<InstanceType<T>>[Key]
        >[] = (this as any)[traitId];
        return models.find(
          (o: any, i: number) =>
            getObjectId(trait.idProperty, o, i) === objectId
        );
      }
      // If no objectID is provided, we create a new object the end of the array (across all strata)
      // This method `isRemoval` and `idProperty="index"` into account.
      else {
        let maxIndex = -1;
        this.strata.forEach((s) =>
          (s[traitId] as Array<unknown> | undefined)?.forEach(
            (_e, idx) => (maxIndex = idx > maxIndex ? idx : maxIndex)
          )
        );

        // Make array in this stratum the same length as largest array across all strata
        for (let i = array.length; i <= maxIndex; i++) {
          array[i] = createStratumInstance(nestedTraitsClass);
        }

        // Add new object at the end of the array
        array[maxIndex + 1] = newStratum;

        // Return newly created model
        const models: readonly ModelType<
          ArrayElementTypes<InstanceType<T>>[Key]
        >[] = (this as any)[traitId];
        return models[models.length - 1];
      }
    }

    /** Return full list of knownContainerUniqueIds.
     * This will recursively traverse tree of knownContainerUniqueIds models to return full list of dependencies
     */
    @computed
    get completeKnownContainerUniqueIds(): string[] {
      const findContainers = (model: BaseModel): string[] => [
        ...model.knownContainerUniqueIds,
        ...flatten(
          filterOutUndefined(
            model.knownContainerUniqueIds.map((parentId) => {
              const parent = this.terria.getModelById(BaseModel, parentId);
              if (parent) {
                return findContainers(parent);
              }
            })
          )
        )
      ];

      return findContainers(this).reverse();
    }
  }

  addModelStrataView(Model, Traits);
  return Model as any;
}
