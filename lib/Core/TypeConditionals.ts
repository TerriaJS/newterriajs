// Some conditionals are based on the approach described here: https://stackoverflow.com/a/49579497

/**
 * Resolves to `Then` if a conditional type is `true` or `Else` if it is false.
 */
export type If<C extends boolean, Then, Else> = [C] extends [true]
  ? Then
  : Else;

/**
 * Resolves to `true` if both conditionals are `true`, or `false` if either is `false`.
 */
export type And<A extends boolean, B extends boolean> = [A] extends [true]
  ? [B] extends [true]
    ? true
    : false
  : false;

/**
 * Resolves to `true` if any of the provided conditionals are `true`, or `false` if all are `false`.
 */
export type Or<
  A extends boolean,
  B extends boolean,
  C extends boolean = false,
  D extends boolean = false,
  E extends boolean = false,
  F extends boolean = false,
  G extends boolean = false,
  H extends boolean = false
> = [A] extends [true]
  ? true
  : [B] extends [true]
    ? true
    : [C] extends [true]
      ? true
      : [D] extends [true]
        ? true
        : [E] extends [true]
          ? true
          : [F] extends [true]
            ? true
            : [G] extends [true]
              ? true
              : [H] extends [true]
                ? true
                : false;

/**
 * Inverts a conditional, changing `true` to `false` and `false` to `true`.
 */
export type Not<C extends boolean> = [C] extends [true] ? false : true;

/**
 * Resolves to `true` if the two types are identical; otherwise, `false`.
 */
export type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

/**
 * Resolves to `true` if `A` extends `B`; otherwise, `false`.
 */
export type Extends<A, B> = A extends B ? true : false;

type Writable<T, P extends keyof T = keyof T> = { -readonly [K in P]: T[P] };

type WritableKeys<T> = {
  [P in keyof T]-?: If<Equals<Pick<T, P>, Writable<Pick<T, P>>>, P, never>;
}[keyof T];

type ReadonlyKeys<T> = {
  [P in keyof T]-?: If<Equals<Pick<T, P>, Writable<Pick<T, P>>>, never, P>;
}[keyof T];

/**
 * Resolves to `true` if `T` is an `Array`; otherwise, `false`.
 */
export type IsWritableArray<T> = Extends<T, Array<any>>;

/**
 * Resolves to `true` if `T` is a `ReadOnlyArray` but not an `Array`; otherwise, `false`.
 */
export type IsReadonlyArray<T> = And<
  Extends<T, ReadonlyArray<any>>,
  Not<IsWritableArray<T>>
>;

/**
 * Resolves to `true` if a given property is marked readonly or if it only has a getter; otherwise, `false`.
 */
export type IsReadonly<T, K extends keyof T> = Extends<K, ReadonlyKeys<T>>;

/**
 * Resolves to `true` if a given property is not readonly or if it has both a getter and a setter; otherwise, `false`.
 */
export type IsWritable<T, K extends keyof T> = Extends<K, WritableKeys<T>>;

/**
 * Resolves to `true` if a type can have the value `undefined`; otherwise, false.
 */
export type AllowsUndefined<T> = T | undefined extends T ? true : false;

/**
 * Resolves to `true` if a type can have the value `null`; otherwise, false.
 */
export type AllowsNull<T> = T | null extends T ? true : false;
