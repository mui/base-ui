'use client';
import * as React from 'react';

/** The `items` that match the query, published by a filterable select's root. */
export const SelectFilteredItemsContext = React.createContext<readonly any[] | null>(null);

/**
 * Returns the `items` passed to `Select.Root` that match the filter query, in the same shape:
 * groups keep only their matching items, and groups without matches are left out.
 * Requires the select to be wrapped in `Select.FilterProvider`.
 */
export function useFilteredItems<Item>(): Item[] {
  const items = React.useContext(SelectFilteredItemsContext);
  if (items === null) {
    throw new Error(
      'Base UI: Select.useFilteredItems() must be called inside a select wrapped in ' +
        '<Select.FilterProvider>. The filtered items come from the provider, which a plain ' +
        'select does not have. See https://base-ui.com/react/components/select#filtering',
    );
  }
  return items as Item[];
}
