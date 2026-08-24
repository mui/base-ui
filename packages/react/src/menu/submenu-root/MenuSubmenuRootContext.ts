'use client';
import * as React from 'react';

export const MenuSubmenuRootContext = React.createContext<MenuSubmenuRootContext | undefined>(
  undefined,
);

export interface MenuSubmenuRootContext {
  getReturnElement?: (() => HTMLElement | null) | undefined;
  onTriggerKeyDown?: ((event: React.KeyboardEvent<HTMLElement>) => void) | undefined;
  onPopupKeyDown?: ((event: React.KeyboardEvent) => void) | undefined;
}

export function useMenuSubmenuRootContext(): MenuSubmenuRootContext | undefined {
  return React.useContext(MenuSubmenuRootContext);
}
