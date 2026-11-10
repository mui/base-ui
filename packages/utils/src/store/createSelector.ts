import type { Selector } from 'reselect';

type Fn = (...args: any[]) => any;
/**
 * The NoOptionalParams type is a utility type that checks if a function has optional or default parameters.
 * If the function has optional or default parameters, it returns a string literal type with an error message.
 * Otherwise, it returns the original function type.
 *
 * This is used to enforce that the combiner function passed to createSelector does not have optional or default parameters,
 * as memoization relies on the Function.length property, which does not account for optional or default parameters.
 */
type NoOptionalParams<F extends Fn> =
  Parameters<F> extends Required<Parameters<F>>
    ? F
    : 'Combiner cannot have optional or default parameters because memoization relies on Function.length';

/**
 * The combiner parameters that remain once the input selector results are accounted for.
 * In the single-function form the first parameter is the state, not a selector result.
 */
type ExtraParams<
  Selectors extends ReadonlyArray<Fn>,
  Combiner extends Fn,
> = Selectors['length'] extends 0
  ? DropFirst<Parameters<Combiner>>
  : MergeParams<ReturnTypes<Selectors>, Parameters<Combiner>>;

type LengthOf<T> = T extends readonly unknown[] ? T['length'] : number;

/**
 * Both variants forward at most three arguments beyond the input selector results, so a
 * statically-known count above three is rejected. An open-ended count cannot be validated
 * statically: it occurs both for rest parameters and for combiners typed contextually,
 * which are indistinguishable here. `createSelectorMemoized` throws on the parameter
 * counts this check cannot see; `createSelector` passes three arguments regardless.
 */
type ValidExtraArgs<Selectors extends ReadonlyArray<Fn>, Combiner extends Fn> =
  number extends LengthOf<ExtraParams<Selectors, Combiner>>
    ? NoOptionalParams<Combiner>
    : LengthOf<ExtraParams<Selectors, Combiner>> extends 0 | 1 | 2 | 3
      ? NoOptionalParams<Combiner>
      : 'Combiner accepts up to three arguments beyond the input selector results';

/**
 * `createSelector` dispatches through unrolled fixed arities and supports at most seven
 * input selectors. A non-tuple selector list has no statically known count and passes;
 * the runtime throws for it instead. The single-function form is returned verbatim, so it
 * keeps its own signature and is not bound by the extra-argument limit.
 */
type ValidCombiner<
  Selectors extends ReadonlyArray<Fn>,
  Combiner extends Fn,
> = Selectors['length'] extends 0
  ? NoOptionalParams<Combiner>
  : number extends Selectors['length']
    ? NoOptionalParams<Combiner>
    : Selectors['length'] extends 1 | 2 | 3 | 4 | 5 | 6 | 7
      ? ValidExtraArgs<Selectors, Combiner>
      : 'Up to seven input selectors are supported';

/**
 * The type of `createSelector`.
 */
export type CreateSelectorFunction = <
  const Args extends any[],
  const Selectors extends ReadonlyArray<Selector<any>>,
  const Combiner extends (...args: readonly [...ReturnTypes<Selectors>, ...Args]) => any,
>(
  ...items: [...Selectors, ValidCombiner<Selectors, Combiner>]
) => (
  ...args: Selectors['length'] extends 0
    ? Parameters<Combiner>
    : [
        StateFromSelectorList<Selectors>,
        ...MergeParams<ReturnTypes<Selectors>, Parameters<Combiner>>,
      ]
) => ReturnType<Combiner>;

/**
 * The type of `createSelectorMemoized`. Unlike `createSelector`, the memoized runtime
 * dispatches on Function.length, and the single-function form still requires the state
 * object because it carries the cache key.
 */
export type CreateSelectorMemoizedFunction = <
  const Args extends any[],
  const Selectors extends ReadonlyArray<Selector<any>>,
  const Combiner extends (...args: readonly [...ReturnTypes<Selectors>, ...Args]) => any,
>(
  ...items: [...Selectors, ValidExtraArgs<Selectors, Combiner>]
) => (
  ...args: Selectors['length'] extends 0
    ? Parameters<Combiner> extends []
      ? [state: object]
      : MergeParams<ReturnTypes<Selectors>, Parameters<Combiner>>
    : [
        StateFromSelectorList<Selectors>,
        ...MergeParams<ReturnTypes<Selectors>, Parameters<Combiner>>,
      ]
) => ReturnType<Combiner>;

type StateFromSelectorList<Selectors extends readonly any[]> = Selectors extends [
  f: infer F,
  ...other: infer R,
]
  ? StateFromSelector<F> extends StateFromSelectorList<R>
    ? StateFromSelector<F>
    : StateFromSelectorList<R>
  : {};

