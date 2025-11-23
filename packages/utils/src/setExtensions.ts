/**
 * Equivalent of Array.some for Sets.
 * We can't use the built-in method because it's not widely available on all platforms (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator/some)
 *
 * @param set Set to iterate over.
 * @param predicate Predicate function to test each item.
 */
export function hasSome<T>(set: Set<T>, predicate: (item: T) => boolean) {
  for (const item of set) {
    if (predicate(item)) {
      return true;
    }
  }

  return false;
}
