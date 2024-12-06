'use client';
import * as React from 'react';
import { NOOP } from '../../utils/noop';

export interface RadioGroupRootContext {
  disabled: boolean | undefined;
  readOnly: boolean | undefined;
  required: boolean | undefined;
  checkedValue: unknown;
  setCheckedValue: React.Dispatch<React.SetStateAction<unknown>>;
  onValueChange: (value: unknown, event: Event) => void;
  touched: boolean;
  setTouched: React.Dispatch<React.SetStateAction<boolean>>;
}

export const RadioGroupRootContext = React.createContext<RadioGroupRootContext>({
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
  RadioGroupRootContext.displayName = 'RadioGroupRootContext';
}

export function useRadioGroupRootContext() {
  return React.useContext(RadioGroupRootContext);
}
