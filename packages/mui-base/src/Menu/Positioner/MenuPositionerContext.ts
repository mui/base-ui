'use client';
import * as React from 'react';
import type { MenuPositionerContextValue } from './MenuPositioner.types';

export const MenuPositionerContext = React.createContext<MenuPositionerContextValue | null>(null);

export function useMenuPositionerContext() {
  const context = React.useContext(MenuPositionerContext);
  if (context === null) {
    throw new Error(
      '<Menu.Popup> and <Menu.Arrow> must be used within the <Menu.Positioner> component',
    );
  }
  return context;
}
