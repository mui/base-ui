import { lruMemoize } from './lruMemoize';
import { weakMapMemoize } from './weakMapMemoize';
import type { CreateSelectorFunction } from './createSelector';

/* eslint-disable no-underscore-dangle */ // __cacheKey__

type SelectorWithArgs = ((...args: any[]) => any) & { selectorArgs: any[3] };

/**
 * Combines input selectors and a combiner into a single memoized selector:
 * the combiner is memoized on its input values (latest call only),
 * while the selector itself is memoized on its arguments with a weak cache.
 */
function createMemoizedSelector(selectorsAndCombiner: Function[]): SelectorWithArgs {
  const combiner = selectorsAndCombiner[selectorsAndCombiner.length - 1];
  const inputSelectors = selectorsAndCombiner.slice(0, -1);
  const memoizedCombiner = lruMemoize(combiner as (...args: any[]) => any, {
    equalityCheck: Object.is,
  });

  return weakMapMemoize((...args: any[]) => {
    const values = inputSelectors.map((inputSelector) => inputSelector(...args));
    return memoizedCombiner(...values);
  }) as unknown as SelectorWithArgs;
}

export const createSelectorMemoized: CreateSelectorFunction = (...inputs: any[]) => {
  type CacheKey = { id: number };

  const cache = new WeakMap<CacheKey, SelectorWithArgs>();
  let nextCacheId = 1;

  const combiner = inputs[inputs.length - 1];
  const nSelectors = inputs.length - 1 || 1;
  // (s1, s2, ..., sN, a1, a2, a3) => { ... }
  const argsLength = Math.max(combiner.length - nSelectors, 0);

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
      // Wrap a single combiner with an identity input selector so it still
      // receives the state.
      const selectors = inputs.length === 1 ? [(x: any) => x, combiner] : inputs;
      let selectorsAndCombiner = selectors;
      const selectorArgs = [undefined, undefined, undefined];
      switch (argsLength) {
        case 0:
          break;
        case 1: {
          selectorsAndCombiner = [...selectors.slice(0, -1), () => selectorArgs[0], combiner];
          break;
        }
        case 2: {
          selectorsAndCombiner = [
            ...selectors.slice(0, -1),
            () => selectorArgs[0],
            () => selectorArgs[1],
            combiner,
          ];
          break;
        }
        case 3: {
          selectorsAndCombiner = [
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

      fn = createMemoizedSelector(selectorsAndCombiner as Function[]);
      fn.selectorArgs = selectorArgs;

      cache.set(cacheKey, fn);
    }

    fn.selectorArgs[0] = a1;
    fn.selectorArgs[1] = a2;
    fn.selectorArgs[2] = a3;

    switch (argsLength) {
      case 0:
        return fn(state);
      case 1:
        return fn(state, a1);
      case 2:
        return fn(state, a1, a2);
      case 3:
        return fn(state, a1, a2, a3);
      default:
        throw /* minify-error-disabled */ new Error('unreachable');
    }
  };

  return selector as any;
};
