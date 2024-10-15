import * as React from 'react';

export interface SelectGroupContext {
  labelId: string | undefined;
  setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
}

export const SelectGroupContext = React.createContext<SelectGroupContext | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  SelectGroupContext.displayName = 'SelectGroupContext';
}

export function useSelectGroupContext() {
  const context = React.useContext(SelectGroupContext);
  if (context === undefined) {
    throw new Error('Base UI: <Select.GroupLabel> must be used within a <Select.Group>');
  }
  return context;
}
