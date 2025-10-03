import * as React from 'react';

export interface ComboboxChipContext {
  index: number;
}

export const ComboboxChipContext = React.createContext<ComboboxChipContext | undefined>(undefined);

export function useComboboxChipContext() {
  const context = React.useContext(ComboboxChipContext);
  if (!context) {
    throw new Error('useComboboxChipContext must be used within a ComboboxChip');
  }
  return context;
}
