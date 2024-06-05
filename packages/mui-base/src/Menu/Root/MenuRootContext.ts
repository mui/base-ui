import * as React from 'react';
import { DropdownAction, DropdownState } from './useMenuRoot.types';

export interface MenuRootContextValue {
  dispatch: React.Dispatch<DropdownAction>;
  popupId: string;
  registerPopup: (popupId: string) => void;
  registerTrigger: (element: HTMLElement | null) => void;
  state: DropdownState;
  triggerElement: HTMLElement | null;
}

const MenuRootContext = React.createContext<MenuRootContextValue | null>(null);

export { MenuRootContext };
