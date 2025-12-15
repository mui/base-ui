import * as React from 'react';
import { useContext } from '@base-ui/utils/useContext';

export const SelectPortalContext = React.createContext<boolean | undefined>(undefined);

export function useSelectPortalContext() {
  const value = useContext(SelectPortalContext);
  if (value === undefined) {
    throw new Error('Base UI: <Select.Portal> is missing.');
  }
  return value;
}
