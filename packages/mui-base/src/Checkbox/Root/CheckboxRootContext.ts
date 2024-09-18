'use client';
import * as React from 'react';
import type { CheckboxRoot } from './CheckboxRoot';

export type CheckboxRootContext = CheckboxRoot.OwnerState;

export const CheckboxRootContext = React.createContext<CheckboxRootContext | null>(null);

export function useCheckboxRootContext() {
  const context = React.useContext(CheckboxRootContext);
  if (context === null) {
    throw new Error(
      'Base UI: Checkbox.Indicator must be placed inside the Checkbox.Root component.',
    );
  }
  return context;
}
