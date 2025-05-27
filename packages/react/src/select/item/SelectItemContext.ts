import * as React from 'react';

export interface SelectItemContext {
  selected: boolean;
  indexRef: React.RefObject<number>;
  textRef: React.RefObject<HTMLElement | null>;
}

export const SelectItemContext = React.createContext<SelectItemContext | undefined>(undefined);

export function useSelectItemContext() {
  const context = React.useContext(SelectItemContext);
  if (!context) {
    throw new Error(
      'Base UI: SelectItemContext is missing. SelectItem parts must be placed within <Select.Item>.',
    );
  }
  return context;
}
