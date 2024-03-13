'use client';
import * as React from 'react';
import { FormFieldContext } from './FormFieldContext';
import { FormFieldContextValue } from './FormField.types';

export function useFormFieldContext(): FormFieldContextValue | undefined {
  return React.useContext(FormFieldContext);
}
