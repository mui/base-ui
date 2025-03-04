import * as React from 'react';
import { Toast, GlobalPromiseToastOptions } from '../types';

export { Toast };

export interface ToastContext<Data = Record<string, unknown>> {
  toasts: Toast<Data>[];
  setToasts: React.Dispatch<React.SetStateAction<Toast<Data>[]>>;
  hovering: boolean;
  setHovering: React.Dispatch<React.SetStateAction<boolean>>;
  focused: boolean;
  setFocused: React.Dispatch<React.SetStateAction<boolean>>;
  add: <ToastData extends Data>(toast: Omit<Toast<ToastData>, 'id'>) => string;
  remove: (id: string) => void;
  update: <ToastData extends Data>(
    id: string,
    updates: Partial<Omit<Toast<ToastData>, 'id'>>,
  ) => void;
  promise: <Value, ToastData extends Data>(
    promise: Promise<Value>,
    options: GlobalPromiseToastOptions<Value, ToastData>,
  ) => Promise<Value>;
  pauseTimers: () => void;
  resumeTimers: () => void;
  finalizeRemove: (id: string) => void;
  prevFocusRef: React.RefObject<HTMLElement | null>;
  viewportRef: React.RefObject<HTMLElement | null>;
  scheduleTimer: (id: string, delay: number, callback: () => void) => void;
}

export const ToastContext = React.createContext<ToastContext | undefined>(undefined);

export function useToastContext() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('Base UI: useToast must be used within <Toast.Provider>.');
  }
  return context;
}
