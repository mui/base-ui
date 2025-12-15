import * as React from 'react';
import { useContext } from '@base-ui/utils/useContext';

export interface ComboboxChipContext {
  index: number;
}

export const ComboboxChipContext = React.createContext<ComboboxChipContext | undefined>(undefined);

export function useComboboxChipContext() {
  const context = useContext(ComboboxChipContext);
  if (!context) {
    throw new Error('useComboboxChipContext must be used within a ComboboxChip');
  }
  return context;
}
