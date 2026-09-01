import { areArraysEqual } from '@base-ui/utils/areArraysEqual';

export type ItemEqualityComparer<Item = any, Value = Item> = (
  itemValue: Item,
  selectedValue: Value,
) => boolean;

// Reference identity is load-bearing: `findSelectionIndex` only takes its indexed fast path
// when the comparer *is* this function, so wrapping or re-creating it at the roots would
// silently restore the O(items x selections) lookup.
export const defaultItemEquality: ItemEqualityComparer = (itemValue, selectedValue) =>
  Object.is(itemValue, selectedValue);

export function compareItemEquality<Item, Value>(
  itemValue: Item,
  selectedValue: Value,
  comparer: ItemEqualityComparer<Item, Value>,
): boolean {
  if (itemValue == null || selectedValue == null) {
    return Object.is(itemValue, selectedValue);
  }
  return comparer(itemValue, selectedValue);
}

export function isSelectedValueDirty(
  currentValue: unknown,
  initialValue: unknown,
  comparer: ItemEqualityComparer,
): boolean {
  if (Array.isArray(currentValue) && Array.isArray(initialValue)) {
    return !areArraysEqual(currentValue, initialValue, (itemValue, initialItemValue) =>
      compareItemEquality(itemValue, initialItemValue, comparer),
    );
  }

  return currentValue !== initialValue;
}

export function selectedValueIncludes<Item, Value>(
  selectedValues: readonly Item[] | undefined | null,
  itemValue: Value,
  comparer: ItemEqualityComparer<Value, Item>,
): boolean {
  if (!selectedValues) {
    return false;
  }
  return selectedValues.some((selectedValue) => {
    if (selectedValue === undefined) {
      return false;
    }
    return compareItemEquality(itemValue, selectedValue, comparer);
  });
}

export function findItemIndex<Item, Value>(
  itemValues: readonly Item[] | undefined | null,
  selectedValue: Value,
  comparer: ItemEqualityComparer<Item, Value>,
): number {
  if (!itemValues) {
    return -1;
  }
  return itemValues.findIndex((itemValue) => {
    if (itemValue === undefined) {
      return false;
    }
    return compareItemEquality(itemValue, selectedValue, comparer);
  });
}

/**
 * Builds a membership test over the selected values that can be reused across items.
 *
 * The default comparer is `Object.is`, so the values can be indexed in a `Set` and
 * probed in constant time instead of being rescanned for every item. A custom comparer
 * may report values equal that do not hash alike, so it keeps the linear scan.
 */
function createSelectionMembership<Item, Value>(
  selectedValues: readonly Value[],
  comparer: ItemEqualityComparer<Item, Value>,
): (itemValue: Item) => boolean {
  if (comparer !== defaultItemEquality) {
    return (itemValue) => selectedValueIncludes(selectedValues, itemValue, comparer);
  }

  const index = new Set<unknown>();
  // `forEach` walks the values the way the `some()` scan in `selectedValueIncludes` did: one
  // length snapshot, holes skipped, no `Symbol.iterator`. Building the index from
  // `new Set(selectedValues)` would iterate instead, letting an unusual array resolve a
  // different anchor than it did before the values were indexed. That keeps this lookup
  // exact by construction — not a promise about exotic arrays elsewhere, since the toggle
  // path spreads the same array. An explicit `undefined` never matches either, the same way
  // that scan rejects it.
  selectedValues.forEach((selectedValue) => {
    if (selectedValue !== undefined) {
      index.add(selectedValue);
    }
  });

  return (itemValue) => {
    if (!index.has(itemValue)) {
      return false;
    }
    // `Set` membership is SameValueZero, which unifies `+0` and `-0`. The exact re-check is
    // what keeps this agreeing with the `isSelected` selectors in `select/store.ts` and
    // `combobox/store.ts`, which compare through `Object.is`: without it the anchor could
    // land on an item that renders unselected. Only a zero ever pays for it.
    return itemValue !== 0 || selectedValues.some((v) => Object.is(itemValue, v));
  };
}

export function findSelectionIndex<Item, Value>(
  itemValues: readonly Item[],
  selectedValue: Value | readonly Value[] | null | undefined,
  comparer: ItemEqualityComparer<Item, Value>,
  multiple: boolean,
): number | null {
  // Only treat the value as a list in multiple mode: an array can itself be a valid
  // single-select value.
  const index =
    multiple && Array.isArray(selectedValue)
      ? // Anchor to the first selected item in rendered order so the index does not depend
        // on the order in which the values were added to the array.
        // A hole (`undefined`) never matches: the membership test rejects it.
        itemValues.findIndex(createSelectionMembership<Item, Value>(selectedValue, comparer))
      : findItemIndex(itemValues, selectedValue as Value, comparer);
  return index === -1 ? null : index;
}

/** Resolves the first selected index as items register or change. */
export function resolveSelectedIndex<Item, Value>(
  index: number,
  itemValue: Item,
  registry: readonly Item[],
  selectedValues: readonly Value[],
  comparer: ItemEqualityComparer<Item, Value>,
  currentIndex: number | null,
): number | null {
  if (selectedValueIncludes(selectedValues, itemValue, comparer)) {
    // A later item only takes over once the current anchor stops being selected.
    return currentIndex != null &&
      index > currentIndex &&
      selectedValueIncludes(selectedValues, registry[currentIndex], comparer)
      ? currentIndex
      : index;
  }
  // The holder re-elects the anchor once it stops being selected.
  return index === currentIndex
    ? findSelectionIndex(registry, selectedValues, comparer, true)
    : currentIndex;
}

export function removeItem<Item, Value>(
  selectedValues: readonly Item[],
  itemValue: Value,
  comparer: ItemEqualityComparer<Value, Item>,
): Item[] {
  return selectedValues.filter(
    (selectedValue) => !compareItemEquality(itemValue, selectedValue, comparer),
  );
}
