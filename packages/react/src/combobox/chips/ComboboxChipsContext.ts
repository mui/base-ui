'use client';
import * as React from 'react';

export interface ComboboxChipsContext {
  chipsRef: React.RefObject<Array<HTMLButtonElement | null>>;
}

export const ComboboxChipsContext = React.createContext<ComboboxChipsContext | undefined>(
  undefined,
);

export function useComboboxChipsContext() {
  return React.useContext(ComboboxChipsContext);
}
