'use client';
import * as React from 'react';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';

export interface SelectDerivedItemsContext {
  /**
   * Whether the root was given an `items` data source. When false, the list is rendered by the
   * consumer and filtering falls back to matching the rendered DOM text.
   */
  hasItems: boolean;
  /**
   * `items` narrowed to the current query, keeping the grouped shape when one was provided.
   */
  filteredItems: readonly any[];
  /**
   * `filteredItems` flattened across groups.
   */
  flatFilteredItems: readonly any[];
}

const DEFAULT_CONTEXT: SelectDerivedItemsContext = {
  hasItems: false,
  filteredItems: EMPTY_ARRAY,
  flatFilteredItems: EMPTY_ARRAY,
};

export const SelectDerivedItemsContext =
  React.createContext<SelectDerivedItemsContext>(DEFAULT_CONTEXT);

export function useSelectDerivedItemsContext() {
  return React.useContext(SelectDerivedItemsContext);
}
