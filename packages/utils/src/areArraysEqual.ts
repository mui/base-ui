type ItemComparer<Item> = (a: Item, b: Item) => boolean;

/**
 * Compares two arrays for equality.
 *
 * Short-circuits on referential equality and bails out early on a length
 * mismatch, then iterates in reverse to avoid the closure allocation of
 * `Array.prototype.every`. When no `itemComparer` is provided the elements are
 * compared with `Object.is`, inlined to skip a per-call callback.
 *
 * Inspired by `fastArrayCompare` from `@mui/x-internals`.
 */
export function areArraysEqual<Item>(
  array1: ReadonlyArray<Item>,
  array2: ReadonlyArray<Item>,
  itemComparer?: ItemComparer<Item>,
): boolean {
  if (array1 === array2) {
    return true;
  }

  let i = array1.length;
  if (i !== array2.length) {
    return false;
  }

  // eslint-disable-next-line no-plusplus
  while (i--) {
    const equal = itemComparer
      ? itemComparer(array1[i], array2[i])
      : Object.is(array1[i], array2[i]);
    if (!equal) {
      return false;
    }
  }

  return true;
}
