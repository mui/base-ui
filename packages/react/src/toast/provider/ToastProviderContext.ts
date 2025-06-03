import * as React from 'react';
import type { ToastObject, useToastManager } from '../useToastManager';
import { throwMissingContextError } from '../../utils/errorHelper';

export interface ToastContextValue<Data extends object> {
  toasts: ToastObject<Data>[];
  setToasts: React.Dispatch<React.SetStateAction<ToastObject<Data>[]>>;
  hovering: boolean;
  setHovering: React.Dispatch<React.SetStateAction<boolean>>;
  focused: boolean;
  setFocused: React.Dispatch<React.SetStateAction<boolean>>;
  add: (options: useToastManager.AddOptions<Data>) => string;
  update: (id: string, options: useToastManager.UpdateOptions<Data>) => void;
  promise: <Value>(
    value: Promise<Value>,
    options: useToastManager.PromiseOptions<Value, Data>,
  ) => Promise<Value>;
  close: (id: string) => void;
  pauseTimers: () => void;
  resumeTimers: () => void;
  remove: (id: string) => void;
  prevFocusElement: HTMLElement | null;
  setPrevFocusElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  viewportRef: React.RefObject<HTMLElement | null>;
  windowFocusedRef: React.RefObject<boolean>;
  scheduleTimer: (id: string, delay: number, callback: () => void) => void;
  hasDifferingHeights: boolean;
}

export type ToastContext<Data extends object> = ToastContextValue<Data>;

export const ToastContext = React.createContext<ToastContext<any> | undefined>(undefined);

export function useToastContext() {
  const context = React.useContext(ToastContext);
  if (!context) {
    return throwMissingContextError('ToastContext', 'Toast', 'Toast.Provider');
  }
  return context;
}
