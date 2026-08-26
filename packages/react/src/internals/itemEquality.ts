import { areArraysEqual } from '@base-ui/utils/areArraysEqual';

export type ItemEqualityComparer<Item = any, Value = Item> = (
  itemValue: Item,
  selectedValue: Value,
) => boolean;

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
  if (!selectedValues || selectedValues.length === 0) {
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
  if (!itemValues || itemValues.length === 0) {
    return -1;
  }
  return itemValues.findIndex((itemValue) => {
    if (itemValue === undefined) {
      return false;
    }
    return compareItemEquality(itemValue, selectedValue, comparer);
  });
}

export function findSelectionIndex<Item, Value>(
  itemValues: readonly Item[] | undefined | null,
  selectedValue: Value | readonly Value[] | null | undefined,
  comparer: ItemEqualityComparer<Item, Value>,
  multiple: boolean,
): number | null {
  // Only treat the value as a list in multiple mode: an array can itself be a valid
  // single-select value.
  if (multiple && Array.isArray(selectedValue)) {
    // Anchor to the first selected item in rendered order so the index does not depend
    // on the order in which the values were added to the array.
    const index =
      itemValues?.findIndex(
        (itemValue) =>
          itemValue !== undefined && selectedValueIncludes(selectedValue, itemValue, comparer),
      ) ?? -1;
    return index === -1 ? null : index;
  }
  const index = findItemIndex(itemValues, selectedValue as Value, comparer);
  return index === -1 ? null : index;
}

/** Whether an item should become the first selected index in rendered order. */
export function shouldClaimSelectedIndex<Item, Value>(
  index: number,
  itemValue: Item,
  registry: readonly Item[],
  selectedValues: readonly Value[],
  comparer: ItemEqualityComparer<Item, Value>,
  currentIndex: number | null,
): boolean {
  // A later item only takes over once the current anchor stops being selected.
  if (
    currentIndex != null &&
    index > currentIndex &&
    selectedValueIncludes(selectedValues, registry[currentIndex], comparer)
  ) {
    return false;
  }
  return selectedValueIncludes(selectedValues, itemValue, comparer);
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
