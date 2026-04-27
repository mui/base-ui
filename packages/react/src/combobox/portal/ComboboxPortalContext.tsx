'use client';
import * as React from 'react';

export const ComboboxPortalContext = React.createContext<boolean | undefined>(undefined);

export function useComboboxPortalContext(optional?: false): boolean;
export function useComboboxPortalContext(optional: true): boolean | undefined;
export function useComboboxPortalContext(optional?: boolean) {
  const context = React.useContext(ComboboxPortalContext);
  if (context === undefined && !optional) {
    throw new Error('Base UI: <Combobox.Portal> is missing.');
  }
  return context;
}
