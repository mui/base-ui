'use client';
import * as React from 'react';
import type { useSelectRoot } from './useSelectRoot';

export interface SelectRootContext extends useSelectRoot.ReturnValue {
  typingRef: React.MutableRefObject<boolean>;
  alignToItem: boolean;
  id: string | undefined;
  name: string | undefined;
  disabled: boolean;
  required: boolean;
  readOnly: boolean;
}

export const SelectRootContext = React.createContext<SelectRootContext | null>(null);

if (process.env.NODE_ENV !== 'production') {
  SelectRootContext.displayName = 'SelectRootContext';
}

export function useSelectRootContext() {
  const context = React.useContext(SelectRootContext);
  if (context === null) {
    throw new Error('Base UI: SelectRootContext is not defined.');
  }
  return context;
}
