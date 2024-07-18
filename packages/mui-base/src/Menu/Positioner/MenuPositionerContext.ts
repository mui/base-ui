'use client';
import * as React from 'react';
import type { Side } from '@floating-ui/react';

export interface MenuPositionerContext {
  /**
   * The side of the anchor element the popup is positioned relative to.
   */
  side: Side;
  /**
   * The alignment of the anchor element the popup is positioned relative to.
   */
  alignment: 'start' | 'end' | 'center';
}

export const MenuPositionerContext = React.createContext<MenuPositionerContext | null>(null);

MenuPositionerContext.displayName = 'MenuPositionerContext';

export function useMenuPositionerContext() {
  const context = React.useContext(MenuPositionerContext);
  if (context === null) {
    throw new Error('<Menu.Popup> must be used within the <Menu.Positioner> component');
  }
  return context;
}
