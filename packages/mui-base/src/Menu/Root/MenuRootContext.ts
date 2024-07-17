import * as React from 'react';
import type { useMenuRoot } from './useMenuRoot';

export interface MenuRootContext extends useMenuRoot.ReturnValue {
  clickAndDragEnabled: boolean;
  disabled: boolean;
  nested: boolean;
  parentContext: MenuRootContext | null;
  setClickAndDragEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

export const MenuRootContext = React.createContext<MenuRootContext | null>(null);

MenuRootContext.displayName = 'MenuRootContext';

function useMenuRootContext(optional?: false): MenuRootContext;
function useMenuRootContext(optional: true): MenuRootContext | null;
function useMenuRootContext(optional?: boolean) {
  const context = React.useContext(MenuRootContext);
  if (context === null && !optional) {
    throw new Error('Base UI: MenuRootContext is not defined.');
  }

  return context;
}

export { useMenuRootContext };
