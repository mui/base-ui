'use client';
import * as React from 'react';

export interface FilterDropdownGroupContext {
  registerItem: (id: symbol, retained: boolean) => () => void;
}

export const FilterDropdownGroupContext = React.createContext<FilterDropdownGroupContext | null>(
  null,
);

export function useFilterDropdownGroupContext() {
  return React.useContext(FilterDropdownGroupContext);
}
