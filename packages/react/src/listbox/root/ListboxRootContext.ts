'use client';
import * as React from 'react';
import type { ListboxStore } from '../store';

export const ListboxRootContext = React.createContext<ListboxStore | null>(null);

export function useListboxRootContext() {
  const store = React.useContext(ListboxRootContext);
  if (store === null) {
    throw new Error(
      'Base UI: ListboxRootContext is missing. Listbox parts must be placed within <Listbox.Root>.',
    );
  }
  return store;
}
