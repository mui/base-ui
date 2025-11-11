'use client';
import { useCommandPaletteRootContext } from '../root/CommandPaletteRootContext';

/**
 * Hook to access the filtered items from the command palette store.
 * Useful for rendering items in custom layouts.
 */
export function useCommandPaletteItems() {
  const { store } = useCommandPaletteRootContext(true);
  const filteredItems = store.useState('filteredItems');
  return filteredItems;
}
