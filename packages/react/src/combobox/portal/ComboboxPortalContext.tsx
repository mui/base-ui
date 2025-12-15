import * as React from 'react';
import { useContext } from '@base-ui/utils/useContext';

export const ComboboxPortalContext = React.createContext<boolean | undefined>(undefined);

export function useComboboxPortalContext() {
  const context = useContext(ComboboxPortalContext);
  if (context === undefined) {
    throw new Error('Base UI: <Combobox.Portal> is missing.');
  }
  return context;
}
