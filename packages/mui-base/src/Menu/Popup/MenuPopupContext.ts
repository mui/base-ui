import * as React from 'react';
import type { ListItemMetadata } from '../../useList';
import type { CompoundParentContextValue } from '../../useCompound/useCompound.types';

export interface MenuPopupContextValue {
  compoundParentContext: CompoundParentContextValue<string, ListItemMetadata>;
}

export const MenuPopupContext = React.createContext<MenuPopupContextValue | null>(null);

MenuPopupContext.displayName = 'MenuPopupContext';

export function useMenuPopupContext() {
  const context = React.useContext(MenuPopupContext);
  if (context === null) {
    throw new Error('Base UI: MenuPopupContext is not defined.');
  }

  return context;
}
