'use client';
import * as React from 'react';
import type { SelectStore, State } from '../store';

export const SelectRootContext = React.createContext<SelectStore | undefined>(undefined);
// When options and a controlled value change together, item reconciliation can run before
// the store syncs and clear the new selection using stale inputs. React context provides
// the current render's value and selection mode. https://github.com/mui/base-ui/issues/5875
export const SelectSelectionContext = React.createContext<Pick<State, 'value' | 'multiple'> | null>(
  null,
);

export function useSelectRootContext() {
  const store = React.useContext(SelectRootContext);
  if (store === undefined) {
    throw new Error(
      'Base UI: SelectRootContext is missing. Select parts must be placed within <Select.Root>.',
    );
  }
  return store;
}

export function useSelectSelectionContext() {
  const selection = React.useContext(SelectSelectionContext);
  if (selection === null) {
    throw new Error(
      'Base UI: SelectRootContext is missing. Select parts must be placed within <Select.Root>.',
    );
  }
  return selection;
}
