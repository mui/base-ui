'use client';
import * as React from 'react';

export interface RadioGroupRootContextValue {
  disabled: boolean | undefined;
  readOnly: boolean | undefined;
  required: boolean | undefined;
  checkedItem: unknown;
  setCheckedItem: React.Dispatch<React.SetStateAction<unknown>>;
  onValueChange: (value: unknown, event: React.ChangeEvent<HTMLInputElement>) => void;
  touched: boolean;
  setTouched: React.Dispatch<React.SetStateAction<boolean>>;
}

export const RadioGroupRootContext = React.createContext<RadioGroupRootContextValue | null>(null);

export function useRadioGroupRootContext() {
  const value = React.useContext(RadioGroupRootContext);
  if (value === null) {
    throw new Error('RadioGroup components must be used within <RadioGroup.Root>');
  }
  return value;
}
