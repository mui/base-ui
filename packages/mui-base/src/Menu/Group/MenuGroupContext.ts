import * as React from 'react';

export interface MenuGroupContext {
  setLabelId: (id: string | undefined) => void;
}

export const MenuGroupContext = React.createContext<MenuGroupContext | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  MenuGroupContext.displayName = 'MenuGroupContext';
}

export function useMenuGroupRootContext() {
  const context = React.useContext(MenuGroupContext);
  if (context === undefined) {
    throw new Error('Base UI: Missing MenuGroupRootContext provider');
  }

  return context;
}
