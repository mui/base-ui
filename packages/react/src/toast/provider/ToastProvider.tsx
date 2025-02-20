'use client';
import * as React from 'react';
import { Toast, ToastContext } from './ToastProviderContext';

let counter = 0;
function generateId() {
  return `toast-${Date.now()}-${counter++}`;
}

interface TimerInfo {
  timeoutId?: ReturnType<typeof setTimeout>;
  start: number;
  delay: number;
  remaining: number;
  callback: () => void;
}

const ToastProvider: React.FC<ToastProvider.Props> = function ToastProvider(props) {
  const { children, defaultTimeout = 5000 } = props;

  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const timersRef = React.useRef(new Map<string, TimerInfo>());
  const prevFocusRef = React.useRef<HTMLElement | null>(null);

  const remove = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = timersRef.current.get(id);
    if (timer && timer.timeoutId) {
      clearTimeout(timer.timeoutId);
    }
    timersRef.current.delete(id);
  }, []);

  // Helper to schedule auto-dismiss timers.
  const scheduleTimer = React.useCallback((id: string, delay: number, callback: () => void) => {
    const start = Date.now();
    const timeoutId = setTimeout(() => {
      timersRef.current.delete(id);
      callback();
    }, delay);
    timersRef.current.set(id, { timeoutId, start, delay, remaining: delay, callback });
  }, []);

  const add = React.useCallback(
    (toast: Omit<Toast, 'id'>): string => {
      const id = generateId();
      const toastToAdd = { id, ...toast };

      setToasts((prev) => [toastToAdd, ...prev]);

      // Schedule auto-dismiss if:
      // 1. Not a "loading" toast (which may change later), and
      // 2. The duration (toast-specific or default) is > 0.
      const duration = toastToAdd.duration ?? defaultTimeout;
      if (toastToAdd.type !== 'loading' && duration > 0) {
        scheduleTimer(id, duration, () => remove(id));
      }
      return id;
    },
    [defaultTimeout, remove, scheduleTimer],
  );

  const update = React.useCallback((id: string, updates: Partial<Omit<Toast, 'id'>>) => {
    setToasts((prev) => prev.map((toast) => (toast.id === id ? { ...toast, ...updates } : toast)));
  }, []);

  const promise = React.useCallback(
    <T,>(
      promise: Promise<T>,
      messages: { loading: string; success: string; error: string },
    ): Promise<T> => {
      // Create a loading toast (which does not auto-dismiss).
      const id = add({ title: messages.loading, type: 'loading' });
      return promise
        .then((result: T) => {
          update(id, { title: messages.success, type: 'success' });
          // Now schedule auto-dismiss on success.
          scheduleTimer(id, defaultTimeout, () => remove(id));
          return result;
        })
        .catch((error) => {
          update(id, { title: messages.error, type: 'error' });
          // Schedule auto-dismiss on error.
          scheduleTimer(id, defaultTimeout, () => remove(id));
          return Promise.reject(error);
        });
    },
    [add, update, remove, defaultTimeout, scheduleTimer],
  );

  const pauseTimers = React.useCallback(() => {
    timersRef.current.forEach((timer, id) => {
      if (timer.timeoutId) {
        const elapsed = Date.now() - timer.start;
        const remaining = timer.delay - elapsed;
        clearTimeout(timer.timeoutId);
        timer.remaining = remaining > 0 ? remaining : 0;
        timer.timeoutId = undefined;
      }
    });
  }, []);

  const resumeTimers = React.useCallback(() => {
    timersRef.current.forEach((timer, id) => {
      if (timer.timeoutId === undefined && timer.remaining > 0) {
        const newTimeoutId = setTimeout(() => {
          timersRef.current.delete(id);
          timer.callback();
        }, timer.remaining);
        timer.start = Date.now();
        timer.timeoutId = newTimeoutId;
      }
    });
  }, []);

  const value = React.useMemo(
    () => ({
      toasts,
      add,
      remove,
      update,
      promise,
      pauseTimers,
      resumeTimers,
      prevFocusRef,
    }),
    [toasts, add, remove, update, promise, pauseTimers, resumeTimers],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};

namespace ToastProvider {
  export interface Props {
    children?: React.ReactNode;
    /**
     * The default amount of time (in ms) before a toast is auto dismissed.
     * @default 5000
     */
    defaultTimeout?: number;
  }
}

export { ToastProvider };
