'use client';
import * as React from 'react';
import type { useNumberFieldRoot } from './useNumberFieldRoot';
import type { NumberFieldRoot } from './NumberFieldRoot';

export interface NumberFieldRootContext extends useNumberFieldRoot.ReturnValue {
  state: NumberFieldRoot.State;
}

export const NumberFieldRootContext = React.createContext<NumberFieldRootContext | undefined>(
  undefined,
);

export function useNumberFieldRootContext() {
  const context = React.useContext(NumberFieldRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: NumberFieldRootContext is missing. NumberField parts must be placed within <NumberField.Root>.',
    );
  }

  return context;
}
