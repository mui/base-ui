'use client';
import * as React from 'react';

export interface RadioRootContext {
  disabled: boolean;
  readOnly: boolean;
  checked: boolean;
  required: boolean;
}

export const RadioRootContext = React.createContext<RadioRootContext | null>(null);

export function useRadioRootContext() {
  const value = React.useContext(RadioRootContext);
  if (value === null) {
    throw new Error('Base UI: <Radio.Indicator> must be used within <Radio.Root>');
  }
  return value;
}
