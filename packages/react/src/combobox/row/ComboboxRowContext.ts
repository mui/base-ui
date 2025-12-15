import * as React from 'react';
import { useContext } from '@base-ui/utils/useContext';

export const ComboboxRowContext = React.createContext(false);

export function useComboboxRowContext() {
  return useContext(ComboboxRowContext);
}
