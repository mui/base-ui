import * as React from 'react';
import { useContext } from '@base-ui/utils/useContext';

export interface MenuGroupContext {
  setLabelId: (id: string | undefined) => void;
}

export const MenuGroupContext = React.createContext<MenuGroupContext | undefined>(undefined);

export function useMenuGroupRootContext() {
  const context = useContext(MenuGroupContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: MenuGroupRootContext is missing. Menu group parts must be used within <Menu.Group>.',
    );
  }

  return context;
}
