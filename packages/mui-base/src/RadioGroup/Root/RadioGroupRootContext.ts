'use client';
import * as React from 'react';
import { NOOP } from '../../utils/noop';

export const RadioGroupRootContext = React.createContext<RadioGroupRootContext.Value>({
  disabled: undefined,
  readOnly: undefined,
  required: undefined,
  checkedItem: '',
  setCheckedItem: NOOP,
  onValueChange: NOOP,
  touched: false,
  setTouched: NOOP,
});

export function useRadioGroupRootContext() {
  return React.useContext(RadioGroupRootContext);
}

export namespace RadioGroupRootContext {
  export interface Value {
    disabled: boolean | undefined;
    readOnly: boolean | undefined;
    required: boolean | undefined;
    checkedItem: string | number | undefined;
    setCheckedItem: React.Dispatch<React.SetStateAction<string | number | undefined>>;
    onValueChange: (value: string | number, event: React.ChangeEvent<HTMLInputElement>) => void;
    touched: boolean;
    setTouched: React.Dispatch<React.SetStateAction<boolean>>;
  }
}
