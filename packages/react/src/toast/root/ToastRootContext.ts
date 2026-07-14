'use client';
import * as React from 'react';
import type { ToastObject } from '../useToastManager';

export interface ToastRootContext {
  toast: ToastObject<any>;
  setTitleId: React.Dispatch<React.SetStateAction<string | undefined>>;
  setDescriptionId: React.Dispatch<React.SetStateAction<string | undefined>>;
  visibleIndex: number;
  expanded: boolean;
  recalculateHeight: (flushSync?: boolean) => void;
}

export const ToastRootContext = React.createContext<ToastRootContext | undefined>(undefined);

export function useToastRootContext(): ToastRootContext {
  const context = React.useContext(ToastRootContext);
  if (!context) {
    throw new Error(
      'Base UI: ToastRootContext is missing. Toast parts must be used within <Toast.Root>.',
    );
  }
  return context as ToastRootContext;
}
