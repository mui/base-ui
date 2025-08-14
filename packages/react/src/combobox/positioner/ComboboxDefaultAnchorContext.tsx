'use client';
import * as React from 'react';

export type ComboboxDefaultAnchor = 'input' | 'trigger';

export const ComboboxDefaultAnchorContext = React.createContext<ComboboxDefaultAnchor | undefined>(
  undefined,
);

export function useComboboxDefaultAnchor(): ComboboxDefaultAnchor | undefined {
  return React.useContext(ComboboxDefaultAnchorContext);
}
