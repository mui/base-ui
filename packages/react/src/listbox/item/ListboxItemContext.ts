'use client';
import * as React from 'react';

/** Whether the item is selected. */
export const ListboxItemContext = React.createContext<boolean | undefined>(undefined);

export function useListboxItemContext() {
  const selected = React.useContext(ListboxItemContext);
  if (selected === undefined) {
    throw new Error(
      'Base UI: ListboxItemContext is missing. ListboxItem parts must be placed within <Listbox.Item>.',
    );
  }
  return selected;
}
