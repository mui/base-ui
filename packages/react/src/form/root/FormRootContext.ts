import * as React from 'react';
import type { FieldValidityData } from '../../field/root/FieldRoot';

type Errors = Record<string, string | string[]>;

export interface FormRootContext {
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

export const FormRootContext = React.createContext<FormRootContext>({
  formRef: {
    current: {
      fields: new Map(),
    },
  },
  errors: {},
  onClearErrors: () => {},
});

if (process.env.NODE_ENV !== 'production') {
  FormRootContext.displayName = 'FormRootContext';
}

export function useFormRootContext() {
  return React.useContext(FormRootContext);
}
