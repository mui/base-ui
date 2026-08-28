'use client';
import * as React from 'react';
import { type FloatingRootContext } from '../../floating-ui-react';
import type { SelectStore } from '../store';
import type { HTMLProps } from '../../internals/types';

/**
 * Root values consumed during render. Keep these outside `useSyncedValues` so descendant ref
 * callbacks see the current props during the same commit.
 */
export interface SelectRootPropsContextValue {
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  multiple: boolean;
  highlightItemOnHover: boolean;
  itemProps: HTMLProps;
}

export const SelectRootContext = React.createContext<SelectStore | undefined>(undefined);
export const SelectRootPropsContext = React.createContext<SelectRootPropsContextValue | undefined>(
  undefined,
);
export const SelectFloatingContext = React.createContext<FloatingRootContext | undefined>(
  undefined,
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

export function useSelectRootPropsContext() {
  const context = React.useContext(SelectRootPropsContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: SelectRootPropsContext is missing. Select parts must be placed within <Select.Root>.',
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
