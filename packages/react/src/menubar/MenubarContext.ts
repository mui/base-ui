'use client';
import * as React from 'react';
import { MenuOrientation } from '../menu/root/useMenuRoot';

export interface MenubarContext {
  modal: boolean;
  contentElement: HTMLElement | null;
  setContentElement: (element: HTMLElement | null) => void;
  hasSubmenuOpen: boolean;
  setHasSubmenuOpen: (open: boolean) => void;
  orientation: MenuOrientation;
}

export const MenubarContext = React.createContext<MenubarContext | null>(null);

export function useMenubarContext(optional?: false): MenubarContext;
export function useMenubarContext(optional: true): MenubarContext | null;
export function useMenubarContext(optional?: boolean) {
  const context = React.useContext(MenubarContext);
  if (context === null && !optional) {
    throw new Error(
      'Base UI: MenubarContext is missing. Menubar parts must be placed within <Menubar>.',
    );
  }

  return context;
}
