'use client';
import * as React from 'react';
import { UseFormControlContextReturnValue } from './FormControl.types';
import { FormControlContext } from './FormControlContext';

export function useFormControlContext(): UseFormControlContextReturnValue | undefined {
  return React.useContext(FormControlContext);
}
