import * as React from 'react';
import { MenuItemMetadata } from '../Item/useMenuItem.types';
import { UseCompoundParentReturnValue } from '../../useCompound';
import { UseListReturnValue } from '../../useList';

export interface MenuPopupContextValue {
  registerItem: UseCompoundParentReturnValue<string, MenuItemMetadata>['registerItem'];
  getItemState: UseListReturnValue<string>['getItemState'];
}

export const MenuPopupContext = React.createContext<MenuPopupContextValue | null>(null);

export function useMenuPopupContext() {
  const context = React.useContext(MenuPopupContext);
  if (context === null) {
    throw new Error('Base UI: MenuPopupContext is not defined.');
  }

  return context;
}
