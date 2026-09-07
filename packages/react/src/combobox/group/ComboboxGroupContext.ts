'use client';
import * as React from 'react';

export interface ComboboxGroupContext {
  labelId: string | undefined;
  setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
  /**
   * Optional list of items that belong to this group. Used by nested
   * collections to render group-specific items.
   */
  items?: readonly any[] | undefined;
}

export const ComboboxGroupContext = React.createContext<ComboboxGroupContext | undefined>(
  undefined,
);

export function useComboboxGroupContext(optional?: false): ComboboxGroupContext;
export function useComboboxGroupContext(optional: true): ComboboxGroupContext | undefined;
export function useComboboxGroupContext(optional: boolean): ComboboxGroupContext | undefined;
export function useComboboxGroupContext(optional?: boolean) {
  const context = React.useContext(ComboboxGroupContext);
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: ComboboxGroupContext is missing. ComboboxGroup parts must be placed within <Combobox.Group>.',
    );
  }
  return context;
}
