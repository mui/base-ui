'use client';
import * as React from 'react';
import { useNavigationMenuPositioner } from './useNavigationMenuPositioner';

export const NavigationMenuPositionerContext = React.createContext<
  ReturnType<typeof useNavigationMenuPositioner> | undefined
>(undefined);

if (process.env.NODE_ENV !== 'production') {
  NavigationMenuPositionerContext.displayName = 'NavigationMenuPositionerContext';
}

export function useNavigationMenuPositionerContext() {
  const context = React.useContext(NavigationMenuPositionerContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: NavigationMenuPositionerContext is missing. NavigationMenuPositioner parts must be placed within <NavigationMenu.Positioner>.',
    );
  }
  return context;
}
