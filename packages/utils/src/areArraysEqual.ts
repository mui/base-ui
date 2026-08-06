// https://github.com/mui/mui-x/blob/master/packages/x-internals/src/fastArrayCompare/fastArrayCompare.ts
type ItemComparer<Item> = (a: Item, b: Item) => boolean;

/**
 * Compares two arrays element-wise.
 *
 * The default comparison is `Object.is`, so `NaN` equals `NaN` and `0` does not equal `-0`.
 */
export function areArraysEqual<Item>(
  array1: ReadonlyArray<Item>,
  array2: ReadonlyArray<Item>,
  itemComparer: ItemComparer<Item> = Object.is,
): boolean {
  const { length } = array1;

  if (length !== array2.length) {
    return false;
  }

  for (let i = 0; i < length; i += 1) {
    if (!itemComparer(array1[i], array2[i])) {
      return false;
    }
  }

  return true;
}
