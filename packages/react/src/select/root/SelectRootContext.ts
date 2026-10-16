'use client';
import * as React from 'react';
import type { SelectStore } from '../store';

export const SelectRootContext = React.createContext<SelectStore | undefined>(undefined);

export function useSelectRootContext() {
  const store = React.useContext(SelectRootContext);
  if (store === undefined) {
    throw new Error(
      'Base UI: SelectRootContext is missing. Select parts must be placed within <Select.Root>.',
    );
  }
  return store;
}
