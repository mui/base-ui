'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { Toast, ToastContext } from './ToastProviderContext';
import { globalToastEmitter, PromiseToastOptions } from '../globalToast';
import { generateId } from '../../utils/generateId';
import { resolvePromiseContent } from '../utils/resolvePromiseContent';

interface TimerInfo {
  timeoutId?: ReturnType<typeof setTimeout>;
  start: number;
  delay: number;
  remaining: number;
  callback: () => void;
}

/**
 * Provides a context for creating and managing toasts.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
const ToastProvider: React.FC<ToastProvider.Props> = function ToastProvider(props) {
  const { children, timeout = 5000, limit = 3 } = props;

  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [hovering, setHovering] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  if (toasts.length === 0) {
    if (hovering) {
      setHovering(false);
    }

    if (focused) {
      setFocused(false);
    }
  }

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
      const id = generateId('toast');
      const toastToAdd = {
        id,
        ...toast,
        animation: 'starting' as const,
      };

      setToasts((prev) => {
        const updatedToasts = [toastToAdd, ...prev];
        const activeToasts = updatedToasts.filter((t) => t.animation !== 'ending');

        // Mark oldest toasts for removal when over limit
        if (activeToasts.length > limit) {
          const excessCount = activeToasts.length - limit;
          const oldestActiveToasts = activeToasts.slice(-excessCount);

          oldestActiveToasts.forEach((t) => {
            const timer = timersRef.current.get(t.id);
            if (timer && timer.timeoutId) {
              clearTimeout(timer.timeoutId);
            }
          });

          return updatedToasts.map((t) =>
            oldestActiveToasts.some((old) => old.id === t.id)
              ? { ...t, animation: 'ending' as const, height: 0 }
              : t,
          );
        }

        return updatedToasts;
      });

      const duration = toastToAdd.timeout ?? timeout;
      if (toastToAdd.type !== 'loading' && duration > 0) {
        scheduleTimer(id, duration, () => remove(id));
      }
      return id;
    },
    [limit, timeout, remove, scheduleTimer],
  );

  const update = React.useCallback((id: string, updates: Partial<Omit<Toast, 'id'>>) => {
    setToasts((prev) => prev.map((toast) => (toast.id === id ? { ...toast, ...updates } : toast)));
  }, []);

  const promise = React.useCallback(
    <Value,>(promiseValue: Promise<Value>, options: PromiseToastOptions<Value>): Promise<Value> => {
      // Create a loading toast (which does not auto-dismiss).
      const loadingContent = resolvePromiseContent(options.loading);

      const id = add({
        ...options,
        title: loadingContent.title,
        description: loadingContent.description,
        type: 'loading',
      });

      return promiseValue
        .then((result: Value) => {
          const successContent = resolvePromiseContent(options.success);
          update(id, {
            ...options,
            title: successContent.title,
            description: successContent.description,
            type: 'success',
          });
          // Now schedule auto-dismiss on success.
          scheduleTimer(id, timeout, () => remove(id));
          return result;
        })
        .catch((error) => {
          const errorContent = resolvePromiseContent(options.error);
          update(id, {
            ...options,
            title: errorContent.title,
            description: errorContent.description,
            type: 'error',
          });
          // Schedule auto-dismiss on error.
          scheduleTimer(id, timeout, () => remove(id));
          return Promise.reject(error);
        });
    },
    [add, update, remove, timeout, scheduleTimer],
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
      if (toastOptions.promise && toastOptions.id) {
        // Handle updates for promise toasts
        update(toastOptions.id, {
          title: toastOptions.title,
          type: toastOptions.type,
          description: toastOptions.description,
        });

        const id = toastOptions.id;

        // Schedule auto-dismiss for resolved/rejected promises
        if (toastOptions.type !== 'loading' && id) {
          const duration = toastOptions.timeout ?? timeout;
          scheduleTimer(id, duration, () => remove(id));
        }
      } else {
        // Regular toast creation
        add(toastOptions);
      }
    });

    return unsubscribe;
  }, [add, update, remove, scheduleTimer, timeout]);

  const contextValue = React.useMemo(
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

  return <ToastContext.Provider value={contextValue}>{children}</ToastContext.Provider>;
};

namespace ToastProvider {
  export interface Props {
    children?: React.ReactNode;
    /**
     * The default amount of time (in ms) before a toast is auto dismissed.
     * @default 5000
     */
    timeout?: number;
    /**
     * The maximum number of toasts that can be displayed at once.
     * When the limit is reached, the oldest toast will be removed to make room for the new one.
     * @default 3
     */
    limit?: number;
  }
}

ToastProvider.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * The maximum number of toasts that can be displayed at once.
   * When the limit is reached, the oldest toast will be removed to make room for the new one.
   * @default 3
   */
  limit: PropTypes.number,
  /**
   * The default amount of time (in ms) before a toast is auto dismissed.
   * @default 5000
   */
  timeout: PropTypes.number,
} as any;

export { ToastProvider };
