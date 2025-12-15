import * as React from 'react';
import { useContext } from '@base-ui/utils/useContext';

export const NavigationMenuPortalContext = React.createContext<boolean | undefined>(undefined);

export function useNavigationMenuPortalContext() {
  const value = useContext(NavigationMenuPortalContext);
  if (value === undefined) {
    throw new Error('Base UI: <NavigationMenu.Portal> is missing.');
  }
  return value;
}
