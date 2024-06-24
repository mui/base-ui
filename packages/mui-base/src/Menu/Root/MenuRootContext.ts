import * as React from 'react';
import { FloatingRootContext } from '@floating-ui/react';
import { MenuReducerAction, MenuReducerState } from './useMenuRoot.types';

export interface MenuRootContextValue {
  dispatch: React.Dispatch<MenuReducerAction>;
  state: MenuReducerState;
  floatingRootContext: FloatingRootContext;
}

export const MenuRootContext = React.createContext<MenuRootContextValue | null>(null);

export function useMenuRootContext() {
  const context = React.useContext(MenuRootContext);
  if (context === null) {
    throw new Error('Base UI: MenuRootContext is not defined.');
  }
  return context;
}
