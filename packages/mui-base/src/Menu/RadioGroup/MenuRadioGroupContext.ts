import * as React from 'react';

export interface MenuRadioGroupContext {
  value: any;
  setValue: (newValue: any, event: Event) => void;
}

export const MenuRadioGroupContext = React.createContext<MenuRadioGroupContext | null>(null);

if (process.env.NODE_ENV !== 'production') {
  MenuRadioGroupContext.displayName = 'MenuRadioGroupContext';
}

export function useMenuRadioGroupContext() {
  const context = React.useContext(MenuRadioGroupContext);
  if (context === null) {
    throw new Error('useMenuRadioGroupContext must be used within a MenuRadioGroup');
  }

  return context;
}
