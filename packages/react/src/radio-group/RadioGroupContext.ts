'use client';
import * as React from 'react';
import { NOOP } from '../utils/noop';
import { useFieldControlValidation } from '../field/control/useFieldControlValidation';
import type { BaseUIChangeEventDetails } from '../utils/createBaseUIEventDetails';

export interface RadioGroupContext {
  disabled: boolean | undefined;
  readOnly: boolean | undefined;
  required: boolean | undefined;
  name: string | undefined;
  checkedValue: unknown;
  setCheckedValue: (value: unknown, eventDetails: BaseUIChangeEventDetails<'none'>) => void;
  onValueChange: (value: unknown, eventDetails: BaseUIChangeEventDetails<'none'>) => void;
  touched: boolean;
  setTouched: React.Dispatch<React.SetStateAction<boolean>>;
  fieldControlValidation?: ReturnType<typeof useFieldControlValidation>;
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
