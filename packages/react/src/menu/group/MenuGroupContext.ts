import * as React from 'react';
import { throwMissingContextError } from '../../utils/errorHelper';

export interface MenuGroupContext {
  setLabelId: (id: string | undefined) => void;
}

export const MenuGroupContext = React.createContext<MenuGroupContext | undefined>(undefined);

export function useMenuGroupRootContext() {
  const context = React.useContext(MenuGroupContext);
  if (context === undefined) {
    throwMissingContextError('MenuGroupRootContext', 'Menu group parts', '<Menu.Group>');
  }

  return context;
}
