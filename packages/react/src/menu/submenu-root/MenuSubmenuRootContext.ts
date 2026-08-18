'use client';
import * as React from 'react';
import type { MenuStore } from '../store/MenuStore';

export interface MenuSubmenuRootContext {
  parentMenu?: MenuStore<unknown> | undefined;
  getReturnElement?: (() => HTMLElement | null) | undefined;
  onTriggerKeyDown?: ((event: React.KeyboardEvent<HTMLElement>) => void) | undefined;
  onPopupKeyDown?: ((event: React.KeyboardEvent) => void) | undefined;
}

export const MenuSubmenuRootContext = React.createContext<MenuSubmenuRootContext | undefined>(
  undefined,
);

export function useMenuSubmenuRootContext(): MenuSubmenuRootContext | undefined {
  return React.useContext(MenuSubmenuRootContext);
}
