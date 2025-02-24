import * as React from 'react';

export interface Toast {
  id: string;
  title: string;
  type: 'loading' | 'success' | 'error' | 'message';
  description?: string;
  duration?: number;
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
  promise: <T>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string },
  ) => Promise<T>;
  pauseTimers: () => void;
  resumeTimers: () => void;
  prevFocusRef: React.RefObject<HTMLElement | null>;
  finalizeRemove: (id: string) => void;
}

export const ToastContext = React.createContext<ToastContext | undefined>(undefined);

export function useToastContext() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
