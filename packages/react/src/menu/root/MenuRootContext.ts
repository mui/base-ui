'use client';
import * as React from 'react';
import type { MenuOpenChangeReason, useMenuRoot } from './useMenuRoot';

export interface MenuRootContext extends useMenuRoot.ReturnValue {
  disabled: boolean;
  nested: boolean;
  parentContext: MenuRootContext | undefined;
  typingRef: React.RefObject<boolean>;
  modal: boolean;
  openReason: MenuOpenChangeReason | null;
  onOpenChangeComplete: ((open: boolean) => void) | undefined;
  setHoverEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

export const MenuRootContext = React.createContext<MenuRootContext | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  MenuRootContext.displayName = 'MenuRootContext';
}

function useMenuRootContext(optional?: false): MenuRootContext;
function useMenuRootContext(optional: true): MenuRootContext | undefined;
function useMenuRootContext(optional?: boolean) {
  const context = React.useContext(MenuRootContext);
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: MenuRootContext is missing. Menu parts must be placed within <Menu.Root>.',
    );
  }

  return context;
}

export { useMenuRootContext };
