'use client';
import * as React from 'react';
import type { UseFieldValidationReturnValue } from '../field/root/useFieldValidation';
import { useCheckboxGroupParent } from './useCheckboxGroupParent';
import type { BaseUIChangeEventDetails } from '../utils/createBaseUIEventDetails';
import type { BaseUIEventReasons } from '../utils/reasons';

export interface CheckboxGroupContext {
  value: string[] | undefined;
  defaultValue: string[] | undefined;
  setValue: (
    value: string[],
    eventDetails: BaseUIChangeEventDetails<BaseUIEventReasons['none']>,
  ) => void;
  allValues: string[] | undefined;
  parent: useCheckboxGroupParent.ReturnValue;
  disabled: boolean;
  validation: UseFieldValidationReturnValue;
  registerControlRef: (element: HTMLButtonElement | null) => void;
}

export const CheckboxGroupContext = React.createContext<CheckboxGroupContext | undefined>(
  undefined,
);

export function useCheckboxGroupContext(optional: false): CheckboxGroupContext;
export function useCheckboxGroupContext(optional?: true): CheckboxGroupContext | undefined;
export function useCheckboxGroupContext(optional = true) {
  const context = React.useContext(CheckboxGroupContext);
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: CheckboxGroupContext is missing. CheckboxGroup parts must be placed within <CheckboxGroup>.',
    );
  }

  return context;
}
