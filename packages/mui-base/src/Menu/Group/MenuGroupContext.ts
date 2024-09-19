import * as React from 'react';

export interface MenuGroupRootContext {
  setLabelId: (id: string | undefined) => void;
}

export const MenuGroupRootContext = React.createContext<MenuGroupRootContext | undefined>(
  undefined,
);

if (process.env.NODE_ENV !== 'production') {
  MenuGroupRootContext.displayName = 'MenuGroupRootContext';
}

export function useMenuGroupRootContext() {
  const context = React.useContext(MenuGroupRootContext);
  if (context == null) {
    throw new Error('Base UI: Missing MenuGroupRootContext provider');
  }

  return context;
}
