'use client';
import * as React from 'react';
import { NOOP } from '../utils/noop';
import type { UseFieldValidationReturnValue } from '../field/root/useFieldValidation';
import type { BaseUIChangeEventDetails } from '../utils/createBaseUIEventDetails';
import type { BaseUIEventReasons } from '../utils/reasons';

export interface RadioGroupContext {
  disabled: boolean | undefined;
  readOnly: boolean | undefined;
  required: boolean | undefined;
  name: string | undefined;
  checkedValue: unknown;
  setCheckedValue: (
    value: unknown,
    eventDetails: BaseUIChangeEventDetails<BaseUIEventReasons['none']>,
  ) => void;
  onValueChange: (
    value: unknown,
    eventDetails: BaseUIChangeEventDetails<BaseUIEventReasons['none']>,
  ) => void;
  touched: boolean;
  setTouched: React.Dispatch<React.SetStateAction<boolean>>;
  validation?: UseFieldValidationReturnValue;
  registerControlRef: (element: HTMLElement | null) => void;
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
  registerControlRef: NOOP,
});

export function useRadioGroupContext() {
  return React.useContext(RadioGroupContext);
}
