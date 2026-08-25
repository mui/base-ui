'use client';
import * as React from 'react';

/** True only inside a `FilterMenu.Row` of a grid, so items outside one never claim a cell role. */
export const FilterMenuRowContext = React.createContext(false);

export function useFilterMenuRowContext() {
  return React.useContext(FilterMenuRowContext);
}
