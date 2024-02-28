import * as React from 'react';
// import { FormFieldProps } from './FormField.types';

export interface FormFieldContextValue {
  id: string;
  labelId: string;
  helpTextId: string;
  value: unknown;
  dirty: boolean;
  disabled: boolean;
  focused: boolean;
  invalid: boolean;
  touched: boolean;
  setFocused: React.Dispatch<React.SetStateAction<boolean>>;
  setValue: React.Dispatch<React.SetStateAction<unknown>>;
  error: string | null | Record<string, unknown>;
}

/**
 * @internal
 */
const FormFieldContext = React.createContext<FormFieldContextValue | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  FormFieldContext.displayName = 'FormFieldContext';
}

export { FormFieldContext };
