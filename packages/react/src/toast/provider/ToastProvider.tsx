'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { activeElement, contains } from '@floating-ui/react/utils';
import { ToastContext } from './ToastProviderContext';
import { generateId } from '../../utils/generateId';
import { resolvePromiseOptions } from '../utils/resolvePromiseOptions';
import { useEventCallback } from '../../utils/useEventCallback';
import { useToast, type Toast } from '../useToast';
import { useLatestRef } from '../../utils/useLatestRef';
import { ownerDocument } from '../../utils/owner';
import { isFocusVisible } from '../utils/focusVisible';
import { Manager } from '../Manager';

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
  const { children, timeout = 5000, limit = 3, toastManager } = props;

  const [toasts, setToasts] = React.useState<Toast<any>[]>([]);
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
  const viewportRef = React.useRef<HTMLElement | null>(null);
  const windowFocusedRef = React.useRef(true);

  const hoveringRef = useLatestRef(hovering);
  const focusedRef = useLatestRef(focused);

  const handleFocusManagement = useEventCallback((toastId: string) => {
    const activeEl = activeElement(ownerDocument(viewportRef.current));
    if (
      !viewportRef.current ||
      !contains(viewportRef.current, activeEl) ||
      !isFocusVisible(activeEl)
    ) {
      return;
    }

    const toastElements = Array.from<HTMLElement>(
      viewportRef.current.querySelectorAll('[data-base-ui-toast]'),
    );
    const currentIndex = toastElements.findIndex(
      (toast) => toast.getAttribute('data-base-ui-toast') === toastId,
    );

    const nextToast = toastElements[currentIndex + 1] || toastElements[currentIndex - 1];

    if (nextToast) {
      nextToast.focus();
    } else {
      prevFocusRef.current?.focus({ preventScroll: true });
    }
  });

  const pauseTimers = useEventCallback(() => {
    timersRef.current.forEach((timer) => {
      if (timer.timeoutId) {
        const elapsed = Date.now() - timer.start;
        const remaining = timer.delay - elapsed;
        clearTimeout(timer.timeoutId);
        timer.remaining = remaining > 0 ? remaining : 0;
        timer.timeoutId = undefined;
      }
    });
  });

  const resumeTimers = useEventCallback(() => {
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
  });

  const remove = useEventCallback((toastId: string) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === toastId ? { ...toast, animation: 'ending' as const, height: 0 } : toast,
      ),
    );

    // Don't immediately clear the timeout - wait for animation to complete
    const timer = timersRef.current.get(toastId);
    if (timer && timer.timeoutId) {
      clearTimeout(timer.timeoutId);
    }

    const toast = toasts.find((t) => t.id === toastId);
    toast?.onRemove?.();

    handleFocusManagement(toastId);
  });

  const finalizeRemove = useEventCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    timersRef.current.delete(id);
    const toast = toasts.find((t) => t.id === id);
    toast?.onRemoveComplete?.();
  });

  const scheduleTimer = useEventCallback((id: string, delay: number, callback: () => void) => {
    const start = Date.now();

    // Only set up an active timer if the window is focused and not hovering/focused on toasts
    const shouldStartActive =
      windowFocusedRef.current && !hoveringRef.current && !focusedRef.current;

    const timeoutId = shouldStartActive
      ? setTimeout(() => {
          timersRef.current.delete(id);
          callback();
        }, delay)
      : undefined;

    timersRef.current.set(id, {
      timeoutId,
      start: shouldStartActive ? start : 0,
      delay,
      remaining: delay,
      callback,
    });
  });

  const add = useEventCallback(<Data extends object>(toast: useToast.AddOptions<Data>): string => {
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

    // Wait for focus to potentially leave the viewport due to
    // a removal occurring at the same time
    setTimeout(() => {
      if (hoveringRef.current || focusedRef.current || !windowFocusedRef.current) {
        pauseTimers();
      }
    });

    return id;
  });

  const update = useEventCallback(
    <Data extends object>(id: string, updates: useToast.UpdateOptions<Data>) => {
      setToasts((prev) =>
        prev.map((toast) => (toast.id === id ? { ...toast, ...updates } : toast)),
      );
    },
  );

  const promise = useEventCallback(
    <Value, Data extends object>(
      promiseValue: Promise<Value>,
      options: useToast.PromiseOptions<Value, Data>,
    ): Promise<Value> => {
      // Create a loading toast (which does not auto-dismiss).
      const loadingOptions = resolvePromiseOptions(options.loading);
      const id = add({
        ...loadingOptions,
        title: loadingOptions.title || '',
        type: 'loading',
      });

      return promiseValue
        .then((result: Value) => {
          update(id, {
            ...resolvePromiseOptions(options.success, result),
            type: 'success',
          });

          scheduleTimer(id, timeout, () => remove(id));

          if (hoveringRef.current || focusedRef.current || !windowFocusedRef.current) {
            pauseTimers();
          }

          return result;
        })
        .catch((error) => {
          update(id, {
            ...resolvePromiseOptions(options.error, error),
            type: 'error',
          });

          scheduleTimer(id, timeout, () => remove(id));

          if (hoveringRef.current || focusedRef.current || !windowFocusedRef.current) {
            pauseTimers();
          }

          return Promise.reject(error);
        });
    },
  );

  React.useEffect(() => {
    if (!toastManager) {
      return undefined;
    }

    const unsubscribe = toastManager.subscribe((toastOptions) => {
      const id = toastOptions.id;

      if (toastOptions.promise && id) {
        update(id, toastOptions);

        // Schedule auto-dismiss for resolved/rejected promises
        if (toastOptions.type !== 'loading' && id) {
          const duration = toastOptions.timeout ?? timeout;
          scheduleTimer(id, duration, () => remove(id));
        }
      } else {
        add(toastOptions);
      }
    });

    return unsubscribe;
  }, [add, update, remove, scheduleTimer, timeout, toastManager]);

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
      viewportRef,
      scheduleTimer,
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
      scheduleTimer,
    ],
  ) as ToastContext<any>;

  return <ToastContext.Provider value={contextValue}>{children}</ToastContext.Provider>;
};

