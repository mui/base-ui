import * as React from 'react';
import { useContext } from '@base-ui/utils/useContext';

export interface ComboboxItemContext {
  selected: boolean;
  textRef: React.RefObject<HTMLElement | null>;
}

export const ComboboxItemContext = React.createContext<ComboboxItemContext | undefined>(undefined);

export function useComboboxItemContext() {
  const context = useContext(ComboboxItemContext);
  if (!context) {
    throw new Error(
      'Base UI: ComboboxItemContext is missing. ComboboxItem parts must be placed within <Combobox.Item>.',
    );
  }
  return context;
}
