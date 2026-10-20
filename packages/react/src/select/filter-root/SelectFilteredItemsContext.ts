'use client';
import * as React from 'react';

/** Returns the `items` that match the query, published by a filterable select's root. */
export const SelectFilteredItemsContext = React.createContext<
  (() => { filteredItems: readonly any[] }) | null
>(null);

/**
 * Returns the `items` of a select wrapped in `Select.FilterProvider` that match the query.
 * Call it in a component rendered inside `Select.Root`, and treat the result as read-only.
 */
export function useFilteredItems<Item>(): Item[] {
  const getFilteredItems = React.useContext(SelectFilteredItemsContext);
  if (getFilteredItems === null) {
    throw new Error(
      'Base UI: Select.useFilteredItems() was called outside a <Select.Root> wrapped in ' +
        '<Select.FilterProvider>. The filtered items come from that root, so there are none ' +
        'to return. Call it in a component rendered inside the filterable <Select.Root>, such ' +
        'as the contents of <Select.List>. ' +
        'See https://base-ui.com/react/components/select#filtering',
    );
  }
  return getFilteredItems().filteredItems as Item[];
}
