'use client';
import * as React from 'react';
import type { CheckboxRoot } from './CheckboxRoot';

export type CheckboxRootContext = CheckboxRoot.OwnerState;

export const CheckboxRootContext = React.createContext<CheckboxRootContext | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  CheckboxRootContext.displayName = 'CheckboxRootContext';
}

export function useCheckboxRootContext() {
  const context = React.useContext(CheckboxRootContext);
  if (context === undefined) {
    throw new Error('Base UI: CheckboxRootContext is not defined.');
  }

  return context;
}
