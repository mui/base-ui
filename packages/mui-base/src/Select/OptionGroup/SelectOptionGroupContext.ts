import * as React from 'react';

export interface SelectOptionGroupContext {
  labelId: string | undefined;
  setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
}

export const SelectOptionGroupContext = React.createContext<SelectOptionGroupContext | null>(null);

export function useSelectOptionGroupContext() {
  const context = React.useContext(SelectOptionGroupContext);
  if (context === null) {
    throw new Error('Base UI: <Select.GroupLabel> must be used within a <Select.Group>');
  }
  return context;
}
