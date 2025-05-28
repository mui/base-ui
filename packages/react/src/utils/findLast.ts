export function findLast<T, S extends T>(
  array: T[],
  predicate: (value: T, index: number, obj: T[]) => value is S,
): S | undefined {
  for (let i = array.length - 1; i >= 0; i -= 1) {
    if (predicate(array[i], i, array)) {
      return array[i] as S;
    }
  }
  return undefined;
}
