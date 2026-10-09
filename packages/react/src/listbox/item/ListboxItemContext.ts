'use client';
import * as React from 'react';

export interface ListboxItemContext {
  selected: boolean;
  indexRef: React.RefObject<number>;
  textRef: React.RefObject<HTMLElement | null>;
  dragHandleRef: React.RefObject<HTMLElement | null>;
  hasRegistered: boolean;
}

export const ListboxItemContext = React.createContext<ListboxItemContext | undefined>(undefined);

export function useListboxItemContext() {
  const context = React.useContext(ListboxItemContext);
  if (!context) {
    throw new Error(
      'Base UI: ListboxItemContext is missing. ListboxItem parts must be placed within <Listbox.Item>.',
    );
  }
  return context;
}
