'use client';
import * as React from 'react';
import type { UseAnchorPositioningReturnValue } from '../../utils/useAnchorPositioning';

export type MenuPositionerContext = UseAnchorPositioningReturnValue;

export const MenuPositionerContext = React.createContext<MenuPositionerContext | undefined>(
  undefined,
);

export function useMenuPositionerContext(optional?: false): MenuPositionerContext;
export function useMenuPositionerContext(optional: true): MenuPositionerContext | undefined;
export function useMenuPositionerContext(optional?: boolean) {
  const context = React.useContext(MenuPositionerContext);
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: MenuPositionerContext is missing. MenuPositioner parts must be placed within <Menu.Positioner>.',
    );
  }
  return context;
}
