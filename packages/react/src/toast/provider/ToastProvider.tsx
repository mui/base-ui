'use client';
import * as React from 'react';
import { Toast, ToastContext } from './ToastProviderContext';
import { globalToastEmitter } from '../globalToast';

let counter = 0;
function generateId() {
  counter += 1;
  return `toast-${Math.random().toString(36).slice(2, 6)}-${counter}`;
}

interface TimerInfo {
  timeoutId?: ReturnType<typeof setTimeout>;
  start: number;
  delay: number;
  remaining: number;
  callback: () => void;
}
/**
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
const ToastProvider: React.FC<ToastProvider.Props> = function ToastProvider(props) {
  const { children, defaultTimeout = 5000 } = props;

  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [hovering, setHovering] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  const timersRef = React.useRef(new Map<string, TimerInfo>());
  const prevFocusRef = React.useRef<HTMLElement | null>(null);

  const remove = React.useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, animation: 'ending' as const, height: 0 } : toast,
      ),
    );

    // Don't immediately clear the timeout - wait for animation to complete
    const timer = timersRef.current.get(id);
    if (timer && timer.timeoutId) {
      clearTimeout(timer.timeoutId);
    }
  }, []);

  const finalizeRemove = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
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
    (toast: Omit<Toast, 'id' | 'animation'>): string => {
      const id = generateId();
      const toastToAdd = {
        id,
        ...toast,
        animation: 'starting' as const,
      };

      setToasts((prev) => [toastToAdd, ...prev]);

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
      promiseValue: Promise<T>,
      messages: { loading: string; success: string; error: string },
    ): Promise<T> => {
      // Create a loading toast (which does not auto-dismiss).
      const id = add({ title: messages.loading, type: 'loading' });
      return promiseValue
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
    timersRef.current.forEach((timer) => {
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

  React.useEffect(() => {
    const unsubscribe = globalToastEmitter.subscribe((toastOptions) => {
      if (toastOptions.isUpdate && toastOptions.id) {
        // Handle updates for promise toasts
        update(toastOptions.id, {
          title: toastOptions.title,
          type: toastOptions.type,
          description: toastOptions.description,
        });

        const id = toastOptions.id;

        // Schedule auto-dismiss for resolved/rejected promises
        if (toastOptions.type !== 'loading' && id) {
          const duration = toastOptions.duration ?? defaultTimeout;
          scheduleTimer(id, duration, () => remove(id));
        }
      } else {
        // Regular toast creation
        add(toastOptions);
      }
    });

    return unsubscribe;
  }, [add, update, remove, scheduleTimer, defaultTimeout]);

  const value = React.useMemo(
    () => ({
      toasts,
      setToasts,
      hovering,
      setHovering,
      focused,
      setFocused,
      add,
      remove,
      finalizeRemove,
      update,
      promise,
      pauseTimers,
      resumeTimers,
      prevFocusRef,
    }),
    [
      toasts,
      hovering,
      focused,
      add,
      remove,
      finalizeRemove,
      update,
      promise,
      pauseTimers,
      resumeTimers,
    ],
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
