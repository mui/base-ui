'use client';
import * as React from 'react';
import type { FilterDropdownStore } from '../store';

export interface FilterDropdownPopupContext {
  store: FilterDropdownStore;
  inputRef: React.RefObject<HTMLInputElement | null>;
  listId: string | undefined;
  setListId: (id: string | undefined) => void;
  registerItem: (id: symbol, getFilterText: () => string | undefined) => () => void;
}

export const FilterDropdownPopupContext = React.createContext<FilterDropdownPopupContext | null>(
  null,
);

export function useFilterDropdownPopupContext() {
  const context = React.useContext(FilterDropdownPopupContext);
  if (context === null) {
    throw new Error(
      'Base UI: FilterDropdownPopupContext is missing. FilterDropdown popup parts must be placed within <FilterDropdown.Popup>.',
    );
  }
  return context;
}
