import { lruMemoize, createSelectorCreator, Selector } from 'reselect';

/* eslint-disable no-underscore-dangle */ // __cacheKey__

const reselectCreateSelector = createSelectorCreator({
  memoize: lruMemoize,
  memoizeOptions: {
    maxSize: 1,
    equalityCheck: Object.is,
  },
});

type Fn = (...args: any[]) => any;
type SelectorWithArgs = ReturnType<typeof reselectCreateSelector> & { selectorArgs: any[3] };

type CreateSelectorFunction = <
  const Args extends any[],
  const Selectors extends ReadonlyArray<Selector<any>>,
  const Combiner extends (...args: readonly [...ReturnTypes<Selectors>, ...Args]) => any,
>(
  ...items: [...Selectors, Combiner]
) => (
  ...args: Selectors['length'] extends 0
    ? MergeParams<ReturnTypes<Selectors>, Parameters<Combiner>>
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
 * The selector can take up to three additional arguments that can be used in the selector logic.
 * This function accepts up to six functions and combines them into a single selector function.
 * The last parameter is the combiner function that combines the results of the previous selectors.
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
 *
 */
/* eslint-disable id-denylist */
export const createSelector = ((
  a: Function,
  b?: Function,
  c?: Function,
  d?: Function,
  e?: Function,
  f?: Function,
  ...other: any[]
) => {
  if (other.length > 0) {
    throw new Error('Unsupported number of selectors');
  }

  let selector: any;

  if (a && b && c && d && e && f) {
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

export const createSelectorMemoized: CreateSelectorFunction = (...selectors: any[]) => {
  type CacheKey = { id: number };

  const cache = new WeakMap<CacheKey, SelectorWithArgs>();
  let nextCacheId = 1;

  const combiner = selectors[selectors.length - 1];
  const nSelectors = selectors.length - 1 || 1;
  // (s1, s2, ..., sN, a1, a2, a3) => { ... }
  const argsLength = combiner.length - nSelectors;

  if (argsLength > 3) {
    throw new Error('Unsupported number of arguments');
  }

  const selector = (state: any, a1: any, a2: any, a3: any) => {
    let cacheKey = state.__cacheKey__;
    if (!cacheKey) {
      cacheKey = { id: nextCacheId };
      state.__cacheKey__ = cacheKey;
      nextCacheId += 1;
    }

    let fn = cache.get(cacheKey);
    if (!fn) {
      let reselectArgs = selectors;
      const selectorArgs = [undefined, undefined, undefined];
      switch (argsLength) {
        case 0:
          break;
        case 1: {
          reselectArgs = [...selectors.slice(0, -1), () => selectorArgs[0], combiner];
          break;
        }
        case 2: {
          reselectArgs = [
            ...selectors.slice(0, -1),
            () => selectorArgs[0],
            () => selectorArgs[1],
            combiner,
          ];
          break;
        }
        case 3: {
          reselectArgs = [
            ...selectors.slice(0, -1),
            () => selectorArgs[0],
            () => selectorArgs[1],
            () => selectorArgs[2],
            combiner,
          ];
          break;
        }
        default:
          throw new Error('Unsupported number of arguments');
      }

      fn = reselectCreateSelector(...(reselectArgs as any)) as unknown as SelectorWithArgs;
      fn.selectorArgs = selectorArgs;

      cache.set(cacheKey, fn);
    }

    fn.selectorArgs[0] = a1;
    fn.selectorArgs[1] = a2;
    fn.selectorArgs[2] = a3;

    // prettier-ignore
    switch (argsLength) {
      case 0: return fn(state);
      case 1: return fn(state, a1);
      case 2: return fn(state, a1, a2);
      case 3: return fn(state, a1, a2, a3);
      default:
        throw /* minify-error-disabled */ new Error('unreachable');
    }
  };

  return selector as any;
};
