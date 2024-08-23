import * as React from 'react';
import { UseCheckboxGroupParentReturnValue } from '../Parent/useCheckboxGroupParent.types';

export interface CheckboxGroupRootContext {
  value: string[];
  setValue: (value: string[]) => void;
  allValues: string[] | undefined;
  parent: UseCheckboxGroupParentReturnValue;
}

export const CheckboxGroupRootContext = React.createContext<CheckboxGroupRootContext | null>(null);

export function useCheckboxGroupRootContext(optional = true) {
  const context = React.useContext(CheckboxGroupRootContext);
  if (context === null && !optional) {
    throw new Error('<CheckboxGroup.Label> must be used within <CheckboxGroup.Root>');
  }
  return context;
}
