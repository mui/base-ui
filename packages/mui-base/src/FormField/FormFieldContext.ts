import * as React from 'react';
import { FieldAction } from './fieldAction.types';

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
  dispatch: (action: FieldAction) => void;
  error: string | null | Record<string, unknown>;
  hasLabel: boolean;
  registerLabel: (element: Element | null) => void;
  hasHelpText: boolean;
  registerHelpText: (element: Element | null) => void;
}

/**
 * @internal
 */
const FormFieldContext = React.createContext<FormFieldContextValue | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  FormFieldContext.displayName = 'FormFieldContext';
}

export { FormFieldContext };
