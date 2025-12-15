import * as React from 'react';
import type { MenuRoot } from '../root/MenuRoot';
import { useContext } from '@base-ui/utils/useContext';

export interface MenuRadioGroupContext {
  value: any;
  setValue: (newValue: any, eventDetails: MenuRoot.ChangeEventDetails) => void;
  disabled: boolean;
}

export const MenuRadioGroupContext = React.createContext<MenuRadioGroupContext | undefined>(
  undefined,
);

export function useMenuRadioGroupContext() {
  const context = useContext(MenuRadioGroupContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: MenuRadioGroupContext is missing. MenuRadioGroup parts must be placed within <Menu.RadioGroup>.',
    );
  }

  return context;
}
