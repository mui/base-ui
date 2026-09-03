'use client';
import * as React from 'react';
import { type MenuStore } from '../store/MenuStore';
import { MenuParent } from './MenuRoot';

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
  /** Whether the virtual focus owner takes focus even when the menu opens on hover. */
  virtualFocusAutoFocus: boolean;
  parentVirtualFocus: boolean;
  /**
   * The parent menu's `floatingId`, read from its context rather than its store so a submenu
   * trigger derives its id from the same value, in the same render, as its sibling items.
   */
  parentFloatingId: string | undefined;
  /**
   * Whether items should expose `aria-selected`, which WebKit needs to follow
   * `aria-activedescendant` into a menu. Resolved once per root, not per item.
   */
  webkitItemSelected: boolean;
  /** Re-emits `onItemHighlighted` after the item registry settles. */
  syncHighlightedItem: () => void;
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
