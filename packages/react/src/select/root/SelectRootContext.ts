'use client';
import * as React from 'react';
import type { FloatingRootContext } from '../../floating-ui-react';
import type { SelectStore } from '../store';
import type { ItemEqualityComparer } from '../../internals/itemEquality';

export const SelectRootStoreContext = React.createContext<SelectStore | undefined>(undefined);
// Keep reconciliation inputs outside `useSyncedValues` so descendants see the same render.
export const SelectRootContext = React.createContext<{
  value: unknown;
  multiple: boolean;
  isItemEqualToValue: ItemEqualityComparer;
} | null>(null);
export const SelectFloatingContext = React.createContext<FloatingRootContext | undefined>(
  undefined,
);

export function useSelectRootStoreContext() {
  const store = React.useContext(SelectRootStoreContext);
  if (store === undefined) {
    throw new Error(
      'Base UI: SelectRootStoreContext is missing. Select parts must be placed within <Select.Root>.',
    );
  }
  return store;
}

export function useSelectRootContext() {
  const context = React.useContext(SelectRootContext);
  if (context === null) {
    throw new Error(
      'Base UI: SelectRootContext is missing. Select parts cannot access their current value or selection settings. Wrap the parts in <Select.Root>.',
    );
  }
  return context;
}

export function useSelectFloatingContext() {
  const context = React.useContext(SelectFloatingContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: SelectFloatingContext is missing. Select parts must be placed within <Select.Root>.',
    );
  }
  return context;
}
