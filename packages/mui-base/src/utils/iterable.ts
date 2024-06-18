/* eslint-disable no-restricted-syntax */

/**
 * Determines whether all the members of an iterable collection satisfy the specified test.
 *
 * @param iterable An iterable collection.
 * @param predicate A function that accepts the evaluated item.
 * The every method calls the predicate function for each element in the array until the predicate returns a value which is coercible to `false`,
 * or until the end of the collection.
 */
export function every<T>(iterable: Iterable<T>, predicate: (value: T) => boolean): boolean {
  for (const value of iterable) {
    if (!predicate(value)) {
      return false;
    }
  }

  return true;
}

/**
 * Determines whether any member of an iterable collection satisfies the specified test.
 *
 * @param iterable An iterable collection.
 * @param predicate A function that accepts the evaluated item.
 * The some method calls the predicate function for each element in the array until the predicate returns a value which is coercible to `true`,
 * or until the end of the collection.
 */
export function some<T>(iterable: Iterable<T>, predicate: (value: T) => boolean): boolean {
  for (const value of iterable) {
    if (predicate(value)) {
      return true;
    }
  }

  return false;
}

/**
 * Finds the index of the first element in an iterable collection that satisfies a predicate function.
 *
 * @param iterable An iterable collection.
 * @param predicate A function that accepts the evaluated item.
 */
export function findIndex<T>(iterable: Iterable<T>, predicate: (value: T) => boolean): number {
  let index = 0;

  for (const value of iterable) {
    if (predicate(value)) {
      return index;
    }

    index += 1;
  }

  return -1;
}

export function elementAt<T>(iterable: Iterable<T>, index: number): T | undefined {
  let i = 0;

  for (const value of iterable) {
    if (i === index) {
      return value;
    }

    i += 1;
  }

  return undefined;
}
