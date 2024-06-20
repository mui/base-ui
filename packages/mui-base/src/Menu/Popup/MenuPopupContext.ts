import * as React from 'react';
import type { ListItemMetadata, UseListReturnValue } from '../../useList';
import type { UseCompoundParentReturnValue } from '../../useCompound/useCompound.types';

export interface MenuPopupContextValue {
  registerItem: UseCompoundParentReturnValue<string, ListItemMetadata<string>>['registerItem'];
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
