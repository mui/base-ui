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
