import { useComboboxDerivedItemsContext } from '../ComboboxRootContext';

/**
 * Return filtered items from the combobox.
 */
export function useFilteredItems<T>() {
  const items = useComboboxDerivedItemsContext();
  return items.filteredItems as T[];
}
