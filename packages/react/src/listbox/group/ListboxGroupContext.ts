'use client';
import * as React from 'react';

export interface ListboxGroupContext {
  setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
  /** The group's items, which a `Listbox.Collection` inside the group renders. */
  items: readonly any[] | undefined;
}

export const ListboxGroupContext = React.createContext<ListboxGroupContext | undefined>(undefined);

export function useListboxGroupContext() {
  const context = React.useContext(ListboxGroupContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: ListboxGroupContext is missing. ListboxGroup parts must be placed within <Listbox.Group>.',
    );
  }
  return context;
}
