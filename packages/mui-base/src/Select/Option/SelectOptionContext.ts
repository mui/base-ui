import * as React from 'react';

interface SelectOptionContext {
  selected: boolean;
}

export const SelectOptionContext = React.createContext<SelectOptionContext | null>(null);

export function useSelectOptionContext() {
  const context = React.useContext(SelectOptionContext);
  if (context === null) {
    throw new Error('Base UI: useSelectOptionContext is not defined.');
  }
  return context;
}
