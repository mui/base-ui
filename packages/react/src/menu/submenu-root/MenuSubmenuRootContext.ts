'use client';
import * as React from 'react';

export const MenuSubmenuRootContext = React.createContext<MenuSubmenuRootContext | undefined>(
  undefined,
);

export interface MenuSubmenuRootContext {
  /** The element that receives focus when the submenu closes; `false` leaves focus where it is. */
  getReturnElement?: (() => HTMLElement | null | false) | undefined;
  onTriggerKeyDown?: ((event: React.KeyboardEvent<HTMLElement>) => void) | undefined;
  onPopupKeyDown?: ((event: React.KeyboardEvent) => void) | undefined;
}

export function useMenuSubmenuRootContext(): MenuSubmenuRootContext | undefined {
  return React.useContext(MenuSubmenuRootContext);
}
