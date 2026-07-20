'use client';
import * as React from 'react';
import { type MenuRoot } from '../menu/root/MenuRoot';

export interface MenubarContext {
  modal: boolean;
  disabled: boolean;
  contentElement: HTMLElement | null;
  setContentElement: (element: HTMLElement | null) => void;
  hasSubmenuOpen: boolean;
  setHasSubmenuOpen: (open: boolean) => void;
  orientation: MenuRoot.Orientation;
  allowMouseUpTriggerRef: React.RefObject<boolean>;
  rootId: string | undefined;
}

export const MenubarContext = React.createContext<MenubarContext | null>(null);

export function useMenubarContext() {
  return React.useContext(MenubarContext);
}
