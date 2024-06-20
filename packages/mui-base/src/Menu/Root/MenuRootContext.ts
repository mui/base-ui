import * as React from 'react';
import { MenuReducerAction, MenuReducerState } from './useMenuRoot.types';

export interface MenuRootContextValue {
  dispatch: React.Dispatch<MenuReducerAction>;
  popupId: string;
  registerPopup: (popupId: string) => void;
  registerTrigger: (element: HTMLElement | null) => void;
  state: MenuReducerState;
  triggerElement: HTMLElement | null;
}

export const MenuRootContext = React.createContext<MenuRootContextValue | null>(null);

export function useMenuRootContext() {
  const context = React.useContext(MenuRootContext);
  if (context === null) {
    throw new Error('Base UI: MenuRootContext is not defined.');
  }
  return context;
}
