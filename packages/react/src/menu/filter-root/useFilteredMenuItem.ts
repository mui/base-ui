'use client';
import { useFilterDropdownItem } from '../../filter-dropdown/item/useFilterDropdownItem';
import type { MenuFilterItemParams, MenuFilterItemResult } from './MenuFilterContext';

/** Registers a menu item with the filter and hides it while it doesn't match the query. */
export function useFilteredMenuItem(params: MenuFilterItemParams): MenuFilterItemResult {
  return useFilterDropdownItem(params);
}
