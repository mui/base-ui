import * as React from 'react';

interface SelectOptionContext {
  selected: boolean;
}

export const SelectOptionContext = React.createContext<SelectOptionContext | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  SelectOptionContext.displayName = 'SelectOptionContext';
}

export function useSelectOptionContext() {
  const context = React.useContext(SelectOptionContext);
  if (context === undefined) {
    throw new Error('Base UI: useSelectOptionContext is not defined.');
  }
  return context;
}
