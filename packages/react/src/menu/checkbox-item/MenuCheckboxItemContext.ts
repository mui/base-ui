import * as React from 'react';
import { useContext } from '@base-ui/utils/useContext';

export interface MenuCheckboxItemContext {
  checked: boolean;
  highlighted: boolean;
  disabled: boolean;
}

export const MenuCheckboxItemContext = React.createContext<MenuCheckboxItemContext | undefined>(
  undefined,
);

export function useMenuCheckboxItemContext() {
  const context = useContext(MenuCheckboxItemContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: MenuCheckboxItemContext is missing. MenuCheckboxItem parts must be placed within <Menu.CheckboxItem>.',
    );
  }

  return context;
}
