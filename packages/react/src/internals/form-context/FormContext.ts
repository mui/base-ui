'use client';
import * as React from 'react';
import type { FieldValidityData } from '../../field/root/FieldRoot';
import { NOOP } from '../noop';
import type { Form } from '../../form/Form';

export type Errors = Record<string, string | string[]>;

export interface FormContext {
  errors: Errors;
  clearErrors: (name: string | undefined) => void;
  elementRef: React.RefObject<HTMLFormElement | null>;
  formRef: React.RefObject<{
    fields: Map<
      string,
      {
        name: string | undefined;
        /**
         * After this returns, the field registry entry reflects the latest synchronous
         * validity verdict. Async validators do not block submit.
         */
        validate: () => void;
        validityData: FieldValidityData;
        controlRef: React.RefObject<HTMLElement | null>;
        /** Whether the field's native form control is effectively disabled at read time. */
        isDisabled: () => boolean;
        getValue: () => unknown;
      }
    >;
  }>;
  validationMode: Form.ValidationMode;
  submitAttemptedRef: React.RefObject<boolean>;
}

export const FormContext = React.createContext<FormContext>({
  elementRef: { current: null },
  formRef: {
    current: {
      fields: new Map(),
    },
  },
  errors: {},
  clearErrors: NOOP,
  validationMode: 'onSubmit',
  submitAttemptedRef: {
    current: false,
  },
});

export function useFormContext() {
  return React.useContext(FormContext);
}
