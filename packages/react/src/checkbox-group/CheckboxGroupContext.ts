'use client';
import * as React from 'react';
import { useFieldControlValidation } from '../field/control/useFieldControlValidation';
import { useCheckboxGroupParent } from './useCheckboxGroupParent';
import { BaseUIEventData } from '../utils/createBaseUIEvent';

export interface CheckboxGroupContext {
  value: string[] | undefined;
  defaultValue: string[] | undefined;
  setValue: (value: string[], data: BaseUIEventData<'none'>) => void;
  allValues: string[] | undefined;
  parent: useCheckboxGroupParent.ReturnValue;
  disabled: boolean;
  fieldControlValidation: useFieldControlValidation.ReturnValue;
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
