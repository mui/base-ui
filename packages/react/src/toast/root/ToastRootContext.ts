import * as React from 'react';
import type { Toast } from '../provider/ToastProviderContext';

export interface ToastRootContext {
  toast: Toast;
  rootRef: React.RefObject<HTMLElement | null>;
}

export const ToastRootContext = React.createContext<ToastRootContext | undefined>(undefined);

export function useToastRootContext() {
  const context = React.useContext(ToastRootContext);
  if (!context) {
    throw new Error('useToastRoot must be used within a ToastRoot');
  }
  return context;
}
