import * as React from 'react';
import { useContext } from '@base-ui/utils/useContext';

export interface SelectGroupContext {
  labelId: string | undefined;
  setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
}

export const SelectGroupContext = React.createContext<SelectGroupContext | undefined>(undefined);

export function useSelectGroupContext() {
  const context = useContext(SelectGroupContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: SelectGroupContext is missing. SelectGroup parts must be placed within <Select.Group>.',
    );
  }
  return context;
}
