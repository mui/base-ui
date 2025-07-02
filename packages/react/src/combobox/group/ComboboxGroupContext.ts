import * as React from 'react';

export interface ComboboxGroupContext {
  labelId: string | undefined;
  setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
}

export const ComboboxGroupContext = React.createContext<ComboboxGroupContext | undefined>(
  undefined,
);

export function useComboboxGroupContext() {
  const context = React.useContext(ComboboxGroupContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: ComboboxGroupContext is missing. ComboboxGroup parts must be placed within <Combobox.Group>.',
    );
  }
  return context;
}
