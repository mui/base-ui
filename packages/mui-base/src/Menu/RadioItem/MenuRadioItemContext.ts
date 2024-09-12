import * as React from 'react';

export interface MenuRadioItemContext {
  checked: boolean;
  highlighted: boolean;
  disabled: boolean;
}

export const MenuRadioItemContext = React.createContext<MenuRadioItemContext | undefined>(
  undefined,
);

export function useMenuRadioItemContext() {
  const context = React.useContext(MenuRadioItemContext);
  if (context === undefined) {
    throw new Error('useMenuRadioItemContext must be used within a MenuRadioItemProvider');
  }

  return context;
}
