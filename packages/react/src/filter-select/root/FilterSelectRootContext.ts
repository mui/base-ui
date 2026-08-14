'use client';
import * as React from 'react';
import type { ItemEqualityComparer } from '../../internals/itemEquality';

export interface FilterSelectRootContext {
  items: readonly any[];
  isItemEqualToValue: ItemEqualityComparer;
  /**
   * Resolves the entry from `items` that carries an item's value, so each item does not have to
   * scan the whole collection itself.
   */
  getItemData: (itemValue: unknown) => any;
}

export const FilterSelectRootContext = React.createContext<FilterSelectRootContext | undefined>(
  undefined,
);

export function useFilterSelectRootContext() {
  const context = React.useContext(FilterSelectRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: FilterSelectRootContext is missing. FilterSelect parts must be placed within ' +
        '<FilterSelect.Root>.',
    );
  }
  return context;
}
