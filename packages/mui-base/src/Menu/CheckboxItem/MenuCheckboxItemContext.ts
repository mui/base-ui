import * as React from 'react';

export interface MenuCheckboxItemContext {
  checked: boolean;
  highlighted: boolean;
  disabled: boolean;
}

export const MenuCheckboxItemContext = React.createContext<MenuCheckboxItemContext | undefined>(
  undefined,
);

export function useMenuCheckboxItemContext() {
  const context = React.useContext(MenuCheckboxItemContext);
  if (context === undefined) {
    throw new Error('useMenuCheckboxItemContext must be used within a MenuCheckboxItemProvider');
  }

  return context;
}
