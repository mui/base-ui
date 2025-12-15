import * as React from 'react';
import { useContext } from '@base-ui/utils/useContext';

export interface NavigationMenuItemContextValue {
  value: any;
}

export const NavigationMenuItemContext = React.createContext<
  NavigationMenuItemContextValue | undefined
>(undefined);

export function useNavigationMenuItemContext() {
  const value = useContext(NavigationMenuItemContext);
  if (!value) {
    throw new Error(
      'Base UI: NavigationMenuItem parts must be used within a <NavigationMenu.Item>.',
    );
  }
  return value;
}
