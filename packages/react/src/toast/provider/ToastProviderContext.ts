import * as React from 'react';
import type {} from '../useToastManager';
import { ToastStore } from '../store';

export interface ToastContext {
  store: ToastStore;
  viewportRef: React.RefObject<HTMLElement | null>;
}

export const ToastContext = React.createContext<ToastContext | undefined>(undefined);

export function useToastContext() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('Base UI: useToastManager must be used within <Toast.Provider>.');
  }
  return context;
}
