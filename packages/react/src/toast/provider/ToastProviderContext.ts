import * as React from 'react';
import type { ToastContextValue } from '../useToast';

export type ToastContext<Data extends object> = ToastContextValue<Data>;

export const ToastContext = React.createContext<ToastContext<any> | undefined>(undefined);

export function useToastContext() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('Base UI: useToast must be used within <Toast.Provider>.');
  }
  return context;
}
