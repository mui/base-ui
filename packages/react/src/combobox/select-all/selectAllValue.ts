/**
 * Sentinel value for the select-all list option.
 * @internal
 */
export const COMBOBOX_SELECT_ALL_VALUE = Symbol.for('@base-ui/react/combobox-select-all');

export function isComboboxSelectAllValue(value: unknown): value is typeof COMBOBOX_SELECT_ALL_VALUE {
  return value === COMBOBOX_SELECT_ALL_VALUE;
}

/**
 * Prepends the select-all sentinel to filtered items when using a custom `filteredItems` list.
 */
export function prependSelectAllFilteredItems<T>(
  filteredItems: readonly T[],
): readonly (T | typeof COMBOBOX_SELECT_ALL_VALUE)[] {
  if (filteredItems.length === 0) {
    return filteredItems;
  }

  return [COMBOBOX_SELECT_ALL_VALUE, ...filteredItems];
}
