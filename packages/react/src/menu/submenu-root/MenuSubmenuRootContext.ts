import * as React from 'react';
import { MenuStore } from '../store/MenuStore';
import { useContext } from '@base-ui/utils/useContext';

export const MenuSubmenuRootContext = React.createContext<MenuSubmenuRootContext | undefined>(
  undefined,
);

export interface MenuSubmenuRootContext {
  parentMenu: MenuStore<unknown>;
}

export function useMenuSubmenuRootContext(): MenuSubmenuRootContext | undefined {
  return useContext(MenuSubmenuRootContext);
}
