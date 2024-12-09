import TraitsConstructor from "./TraitsConstructor";
import ModelTraits from "./ModelTraits";
import filterOutUndefined from "../Core/filterOutUndefined";

/**
 * Mixes together traits classes to produce a new traits class.
 * @param Traits1
 * @param Traits2
 * @param Traits3
 * @param Traits4
 * @param Traits5
 * @param Traits6
 * @param Traits7
 * @param Traits8
 * @param Traits9
 * @param Traits10
 * @param Traits11
 * @param Traits12
 * @param Traits13
 * @param Traits14
 */
export default function mixTraits<
  T1 extends ModelTraits = ModelTraits,
  T2 extends ModelTraits = ModelTraits,
  T3 extends ModelTraits = ModelTraits,
  T4 extends ModelTraits = ModelTraits,
  T5 extends ModelTraits = ModelTraits,
  T6 extends ModelTraits = ModelTraits,
  T7 extends ModelTraits = ModelTraits,
  T8 extends ModelTraits = ModelTraits,
  T9 extends ModelTraits = ModelTraits,
  T10 extends ModelTraits = ModelTraits,
  T11 extends ModelTraits = ModelTraits,
  T12 extends ModelTraits = ModelTraits,
  T13 extends ModelTraits = ModelTraits,
  T14 extends ModelTraits = ModelTraits
>(
  Traits1?: TraitsConstructor<T1>,
  Traits2?: TraitsConstructor<T2>,
  Traits3?: TraitsConstructor<T3>,
  Traits4?: TraitsConstructor<T4>,
  Traits5?: TraitsConstructor<T5>,
  Traits6?: TraitsConstructor<T6>,
  Traits7?: TraitsConstructor<T7>,
  Traits8?: TraitsConstructor<T8>,
  Traits9?: TraitsConstructor<T9>,
  Traits10?: TraitsConstructor<T10>,
  Traits11?: TraitsConstructor<T11>,
  Traits12?: TraitsConstructor<T12>,
  Traits13?: TraitsConstructor<T13>,
  Traits14?: TraitsConstructor<T14>
): TraitsConstructor<
  T1 & T2 & T3 & T4 & T5 & T6 & T7 & T8 & T9 & T10 & T11 & T12 & T13 & T14
> {
  const traitsClasses = filterOutUndefined([
    Traits1,
    Traits2,
    Traits3,
    Traits4,
    Traits5,
    Traits6,
    Traits7,
    Traits8,
    Traits9,
    Traits10,
    Traits11,
    Traits12,
    Traits13,
    Traits14
  ]);
  const traitsInstances = traitsClasses.map((TraitsClass) => new TraitsClass());
  const keysValues = traitsInstances.reduce(
    (result, traitsInstance) => {
      return result.concat(
        Object.keys(traitsInstance).map((property) => ({
          key: property,
          value: (traitsInstance as any)[property]
        }))
      );
    },
    [] as Array<{ key: string; value: any }>
  );

  class Mixed extends ModelTraits {
    static readonly traits: any = {};
    constructor() {
      super();
      keysValues.forEach((kv) => {
        (this as any)[kv.key] = kv.value;
      });
    }
  }

  traitsClasses.forEach((traitsClass) => {
    Object.keys(traitsClass.traits).forEach((trait) => {
      Mixed.traits[trait] = traitsClass.traits[trait];
    });
  });

  return Mixed as any;
}
