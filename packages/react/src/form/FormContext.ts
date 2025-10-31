'use client';
import * as React from 'react';
import type { FieldValidityData } from '../field/root/FieldRoot';
import { NOOP } from '../utils/noop';
import type { Form } from './Form';

export type Errors = Record<string, string | string[]>;

export interface FormContext {
  errors: Errors;
  clearErrors: (name: string | undefined) => void;
  formRef: React.RefObject<{
    fields: Map<
      string,
      {
        name: string | undefined;
        validate: () => void;
        validityData: FieldValidityData;
        controlRef: React.RefObject<HTMLElement | null>;
        getValueRef: React.RefObject<(() => unknown) | undefined>;
      }
    >;
  }>;
  validationMode: Form.ValidationMode;
  submitAttemptedRef: React.RefObject<boolean>;
}

export const FormContext = React.createContext<FormContext>({
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
