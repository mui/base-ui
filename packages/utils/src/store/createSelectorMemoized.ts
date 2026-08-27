import { lruMemoize, createSelectorCreator } from 'reselect';
import type { CreateSelectorOptions, UnknownMemoizer, Selector, weakMapMemoize } from 'reselect';
import type { CreateSelectorMemoizedFunction } from './createSelector';

/* eslint-disable no-underscore-dangle */ // __cacheKey__

const MEMOIZE_OPTIONS = {
  maxSize: 1,
  equalityCheck: Object.is,
};

const reselectCreateSelector = createSelectorCreator({
  memoize: lruMemoize,
  memoizeOptions: MEMOIZE_OPTIONS,
});

type SelectorWithArgs = ReturnType<typeof reselectCreateSelector> & { selectorArgs: any[3] };

/**
 * Creates a `createSelectorMemoized` variant with custom reselect options.
 *
 * Object-form `memoizeOptions` merge over the module defaults (`maxSize: 1`,
 * `equalityCheck: Object.is`); a bare equality function replaces them. Overriding
 * `memoize` drops the defaults entirely, since they describe `lruMemoize`.
 */
export const createSelectorMemoizedWithOptions = <
  OverrideMemoizeFunction extends UnknownMemoizer = never,
  OverrideArgsMemoizeFunction extends UnknownMemoizer = never,
>(
  options?: CreateSelectorOptions<
    typeof lruMemoize,
    typeof weakMapMemoize,
    OverrideMemoizeFunction,
    OverrideArgsMemoizeFunction
  >,
): CreateSelectorMemoizedFunction => {
  const memoizeOptions = options?.memoizeOptions;
  let resolvedOptions = options;
  if (options !== undefined) {
    if (options.memoize !== undefined) {
      // The module defaults are `lruMemoize`'s. reselect shallow-merges the creator options
      // into the call-site ones, so they would reach a custom memoizer that never asked for
      // them; clear them unless the caller supplied options of its own.
      if (memoizeOptions === undefined) {
        resolvedOptions = { ...options, memoizeOptions: undefined };
      }
    } else if (
      typeof memoizeOptions === 'object' &&
      memoizeOptions !== null &&
      !Array.isArray(memoizeOptions)
    ) {
      // Conversely, reselect lets call-site options replace the creator options wholesale,
      // which would silently drop the `Object.is` equality; merge object options instead.
      resolvedOptions = { ...options, memoizeOptions: { ...MEMOIZE_OPTIONS, ...memoizeOptions } };
    }
  }

  return (...inputs: any[]) => {
    type CacheKey = { id: number };

    const cache = new WeakMap<CacheKey, SelectorWithArgs>();
    let nextCacheId = 1;

    const combiner = inputs[inputs.length - 1];
    // In the single-function form the combiner doubles as the input selector, wired to an
    // identity selector so reselect has a dependency to key the cache on.
    const selectors = inputs.length === 1 ? [(x: any) => x, combiner] : inputs;
    const nSelectors = selectors.length - 1;
    // (s1, s2, ..., sN, a1, a2, a3) => { ... }
    // A zero-length combiner deliberately ignores every input. Any other length below the
    // selector count means Function.length under-reports the parameters (rest parameters,
    // wrapper functions), and the extra-argument wiring would silently drop arguments.
    const argsLength = combiner.length === 0 ? 0 : combiner.length - nSelectors;

    if (argsLength < 0 || argsLength > 3) {
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
        let reselectArgs: Array<Selector<any> | (() => unknown) | typeof combiner> = selectors;
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
          default: {
            reselectArgs = [
              ...selectors.slice(0, -1),
              () => selectorArgs[0],
              () => selectorArgs[1],
              () => selectorArgs[2],
              combiner,
            ];
            break;
          }
        }
        if (resolvedOptions) {
          reselectArgs = [...reselectArgs, resolvedOptions];
        }

        fn = reselectCreateSelector(...(reselectArgs as any)) as unknown as SelectorWithArgs;
        fn.selectorArgs = selectorArgs;

        cache.set(cacheKey, fn);
      }

      /* eslint-disable no-fallthrough */
      switch (argsLength) {
        case 3:
          fn.selectorArgs[2] = a3;
        case 2:
          fn.selectorArgs[1] = a2;
        case 1:
          fn.selectorArgs[0] = a1;
        case 0:
        default:
      }
      /* eslint-enable no-fallthrough */

      switch (argsLength) {
        case 0:
          return fn(state);
        case 1:
          return fn(state, a1);
        case 2:
          return fn(state, a1, a2);
        default:
          return fn(state, a1, a2, a3);
      }
    };

    return selector as any;
  };
};

/**
 * Creates a memoized selector that caches its most recent result per state object.
 *
 * The single-function form is keyed on the state's identity: every state replacement
 * re-runs the combiner and produces a new reference. Use separate input selectors (or a
 * `resultEqualityCheck` via `createSelectorMemoizedWithOptions`) when a stable result
 * reference is needed.
 *
 * The combiner can take up to three arguments beyond the input selector results, and
 * cannot have optional, default, or rest parameters, because the argument wiring relies
 * on `Function.length`.
 */
export const createSelectorMemoized: CreateSelectorMemoizedFunction =
  createSelectorMemoizedWithOptions();
