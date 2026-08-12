'use client';
import * as React from 'react';
import { type MenuStore } from '../store/MenuStore';
import { MenuParent } from './MenuRoot';

export interface MenuRootContext<Payload = unknown> {
  type: 'menu' | 'submenu';
  store: MenuStore<Payload>;
  parent: MenuParent;
  orientation: 'vertical' | 'horizontal';
  floatingId: string | undefined;
  setFloatingId: React.Dispatch<React.SetStateAction<string | undefined>>;
}

export const MenuRootContext = React.createContext<MenuRootContext | undefined>(undefined);

export function useMenuRootContext(optional?: false): MenuRootContext;
export function useMenuRootContext(optional: true): MenuRootContext | undefined;
export function useMenuRootContext(optional?: boolean) {
  const context = React.useContext(MenuRootContext);
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: MenuRootContext is missing. Menu parts must be placed within <Menu.Root>.',
    );
  }

  return context;
}

export function useMenuFilterableRootContext(partName: string) {
  const context = useMenuRootContext();
  const filterable = context.store.select('filterable');

  if (!filterable) {
    throw new Error(
      `Base UI: <FilterMenu.${partName}> must be placed within the nearest ` +
        '<FilterMenu.Root> or <FilterMenu.SubmenuRoot>, imported from ' +
        '`@base-ui/react/filter-menu`. An ordinary <Menu.Root> cannot filter.',
    );
  }

  return context;
}
