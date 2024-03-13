import * as React from 'react';
import { FormFieldContextValue } from './FormField.types';

/**
 * @internal
 */
const FormFieldContext = React.createContext<FormFieldContextValue | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  FormFieldContext.displayName = 'FormFieldContext';
}

export { FormFieldContext };
