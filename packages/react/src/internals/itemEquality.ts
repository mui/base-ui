import { areArraysEqual } from '@base-ui/utils/areArraysEqual';

export type ItemEqualityComparer<Item = any, Value = Item> = (
  itemValue: Item,
  selectedValue: Value,
) => boolean;

// Compared by identity in `findSelectionIndex`; don't wrap it.
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

// The default comparer is `Object.is`, so the values can be indexed instead of rescanned
// for every item. A custom comparer may match values that don't hash alike.
function createSelectionMatcher<Item, Value>(
  selectedValues: readonly Value[],
  comparer: ItemEqualityComparer<Item, Value>,
): (itemValue: Item) => boolean {
  if (comparer !== defaultItemEquality) {
    return (itemValue) => selectedValueIncludes(selectedValues, itemValue, comparer);
  }
  const index = new Set<unknown>(selectedValues);
  index.delete(undefined);
  // `Set` treats +0 and -0 as equal; `Object.is` does not.
  return (itemValue) =>
    index.has(itemValue) &&
    (itemValue !== 0 || selectedValues.some((v) => Object.is(itemValue, v)));
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
        itemValues.findIndex(createSelectionMatcher(selectedValue, comparer))
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
