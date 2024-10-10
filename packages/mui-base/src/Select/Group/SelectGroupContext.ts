import * as React from 'react';

export interface SelectGroupContext {
  labelId: string | undefined;
  setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
}

export const SelectGroupContext = React.createContext<SelectGroupContext | null>(null);

export function useSelectGroupContext() {
  const context = React.useContext(SelectGroupContext);
  if (context === null) {
    throw new Error('Base UI: <Select.GroupLabel> must be used within a <Select.Group>');
  }
  return context;
}
