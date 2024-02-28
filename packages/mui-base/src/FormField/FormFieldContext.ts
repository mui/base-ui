import * as React from 'react';
// import { FormFieldProps } from './FormField.types';

export interface FormFieldContextValue {}

/**
 * @internal
 */
const FormFieldContext = React.createContext<FormFieldContextValue | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  FormFieldContext.displayName = 'FormFieldContext';
}

export { FormFieldContext };
