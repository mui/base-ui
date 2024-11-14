import * as React from 'react';

export interface SelectIndexContext {
  activeIndex: number | null;
  setActiveIndex: React.Dispatch<React.SetStateAction<number | null>>;
  selectedIndex: number | null;
  setSelectedIndex: React.Dispatch<React.SetStateAction<number | null>>;
}

export const SelectIndexContext = React.createContext<SelectIndexContext | undefined>(undefined);

export function useSelectIndexContext() {
  const context = React.useContext(SelectIndexContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: SelectIndexContext is missing. Select parts must be placed within <Select.Root>.',
    );
  }
  return context;
}
