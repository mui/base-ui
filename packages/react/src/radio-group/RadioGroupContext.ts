'use client';
import * as React from 'react';
import { NOOP } from '../utils/noop';

export interface RadioGroupContext {
  disabled: boolean | undefined;
  readOnly: boolean | undefined;
  required: boolean | undefined;
  checkedValue: unknown;
  setCheckedValue: React.Dispatch<React.SetStateAction<unknown>>;
  onValueChange: (value: unknown, event: Event) => void;
  touched: boolean;
  setTouched: React.Dispatch<React.SetStateAction<boolean>>;
}

export const RadioGroupContext = React.createContext<RadioGroupContext>({
  disabled: undefined,
  readOnly: undefined,
  required: undefined,
  checkedValue: '',
  setCheckedValue: NOOP,
  onValueChange: NOOP,
  touched: false,
  setTouched: NOOP,
});

if (process.env.NODE_ENV !== 'production') {
  RadioGroupContext.displayName = 'RadioGroupContext';
}

export function useRadioGroupContext() {
  return React.useContext(RadioGroupContext);
}
