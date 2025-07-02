'use client';
import * as React from 'react';
import type { CheckboxRoot } from './CheckboxRoot';

export type CheckboxRootContext = CheckboxRoot.State;

export const CheckboxRootContext = React.createContext<CheckboxRootContext | undefined>(undefined);

export function useCheckboxRootContext() {
  const context = React.useContext(CheckboxRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: CheckboxRootContext is missing. Checkbox parts must be placed within <Checkbox.Root>.',
    );
  }

  return context;
}
