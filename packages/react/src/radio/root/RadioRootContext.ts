'use client';
import * as React from 'react';

export interface RadioRootContext {
  disabled: boolean;
  readOnly: boolean;
  checked: boolean;
  required: boolean;
}

export const RadioRootContext = React.createContext<RadioRootContext | undefined>(undefined);

export function useRadioRootContext() {
  const value = React.useContext(RadioRootContext);
  if (value === undefined) {
    throw new Error(
      'Base UI: RadioRootContext is missing. Radio parts must be placed within <Radio.Root>.',
    );
  }

  return value;
}
