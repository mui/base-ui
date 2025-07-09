import * as React from 'react';

export interface NavigationMenuItemContext {
  value: string | undefined;
  openOnHover: boolean;
}

export const NavigationMenuItemContext = React.createContext<NavigationMenuItemContext | undefined>(
  undefined,
);

export function useNavigationMenuItemContext() {
  const context = React.useContext(NavigationMenuItemContext);
  if (!context) {
    throw new Error(
      'Base UI: NavigationMenuItemContext is missing. NavigationMenuItem parts must be placed within <NavigationMenu.Item>.',
    );
  }
  return context;
}
