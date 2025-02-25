import * as React from 'react';
import { PromiseToastOptions } from '../globalToast';

export interface Toast {
  id: string;
  title: string;
  type?: string;
  description?: string;
  timeout?: number;
  priority?: 'low' | 'high';
  animation?: 'starting' | 'ending' | undefined;
  height?: number;
}

export interface ToastContext {
  toasts: Toast[];
  setToasts: React.Dispatch<React.SetStateAction<Toast[]>>;
  hovering: boolean;
  setHovering: React.Dispatch<React.SetStateAction<boolean>>;
  focused: boolean;
  setFocused: React.Dispatch<React.SetStateAction<boolean>>;
  add: (toast: Omit<Toast, 'id'>) => string;
  remove: (id: string) => void;
  update: (id: string, updates: Partial<Omit<Toast, 'id'>>) => void;
  promise: <Value>(promise: Promise<Value>, options: PromiseToastOptions<Value>) => Promise<Value>;
  pauseTimers: () => void;
  resumeTimers: () => void;
  prevFocusRef: React.RefObject<HTMLElement | null>;
  finalizeRemove: (id: string) => void;
}

export const ToastContext = React.createContext<ToastContext | undefined>(undefined);

export function useToastContext() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('Base UI: useToast must be used within <Toast.Provider>.');
  }
  return context;
}
