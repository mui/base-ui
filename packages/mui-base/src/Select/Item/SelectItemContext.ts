import * as React from 'react';

interface SelectItemContext {
  selected: boolean;
}

export const SelectItemContext = React.createContext<SelectItemContext | null>(null);

export function useSelectItemContext() {
  const context = React.useContext(SelectItemContext);
  if (context === null) {
    throw new Error('Base UI: useSelectItemContext is not defined.');
  }
  return context;
}
