'use client';
import * as React from 'react';
import { NOOP } from '../utils/noop';
import { useFieldControlValidation } from '../field/control/useFieldControlValidation';

export interface RadioGroupContext {
  disabled: boolean | undefined;
  readOnly: boolean | undefined;
  required: boolean | undefined;
  name: string | undefined;
  checkedValue: unknown;
  setCheckedValue: React.Dispatch<React.SetStateAction<unknown>>;
  onValueChange: (value: unknown, event: Event) => void;
  touched: boolean;
  setTouched: React.Dispatch<React.SetStateAction<boolean>>;
  fieldControlValidation?: ReturnType<typeof useFieldControlValidation>;
}

export const RadioGroupContext = React.createContext<RadioGroupContext>({
  disabled: undefined,
  readOnly: undefined,
  required: undefined,
  name: undefined,
  checkedValue: '',
  setCheckedValue: NOOP,
  onValueChange: NOOP,
  touched: false,
  setTouched: NOOP,
});

export function useRadioGroupContext() {
  return React.useContext(RadioGroupContext);
}
