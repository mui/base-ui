'use client';
import * as React from 'react';
import { UseCheckboxGroupParent } from '../parent/useCheckboxGroupParent';

export interface CheckboxGroupRootContext {
  value: string[] | undefined;
  defaultValue: string[] | undefined;
  setValue: (value: string[], event: Event) => void;
  allValues: string[] | undefined;
  parent: UseCheckboxGroupParent.ReturnValue;
}

export const CheckboxGroupRootContext = React.createContext<CheckboxGroupRootContext | undefined>(
  undefined,
);

if (process.env.NODE_ENV !== 'production') {
  CheckboxGroupRootContext.displayName = 'CheckboxGroupRootContext';
}

export function useCheckboxGroupRootContext(optional: false): CheckboxGroupRootContext;
export function useCheckboxGroupRootContext(optional?: true): CheckboxGroupRootContext | undefined;
export function useCheckboxGroupRootContext(optional = true) {
  const context = React.useContext(CheckboxGroupRootContext);
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: CheckboxGroupRootContext is missing. CheckboxGroup parts must be placed within <CheckboxGroup.Root>.',
    );
  }

  return context;
}
