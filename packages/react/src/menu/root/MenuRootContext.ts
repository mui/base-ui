'use client';
import * as React from 'react';
import { type MenuStore } from '../store/MenuStore';
import { MenuParent } from './MenuRoot';
import type { HTMLProps } from '../../internals/types';

export interface MenuRootContext<Payload = unknown> {
  type: 'menu' | 'submenu';
  store: MenuStore<Payload>;
  parent: MenuParent;
  orientation: 'vertical' | 'horizontal';
  loopFocus: boolean;
  defaultFloatingId: string | undefined;
  floatingId: string | undefined;
  setFloatingId: React.Dispatch<React.SetStateAction<string | undefined>>;
  virtualFocus: boolean;
  virtualFocusRef: React.RefObject<HTMLElement | null> | undefined;
  virtualFocusPropsRef: React.RefObject<HTMLProps> | undefined;
  parentVirtualFocus: boolean;
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
