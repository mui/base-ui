import * as React from 'react';

/* eslint-disable @typescript-eslint/naming-convention */
export type float = number;
export type integer = number;
/* eslint-enable @typescript-eslint/naming-convention */

// Uppercase first letter of a string
type CapitalizeFirstLetter<S extends string> = S extends `${infer First}${infer Rest}`
  ? `${Uppercase<First>}${Rest}`
  : S;

/**
 * Append string P to all keys in T.
 * If K is provided, only append P to keys in K.
 *
 * @template T - The type to append keys to.
 * @template P - The string to append.
 * @template K - The keys to append P to.
 */
export type AppendKeys<T, P extends string, K extends string = string> = {
  [key in keyof T as key extends K ? `${key}${CapitalizeFirstLetter<P>}` : key]: T[key];
};

/**
 * Prepend string P to all keys in T.
 * If K is provided, only prepend P to keys in K.
 *
 * @template T - The type to prepend keys to.
 * @template P - The string to prepend.
 * @template K - The keys to prepend P to.
 */
export type PrependKeys<T, P extends string, K extends string = string> = {
  [key in keyof T as key extends K ? `${P}${CapitalizeFirstLetter<key>}` : key]: T[key];
};

/**
 * Combines a type with required and additional properties.
 *
 * @template P - The original type.
 * @template RequiredProps - The keys to make required.
 * @template AdditionalProps - Additional properties to include.
 */
export type DefaultizedProps<
  P extends {},
  RequiredProps extends keyof P,
  AdditionalProps extends {} = {},
> = Omit<P, RequiredProps | keyof AdditionalProps> &
  Required<Pick<P, RequiredProps>> &
  AdditionalProps;

/**
 * Distribute the `Omit` to an union.
 * `DistributiveOmit<A | B, 'key'>` returns `Omit<A, 'key'> | Omit<B, 'key'>`
 * @see {@link https://tkdodo.eu/blog/omit-for-discriminated-unions-in-type-script this blog post} for more info.
 *
 * @template T - The original union type to distribute the `Omit` over.
 * @template K - The keys to omit.
 */
export type DistributiveOmit<T, K extends keyof T> = T extends any ? Omit<T, K> : never;

export type HasProperty<T, K extends string> = K extends keyof T ? true : false;

/**
 * Makes specified keys in a type optional.
 *
 * @template T - The original type.
 * @template K - The keys to make optional.
 */
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Makes specified keys in a type required.
 *
 * @template T - The original type.
 * @template K - The keys to make required.
 */
export type MakeRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Defines the reference as `React.RefObject` for React 19 and up and `React.MutableRefObject` for React 18 and below.
 * Can be used to maintain the types between the React versions while migrating away from `React.MutableRefObject` in the codebase.
 *
 * @template T - The type to make the reference object from.
 */
// in React 19 useRef requires a parameter, so () => infer R will not match anymore
export type RefObject<T> = typeof React.useRef extends () => any
  ? React.MutableRefObject<T>
  : React.RefObject<T>;
