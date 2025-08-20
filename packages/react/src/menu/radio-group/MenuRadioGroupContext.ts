import * as React from 'react';
import type { BaseUIEventData } from '../../utils/createBaseUIEventData';
import type { MenuRoot } from '../root/MenuRoot';

export interface MenuRadioGroupContext {
  value: any;
  setValue: (newValue: any, data: BaseUIEventData<MenuRoot.OpenChangeReason>) => void;
  disabled: boolean;
}

export const MenuRadioGroupContext = React.createContext<MenuRadioGroupContext | undefined>(
  undefined,
);

export function useMenuRadioGroupContext() {
  const context = React.useContext(MenuRadioGroupContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: MenuRadioGroupContext is missing. MenuRadioGroup parts must be placed within <Menu.RadioGroup>.',
    );
  }

  return context;
}
