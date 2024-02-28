'use client';
import * as React from 'react';
import { FormFieldContext, type FormFieldContextValue } from './FormFieldContext';

export function useFormFieldContext(): FormFieldContextValue | undefined {
  return React.useContext(FormFieldContext);
}
