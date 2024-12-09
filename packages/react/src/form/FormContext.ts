import * as React from 'react';
import type { FieldValidityData } from '../field/root/FieldRoot';

type Errors = Record<string, string | string[]>;

export interface FormContext {
  errors: Errors;
  onClearErrors: (errors: Errors) => void;
  formRef: React.MutableRefObject<{
    fields: Map<
      string,
      {
        validate: () => void;
        validityData: FieldValidityData;
        controlRef: React.RefObject<HTMLElement>;
      }
    >;
  }>;
}

export const FormContext = React.createContext<FormContext>({
  formRef: {
    current: {
      fields: new Map(),
    },
  },
  errors: {},
  onClearErrors: () => {},
});

if (process.env.NODE_ENV !== 'production') {
  FormContext.displayName = 'FormContext';
}

export function useFormContext() {
  return React.useContext(FormContext);
}
