type EqualityFn = (a: any, b: any) => boolean;

export interface LruMemoizeOptions {
  /**
   * Function used to compare each new argument against the cached one.
   * @default (a, b) => a === b
   */
  equalityCheck?: EqualityFn;
  /**
   * When provided and a new result is computed, the cached result is returned
   * instead if it is considered equal by this function, preserving referential
   * stability.
   */
  resultEqualityCheck?: EqualityFn;
  /**
   * The number of previous calls to keep in the cache.
   *
   * Only a single entry is cached. The option is kept for API compatibility but
   * values greater than `1` are ignored, as the consuming code never relies on a
   * larger cache.
   * @default 1
   */
  maxSize?: number;
}

interface CacheEntry {
  args: IArguments | any[];
  value: any;
}

const referenceEqualityCheck: EqualityFn = (a, b) => a === b;

/**
 * Memoizes a function, caching the result of its most recent call.
 * The arguments of the last call are compared with the provided `equalityCheck`.
 *
 * Only the `maxSize: 1` (singleton) behaviour is implemented, since that is the
 * only cache size the consuming code uses.
 */
export function lruMemoize<F extends (...args: any[]) => any>(
  func: F,
  equalityCheckOrOptions?: EqualityFn | LruMemoizeOptions,
): F {
  const options: LruMemoizeOptions =
    typeof equalityCheckOrOptions === 'object'
      ? equalityCheckOrOptions
      : { equalityCheck: equalityCheckOrOptions };
  const { equalityCheck = referenceEqualityCheck, resultEqualityCheck } = options;

  let entry: CacheEntry | undefined;

  const areArgsEqual = (cachedArgs: IArguments | any[], args: IArguments) => {
    if (cachedArgs.length !== args.length) {
      return false;
    }
    for (let i = 0; i < args.length; i += 1) {
      if (!equalityCheck(cachedArgs[i], args[i])) {
        return false;
      }
    }
    return true;
  };

  // Use `arguments` and `func.apply` instead of rest/spread to avoid allocating
  // a new array on every call.
  function memoized(this: unknown) {
    if (entry !== undefined && areArgsEqual(entry.args, arguments)) {
      return entry.value;
    }

    let value = func.apply(null, arguments as any);
    if (resultEqualityCheck && entry !== undefined && resultEqualityCheck(entry.value, value)) {
      value = entry.value;
    }

    entry = { args: arguments, value };
    return value;
  }

  memoized.clearCache = () => {
    entry = undefined;
  };

  return memoized as unknown as F;
}
