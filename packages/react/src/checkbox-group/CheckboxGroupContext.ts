'use client';
import * as React from 'react';
import type { UseFieldValidationReturnValue } from '../field/root/useFieldValidation';
import type { UseCheckboxGroupParentReturnValue } from './useCheckboxGroupParent';
import type { BaseUIChangeEventDetails } from '../internals/createBaseUIEventDetails';
import type { BaseUIEventReasons } from '../internals/reasons';
import type { LabelableContext } from '../internals/labelable-provider/LabelableContext';

export interface CheckboxGroupContext {
  value: string[];
  setValue: (
    value: string[],
    eventDetails: BaseUIChangeEventDetails<BaseUIEventReasons['none']>,
  ) => void;
  allValues: string[] | undefined;
  parent: UseCheckboxGroupParentReturnValue;
  disabled: boolean;
  validation: UseFieldValidationReturnValue;
  /**
   * `registerControlId` of the labelable scope the group renders in. A checkbox that sees the
   * same function shares that scope with the group, which means the group is the field's
   * control rather than the checkbox.
   */
  registerControlId: LabelableContext['registerControlId'];
}

export const CheckboxGroupContext = React.createContext<CheckboxGroupContext | undefined>(
  undefined,
);

export function useCheckboxGroupContext() {
  return React.useContext(CheckboxGroupContext);
}