type StateFromSelector<T> = T extends (first: infer F, ...args: any[]) => any ? F : never;

type DropFirst<T> = T extends [any, ...infer Xs] ? Xs : [];

type ReturnTypes<FunctionsArray extends readonly Fn[]> = {
  [Index in keyof FunctionsArray]: FunctionsArray[Index] extends FunctionsArray[number]
    ? ReturnType<FunctionsArray[Index]>
    : never;
};

type MergeParams<
  STypes extends readonly unknown[],
  CTypes extends readonly unknown[],
> = STypes['length'] extends 0 ? CTypes : MergeParams<DropFirst<STypes>, DropFirst<CTypes>>;

/**
 * Creates a selector function that can be used to derive values from the store's state.
 *
 * The combiner function can have up to three additional parameters, but it **cannot have optional or default parameters**.
 *
 * This function accepts up to seven input selectors plus a combiner and combines them into a single selector function.
 * The resulting selector will take the state from the combined selectors and any additional parameters required by the combiner.
 *
 * The return type of the resulting selector is determined by the return type of the combiner function.
 *
 * @example
 * const selector = createSelector(
 *  (state) => state.disabled
 * );
 *
 * @example
 * const selector = createSelector(
 *   (state) => state.disabled,
 *   (state) => state.open,
 *   (disabled, open) => ({ disabled, open })
 * );
 */
/* eslint-disable id-denylist */
export const createSelector = ((
  a: Function,
  b?: Function,
  c?: Function,
  d?: Function,
  e?: Function,
  f?: Function,
  g?: Function,
  h?: Function,
  ...other: any[]
) => {
  if (other.length > 0) {
    throw new Error('Unsupported number of selectors');
  }

  let selector: any;

  if (a && b && c && d && e && f && g && h) {
    selector = (state: any, a1: any, a2: any, a3: any) => {
      const va = a(state, a1, a2, a3);
      const vb = b(state, a1, a2, a3);
      const vc = c(state, a1, a2, a3);
      const vd = d(state, a1, a2, a3);
      const ve = e(state, a1, a2, a3);
      const vf = f(state, a1, a2, a3);
      const vg = g(state, a1, a2, a3);
      return h(va, vb, vc, vd, ve, vf, vg, a1, a2, a3);
    };
  } else if (a && b && c && d && e && f && g) {
    selector = (state: any, a1: any, a2: any, a3: any) => {
      const va = a(state, a1, a2, a3);
      const vb = b(state, a1, a2, a3);
      const vc = c(state, a1, a2, a3);
      const vd = d(state, a1, a2, a3);
      const ve = e(state, a1, a2, a3);
      const vf = f(state, a1, a2, a3);
      return g(va, vb, vc, vd, ve, vf, a1, a2, a3);
    };
  } else if (a && b && c && d && e && f) {
    selector = (state: any, a1: any, a2: any, a3: any) => {
      const va = a(state, a1, a2, a3);
      const vb = b(state, a1, a2, a3);
      const vc = c(state, a1, a2, a3);
      const vd = d(state, a1, a2, a3);
      const ve = e(state, a1, a2, a3);
      return f(va, vb, vc, vd, ve, a1, a2, a3);
    };
  } else if (a && b && c && d && e) {
    selector = (state: any, a1: any, a2: any, a3: any) => {
      const va = a(state, a1, a2, a3);
      const vb = b(state, a1, a2, a3);
      const vc = c(state, a1, a2, a3);
      const vd = d(state, a1, a2, a3);
      return e(va, vb, vc, vd, a1, a2, a3);
    };
  } else if (a && b && c && d) {
    selector = (state: any, a1: any, a2: any, a3: any) => {
      const va = a(state, a1, a2, a3);
      const vb = b(state, a1, a2, a3);
      const vc = c(state, a1, a2, a3);
      return d(va, vb, vc, a1, a2, a3);
    };
  } else if (a && b && c) {
    selector = (state: any, a1: any, a2: any, a3: any) => {
      const va = a(state, a1, a2, a3);
      const vb = b(state, a1, a2, a3);
      return c(va, vb, a1, a2, a3);
    };
  } else if (a && b) {
    selector = (state: any, a1: any, a2: any, a3: any) => {
      const va = a(state, a1, a2, a3);
      return b(va, a1, a2, a3);
    };
  } else if (a) {
    selector = a;
  } else {
    throw /* minify-error-disabled */ new Error('Missing arguments');
  }

  return selector;
}) as unknown as CreateSelectorFunction;
/* eslint-enable id-denylist */