namespace ToastProvider {
  export interface Props {
    children?: React.ReactNode;
    /**
     * The default amount of time (in ms) before a toast is auto dismissed.
     * A value of `0` will prevent the toast from being dismissed automatically.
     * @default 5000
     */
    timeout?: number;
    /**
     * The maximum number of toasts that can be displayed at once.
     * When the limit is reached, the oldest toast will be removed to make room for the new one.
     * @default 3
     */
    limit?: number;
    /**
     * A global manager for toasts to use outside of a React component.
     */
    toastManager?: Manager;
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
   * A value of `0` will prevent the toast from being dismissed automatically.
   * @default 5000
   */
  timeout: PropTypes.number,
  /**
   * A global manager for toasts to use outside of a React component.
   */
  toastManager: PropTypes.shape({
    add: PropTypes.func.isRequired,
    emit: PropTypes.func.isRequired,
    listeners: PropTypes.arrayOf(PropTypes.func).isRequired,
    promise: PropTypes.func.isRequired,
    remove: PropTypes.func.isRequired,
    subscribe: PropTypes.func.isRequired,
    toasts: PropTypes.arrayOf(
      PropTypes.shape({
        actionProps: PropTypes.object,
        animation: PropTypes.oneOf(['ending', 'starting']),
        data: PropTypes.any,
        description: PropTypes.string,
        height: PropTypes.number,
        id: PropTypes.string.isRequired,
        onRemove: PropTypes.func,
        onRemoveComplete: PropTypes.func,
        priority: PropTypes.oneOf(['high', 'low']),
        timeout: PropTypes.number,
        title: PropTypes.string.isRequired,
        type: PropTypes.string,
      }),
    ).isRequired,
    update: PropTypes.func.isRequired,
  }),
} as any;

export { ToastProvider };
