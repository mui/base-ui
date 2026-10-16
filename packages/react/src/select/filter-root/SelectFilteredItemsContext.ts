'use client';
import * as React from 'react';

/** The `items` that match the query, published by a filterable select's root. */
export const SelectFilteredItemsContext = React.createContext<readonly any[] | null>(null);

/**
 * Returns the filtered items when called inside `Select.FilterProvider`.
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
