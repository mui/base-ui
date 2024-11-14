import * as React from 'react';

interface SelectOptionContext {
  selected: boolean;
  indexRef: React.RefObject<number>;
}

export const SelectOptionContext = React.createContext<SelectOptionContext | undefined>(undefined);

export function useSelectOptionContext() {
  const context = React.useContext(SelectOptionContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: SelectOptionContext is missing. SelectOption parts must be placed within <Select.Option>.',
    );
  }
  return context;
}
