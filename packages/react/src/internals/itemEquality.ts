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

/**
 * `project` maps each entry to the value it should be compared as, applied lazily so a search
 * that matches early never projects the rest of the list.
 */
export function findItemIndex<Item, Value, Entry = Item>(
  itemValues: readonly Entry[] | undefined | null,
  selectedValue: Value,
  comparer: ItemEqualityComparer<Item, Value>,
  project?: ((entry: Entry) => Item) | undefined,
): number {
  if (!itemValues || itemValues.length === 0) {
    return -1;
  }
  return itemValues.findIndex((entry) => {
    const itemValue = project ? project(entry) : (entry as unknown as Item);
    if (itemValue === undefined) {
      return false;
    }
    return compareItemEquality(itemValue, selectedValue, comparer);
  });
}

export function findSelectionIndex<Item, Value, Entry = Item>(
  itemValues: readonly Entry[] | undefined | null,
  selectedValue: Value | readonly Value[] | null | undefined,
  comparer: ItemEqualityComparer<Item, Value>,
  multiple: boolean,
  project?: ((entry: Entry) => Item) | undefined,
): number | null {
  // Only unwrap in multiple mode: an array can itself be a valid single-select value.
  const lastValue =
    multiple && Array.isArray(selectedValue)
      ? selectedValue[selectedValue.length - 1]
      : selectedValue;
  const index = findItemIndex(itemValues, lastValue as Value, comparer, project);
  return index === -1 ? null : index;
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
