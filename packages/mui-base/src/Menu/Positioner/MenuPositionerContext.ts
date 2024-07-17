'use client';
import * as React from 'react';
import type { FloatingContext, Side } from '@floating-ui/react';

export interface MenuPositionerContext {
  side: Side;
  alignment: 'start' | 'end' | 'center';
  arrowRef: React.MutableRefObject<Element | null>;
  arrowUncentered: boolean;
  floatingContext: FloatingContext;
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
