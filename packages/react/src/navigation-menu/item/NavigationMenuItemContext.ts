import * as React from 'react';

export const NavigationMenuItemContext = React.createContext<string | undefined>(undefined);

export function useNavigationMenuItemContext() {
  const value = React.useContext(NavigationMenuItemContext);
  if (value === undefined) {
    throw new Error(
      'Base UI: NavigationMenuItem parts must be used within a <NavigationMenu.Item>.',
    );
  }
  return value;
}
