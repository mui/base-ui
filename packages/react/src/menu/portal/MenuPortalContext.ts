import * as React from 'react';
import { useContext } from '@base-ui/utils/useContext';

export const MenuPortalContext = React.createContext<boolean | undefined>(undefined);

export function useMenuPortalContext() {
  const value = useContext(MenuPortalContext);
  if (value === undefined) {
    throw new Error('Base UI: <Menu.Portal> is missing.');
  }
  return value;
}
