import * as React from 'react';

export interface MenuRadioGroupContext {
  value: any;
  setValue: (newValue: any, event: Event) => void;
  disabled: boolean;
}

export const MenuRadioGroupContext = React.createContext<MenuRadioGroupContext | undefined>(
  undefined,
);

if (process.env.NODE_ENV !== 'production') {
  MenuRadioGroupContext.displayName = 'MenuRadioGroupContext';
}

export function useMenuRadioGroupContext() {
  const context = React.useContext(MenuRadioGroupContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: MenuRadioGroupContext is missing. MenuRadioGroup parts must be placed within <Menu.RadioGroup>.',
    );
  }

  return context;
}
