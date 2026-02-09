'use client';
import * as React from 'react';
import type { CheckboxRoot } from './CheckboxRoot';
import { useContext } from '../../utils/createContext';

export type CheckboxRootContext = CheckboxRoot.State;

export const CheckboxRootContext = React.createContext<CheckboxRootContext | undefined>(undefined);

export function useCheckboxRootContext() {
  return useContext(
    CheckboxRootContext,
    'Base UI: CheckboxRootContext is missing. Checkbox parts must be placed within <Checkbox.Root>.',
  );
}
