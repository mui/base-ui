/* eslint-disable no-underscore-dangle */ // __cacheKey__

type CacheKey = object;
type StateWithCacheKey = { __cacheKey__?: CacheKey | undefined };

/**
 * Creates a tiny per-store memoized selector for the common case where
 * a single selected input should be cached by reference equality.
 *
 * This mirrors the `__cacheKey__` ownership model of `createSelectorMemoized`
 * without pulling in `reselect`.
 */
export function createSelectorMemoizedLite<State extends object, Selected, Result>(
  selector: (state: State) => Selected,
  combiner: (selected: Selected) => Result,
): (state: State) => Result {
  const cache = new WeakMap<CacheKey, { selected: Selected; result: Result }>();

  return (state: State) => {
    const stateWithCacheKey = state as State & StateWithCacheKey;
    const selected = selector(state);

    let cacheKey = stateWithCacheKey.__cacheKey__;
    if (!cacheKey) {
      cacheKey = {};
      stateWithCacheKey.__cacheKey__ = cacheKey;
    }

    const cached = cache.get(cacheKey);
    if (cached?.selected === selected) {
      return cached.result;
    }

    const result = combiner(selected);
    cache.set(cacheKey, { selected, result });
    return result;
  };
}
