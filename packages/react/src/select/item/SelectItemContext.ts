import * as React from 'react';

export interface SelectItemContext {
  selected: boolean;
  selectedByFocus: boolean;
  indexRef: React.RefObject<number>;
}

export const SelectItemContext = React.createContext<SelectItemContext | undefined>(undefined);

export function useSelectItemContext() {
  const context = React.useContext(SelectItemContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: SelectItemContext is missing. SelectItem parts must be placed within <Select.Item>.',
    );
  }
  return context;
}
