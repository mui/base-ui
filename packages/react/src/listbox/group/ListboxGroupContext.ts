'use client';
import * as React from 'react';

export interface ListboxGroupContext {
  labelId: string | undefined;
  setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
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
