'use client';
import * as React from 'react';
import { useAnchorPositioning } from '../../utils/useAnchorPositioning';
import { useContext } from '@base-ui/utils/useContext';

export type NavigationMenuPositionerContext = ReturnType<typeof useAnchorPositioning>;

export const NavigationMenuPositionerContext = React.createContext<
  NavigationMenuPositionerContext | undefined
>(undefined);

export function useNavigationMenuPositionerContext(
  optional: true,
): NavigationMenuPositionerContext | undefined;
export function useNavigationMenuPositionerContext(
  optional?: false,
): NavigationMenuPositionerContext;
export function useNavigationMenuPositionerContext(optional = false) {
  const context = useContext(NavigationMenuPositionerContext);
  if (!context && !optional) {
    throw new Error(
      'Base UI: NavigationMenuPositionerContext is missing. NavigationMenuPositioner parts must be placed within <NavigationMenu.Positioner>.',
    );
  }
  return context;
}
