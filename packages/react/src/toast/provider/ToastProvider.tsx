'use client';
import * as React from 'react';
import { activeElement, contains, useLatestRef } from '@floating-ui/react/utils';
import { ToastContext } from './ToastProviderContext';
import { ToastObject, useToastManager } from '../useToastManager';
import { ownerDocument } from '../../utils/owner';
import { useEventCallback } from '../../utils/useEventCallback';
import { isFocusVisible } from '../utils/focusVisible';
import { generateId } from '../../utils/generateId';
import { resolvePromiseOptions } from '../utils/resolvePromiseOptions';
import { Timeout } from '../../utils/useTimeout';
import { createToastManager } from '../createToastManager';

interface TimerInfo {
  timeout?: Timeout;
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
export const ToastProvider: React.FC<ToastProvider.Props> = function ToastProvider(props) {
  const { children, timeout = 5000, limit = 3, toastManager } = props;

  const [toasts, setToasts] = React.useState<ToastObject<any>[]>([]);
  const [hovering, setHovering] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [prevFocusElement, setPrevFocusElement] = React.useState<HTMLElement | null>(null);

  if (toasts.length === 0) {
    if (hovering) {
      setHovering(false);
    }

    if (focused) {
      setFocused(false);
    }
  }

  // It's not possible to stack a smaller height toast onto a larger height toast, but
  // the reverse is possible. For simplicity, we'll enforce the expanded state if the
  // toasts aren't all the same height.
  const hasDifferingHeights = React.useMemo(() => {
    const heights = toasts.map((t) => t.height).filter((h) => h !== 0);
    return heights.length > 0 && new Set(heights).size > 1;
  }, [toasts]);

  const timersRef = React.useRef(new Map<string, TimerInfo>());
  const viewportRef = React.useRef<HTMLElement | null>(null);
  const windowFocusedRef = React.useRef(true);
  const isPausedRef = React.useRef(false);

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

    const currentIndex = toasts.findIndex((toast) => toast.id === toastId);
    let nextToast: ToastObject<any> | null = null;

    // Try to find the next toast that isn't animating out
    let index = currentIndex + 1;
    while (index < toasts.length) {
      if (toasts[index].transitionStatus !== 'ending') {
        nextToast = toasts[index];
        break;
      }
      index += 1;
    }

    // Go backwards if no next toast is found
    if (!nextToast) {
      index = currentIndex - 1;
      while (index >= 0) {
        if (toasts[index].transitionStatus !== 'ending') {
          nextToast = toasts[index];
          break;
        }
        index -= 1;
      }
    }

    if (nextToast) {
      nextToast.ref?.current?.focus();
    } else {
      prevFocusElement?.focus({ preventScroll: true });
    }
  });

  const pauseTimers = useEventCallback(() => {
    if (isPausedRef.current) {
      return;
    }
    isPausedRef.current = true;
    timersRef.current.forEach((timer) => {
      if (timer.timeout) {
        timer.timeout.clear();
        const elapsed = Date.now() - timer.start;
        const remaining = timer.delay - elapsed;
        timer.remaining = remaining > 0 ? remaining : 0;
      }
    });
  });

  const resumeTimers = useEventCallback(() => {
    if (!isPausedRef.current) {
      return;
    }
    isPausedRef.current = false;
    timersRef.current.forEach((timer, id) => {
      timer.remaining = timer.remaining > 0 ? timer.remaining : timer.delay;
      timer.timeout ??= Timeout.create();
      timer.timeout.start(timer.remaining, () => {
        timersRef.current.delete(id);
        timer.callback();
      });
      timer.start = Date.now();
    });
  });

  const close = useEventCallback((toastId: string) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === toastId ? { ...toast, transitionStatus: 'ending' as const, height: 0 } : toast,
      ),
    );

    const timer = timersRef.current.get(toastId);
    if (timer && timer.timeout) {
      timer.timeout.clear();
      timersRef.current.delete(toastId);
    }

    const toast = toasts.find((t) => t.id === toastId);
    toast?.onClose?.();

    handleFocusManagement(toastId);

    if (toasts.length === 1) {
      hoveringRef.current = false;
      focusedRef.current = false;
    }
  });

  const remove = useEventCallback((toastId: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
    const toast = toasts.find((t) => t.id === toastId);
    toast?.onRemove?.();
  });

  const scheduleTimer = useEventCallback((id: string, delay: number, callback: () => void) => {
    const start = Date.now();

    const shouldStartActive =
      windowFocusedRef.current && !hoveringRef.current && !focusedRef.current;

    const currentTimeout = shouldStartActive ? Timeout.create() : undefined;

    currentTimeout?.start(delay, () => {
      timersRef.current.delete(id);
      callback();
    });

    timersRef.current.set(id, {
      timeout: currentTimeout,
      start: shouldStartActive ? start : 0,
      delay,
      remaining: delay,
      callback,
    });
  });

  const add = useEventCallback(
    <Data extends object>(toast: useToastManager.AddOptions<Data>): string => {
      const id = toast.id || generateId('toast');
      const toastToAdd: ToastObject<Data> = {
        ...toast,
        id,
        transitionStatus: 'starting',
      };

      setToasts((prev) => {
        const updatedToasts = [toastToAdd, ...prev];
        const activeToasts = updatedToasts.filter((t) => t.transitionStatus !== 'ending');

        // Mark oldest toasts for removal when over limit
        if (activeToasts.length > limit) {
          const excessCount = activeToasts.length - limit;
          const oldestActiveToasts = activeToasts.slice(-excessCount);

          oldestActiveToasts.forEach((t) => {
            const timer = timersRef.current.get(t.id);
            timer?.timeout?.clear();
            timersRef.current.delete(t.id);
          });

          return updatedToasts.map((t) =>
            oldestActiveToasts.some((old) => old.id === t.id)
              ? { ...t, transitionStatus: 'ending' as const, limited: true }
              : t,
          );
        }

        return updatedToasts;
      });

      const duration = toastToAdd.timeout ?? timeout;
      if (toastToAdd.type !== 'loading' && duration > 0) {
        scheduleTimer(id, duration, () => close(id));
      }

      if (hoveringRef.current || focusedRef.current || !windowFocusedRef.current) {
        pauseTimers();
      }

      return id;
    },
  );

  const update = useEventCallback(
    <Data extends object>(id: string, updates: useToastManager.UpdateOptions<Data>) => {
      setToasts((prev) =>
        prev.map((toast) => (toast.id === id ? { ...toast, ...updates } : toast)),
      );
    },
  );

  const promise = useEventCallback(
    <Value, Data extends object>(
      promiseValue: Promise<Value>,
      options: useToastManager.PromiseOptions<Value, Data>,
    ): Promise<Value> => {
      // Create a loading toast (which does not auto-dismiss).
      const loadingOptions = resolvePromiseOptions(options.loading);
      const id = add({
        ...loadingOptions,
        type: 'loading',
      });

      const handledPromise = promiseValue
        .then((result: Value) => {
          update(id, {
            ...resolvePromiseOptions(options.success, result),
            type: 'success',
          });

          scheduleTimer(id, timeout, () => close(id));

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

          scheduleTimer(id, timeout, () => close(id));

          if (hoveringRef.current || focusedRef.current || !windowFocusedRef.current) {
            pauseTimers();
          }

          return Promise.reject(error);
        });

      // Private API used exclusively by `Manager` to handoff the promise
      // back to the manager after it's handled here.
      if ({}.hasOwnProperty.call(options, 'setPromise')) {
        (options as any).setPromise(handledPromise);
      }

      return handledPromise;
    },
  );

  React.useEffect(
    function subscribeToToastManager() {
      if (!toastManager) {
        return undefined;
      }

      const unsubscribe = toastManager[' subscribe'](({ action, options }) => {
        const id = options.id;

        if (action === 'promise' && options.promise) {
          promise(options.promise, options);
        } else if (action === 'update' && id) {
          update(id, options);
        } else if (action === 'close' && id) {
          close(id);
        } else {
          add(options);
        }
      });

      return unsubscribe;
    },
    [add, update, scheduleTimer, timeout, toastManager, promise, close],
  );

  const contextValue = React.useMemo(
    () => ({
      toasts,
      setToasts,
      hovering,
      setHovering,
      focused,
      setFocused,
      add,
      close,
      remove,
      update,
      promise,
      pauseTimers,
      resumeTimers,
      prevFocusElement,
      setPrevFocusElement,
      viewportRef,
      scheduleTimer,
      windowFocusedRef,
      hasDifferingHeights,
    }),
    [
      add,
      close,
      focused,
      hovering,
      pauseTimers,
      prevFocusElement,
      promise,
      remove,
      resumeTimers,
      scheduleTimer,
      toasts,
      update,
      hasDifferingHeights,
    ],
  ) as ToastContext<any>;

  return <ToastContext.Provider value={contextValue}>{children}</ToastContext.Provider>;
};

export namespace ToastProvider {
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
    toastManager?: createToastManager.ToastManager;
  }
}
