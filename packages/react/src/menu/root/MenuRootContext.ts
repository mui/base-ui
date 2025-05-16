'use client';
import * as React from 'react';
import type { useMenuRoot } from './useMenuRoot';

export interface MenuRootContext extends useMenuRoot.ReturnValue {
  disabled: boolean;
  typingRef: React.RefObject<boolean>;
  modal: boolean;
  onOpenChangeComplete: ((open: boolean) => void) | undefined;
  setHoverEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

export const MenuRootContext = React.createContext<MenuRootContext | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  MenuRootContext.displayName = 'MenuRootContext';
}

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
