import * as React from 'react';
import type { FieldValidityData } from '../../Field/Root/FieldRoot.types';

export const FormRootContext = React.createContext<FormRootContext.Value>({
  formRef: {
    current: {
      fields: new Map(),
    },
  },
  errors: {},
  onClearErrors: () => {},
});

export function useFormRootContext() {
  return React.useContext(FormRootContext);
}

type Errors = Record<string, string | string[]>;

export namespace FormRootContext {
  export interface Value {
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
}
