import * as React from 'react';
import { useContext } from '@base-ui/utils/useContext';

export interface ComboboxChipsContext {
  highlightedChipIndex: number | undefined;
  setHighlightedChipIndex: React.Dispatch<React.SetStateAction<number | undefined>>;
  chipsRef: React.RefObject<Array<HTMLButtonElement | null>>;
}

export const ComboboxChipsContext = React.createContext<ComboboxChipsContext | undefined>(
  undefined,
);

export function useComboboxChipsContext() {
  return useContext(ComboboxChipsContext);
}
