import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import type { TreeItemReaders } from '../items/itemCollection';

type Fields = Record<PropertyKey, unknown>;

function isObject(value: unknown): value is Fields {
  return typeof value === 'object' && value !== null;
}

/** Whether `value` has no prototype, or `Object.prototype`. */
function isPlainObject(value: object): boolean {
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
}

/** The time of a date, or `null` for an object that only inherits from `Date.prototype`. */
function getDateTime(value: object): number | null {
  try {
    return Date.prototype.getTime.call(value);
  } catch {
    return null;
  }
}

/** Whether two objects are both arrays, or dates of the same time, rather than subclass instances. */
function isSameArrayOrDateKind(a: object, b: object): boolean {
  const prototype = Object.getPrototypeOf(a);
  if (prototype !== Object.getPrototypeOf(b)) {
    return false;
  }
  if (prototype === Array.prototype) {
    return true;
  }
  if (prototype !== Date.prototype) {
    return false;
  }
  const time = getDateTime(a);
  return time !== null && Object.is(time, getDateTime(b));
}

/**
 * Whether two item lists hold the same items, as an equivalent copy does.
 * Items are paired by their place in the hierarchy and must agree on what the
 * collection reads from them (id, label, disabled states and children), then on
 * their own fields. A field that refers to an item, such as its parent, must
 * refer to the item paired with it. Other field values that are plain objects,
 * arrays or dates are compared by content, including symbol and
 * non-enumerable keys; other objects, such as instances of a class or of a
 * subclass of `Array` or `Date`, whose state can be private, by identity.
 * Iterative, because a hierarchy can be deeper than the call stack.
 */
export function areItemModelsEquivalent<TItem>(
  actual: readonly TItem[],
  expected: readonly TItem[],
  readers: TreeItemReaders<TItem>,
): boolean {
  if (
    actual === expected ||
    (actual.length === expected.length && actual.every((item, i) => Object.is(item, expected[i])))
  ) {
    return true;
  }

  const values: Array<[Fields, Fields]> = [];
  // Compares the primitive fields and queues the object ones, skipping the
  // fields that hold `childrenA` and `childrenB`.
  const pushFields = (a: Fields, b: Fields, childrenA?: unknown, childrenB?: unknown) => {
    // A key set to `undefined` matches a missing one, as a serialized copy omits it.
    for (const key of Reflect.ownKeys(a)) {
      const valueA = a[key];
      const valueB = b[key];
      if (Object.is(valueA, valueB) || (valueA === childrenA && valueB === childrenB)) {
        continue;
      }
      if (!isObject(valueA) || !isObject(valueB)) {
        return false;
      }
      values.push([valueA, valueB]);
    }
    return Reflect.ownKeys(b).every(
      (key) =>
        Object.hasOwn(a, key) ||
        b[key] === undefined ||
        (a[key] === childrenA && b[key] === childrenB),
    );
  };

  // Object fields are only queued while the items are paired, so a field can
  // refer to an item anywhere in the hierarchy.
  const partners = new Map<object, object>();
  const lists: Array<[readonly TItem[], readonly TItem[]]> = [[actual, expected]];
  while (lists.length > 0) {
    const [listA, listB] = lists.pop()!;
    if (listA.length !== listB.length) {
      return false;
    }
    for (let index = 0; index < listA.length; index += 1) {
      const a = listA[index];
      const b = listB[index];
      if (Object.is(a, b)) {
        continue;
      }
      if (
        !isObject(a) ||
        !isObject(b) ||
        // An item found in two places, as in a cycle, has no single partner.
        partners.has(a) ||
        partners.has(b) ||
        !(
          Object.getPrototypeOf(a) === Object.getPrototypeOf(b) ||
          (isPlainObject(a) && isPlainObject(b))
        ) ||
        !Object.is(readers.itemToId(a), readers.itemToId(b)) ||
        readers.itemToStringLabel(a) !== readers.itemToStringLabel(b) ||
        Boolean(readers.isItemDisabled(a)) !== Boolean(readers.isItemDisabled(b)) ||
        Boolean(readers.isItemSelectionDisabled(a)) !== Boolean(readers.isItemSelectionDisabled(b))
      ) {
        return false;
      }
      partners.set(a, b);
      partners.set(b, a);
      const childrenA = readers.itemToChildren(a);
      const childrenB = readers.itemToChildren(b);
      if (childrenA !== childrenB) {
        lists.push([childrenA ?? EMPTY_ARRAY, childrenB ?? EMPTY_ARRAY]);
      }
      // Children are compared as items, not as a field.
      if (!pushFields(a, b, childrenA, childrenB)) {
        return false;
      }
    }
  }

  // Models can reference each other in any shape, so each pair is compared once.
  const compared = new Map<object, Set<object>>();
  const isFirstComparison = (a: object, b: object) => {
    let partnersOfA = compared.get(a);
    if (partnersOfA == null) {
      partnersOfA = new Set();
      compared.set(a, partnersOfA);
    } else if (partnersOfA.has(b)) {
      return false;
    }
    partnersOfA.add(b);
    return true;
  };
  while (values.length > 0) {
    const [a, b] = values.pop()!;
    // The fields of paired items are compared on their own.
    if (partners.has(a) || partners.has(b)) {
      if (partners.get(a) !== b) {
        return false;
      }
      continue;
    }
    if (!(isPlainObject(a) && isPlainObject(b)) && !isSameArrayOrDateKind(a, b)) {
      return false;
    }
    // The own keys of an array include its elements and length, besides any
    // field set on it, as on a date.
    if (isFirstComparison(a, b) && !pushFields(a, b)) {
      return false;
    }
  }
  return true;
}
