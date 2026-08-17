'use client';
import * as React from 'react';

export interface MenuSubmenuRootContext {
  getReturnElement(): HTMLElement | null;
  onTriggerKeyDown(event: React.KeyboardEvent): void;
  onPopupKeyDown(event: React.KeyboardEvent): void;
}

export const MenuSubmenuRootContext = React.createContext<MenuSubmenuRootContext | undefined>(
  undefined,
);

export function useMenuSubmenuRootContext(): MenuSubmenuRootContext | undefined {
  return React.useContext(MenuSubmenuRootContext);
}
