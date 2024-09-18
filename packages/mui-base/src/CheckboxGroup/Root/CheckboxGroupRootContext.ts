'use client';
import * as React from 'react';
import { UseCheckboxGroupParent } from '../Parent/useCheckboxGroupParent';

export interface CheckboxGroupRootContext {
  value: string[];
  setValue: (value: string[], event: Event) => void;
  allValues: string[] | undefined;
  parent: UseCheckboxGroupParent.ReturnValue;
}

export const CheckboxGroupRootContext = React.createContext<CheckboxGroupRootContext | null>(null);

export function useCheckboxGroupRootContext(optional = true) {
  const context = React.useContext(CheckboxGroupRootContext);
  if (context === null && !optional) {
    throw new Error('Base UI: CheckboxGroupRootContext is not defined.');
  }
  return context;
}
