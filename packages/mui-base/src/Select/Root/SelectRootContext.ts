'use client';
import * as React from 'react';
import type { useSelectRoot } from './useSelectRoot';
import { useFieldControlValidation } from '../../Field/Control/useFieldControlValidation';

export interface SelectRootContext
  extends useSelectRoot.ReturnValue,
    useFieldControlValidation.ReturnValue {
  typingRef: React.RefObject<boolean>;
  alignOptionToTrigger: boolean;
  id: string | undefined;
  name: string | undefined;
  disabled: boolean;
  required: boolean;
  readOnly: boolean;
  selectId: string | undefined;
}

export const SelectRootContext = React.createContext<SelectRootContext | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  SelectRootContext.displayName = 'SelectRootContext';
}

export function useSelectRootContext() {
  const context = React.useContext(SelectRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: SelectRootContext is missing. SelectRoot parts must be placed within <Select.Root>.',
    );
  }
  return context;
}
