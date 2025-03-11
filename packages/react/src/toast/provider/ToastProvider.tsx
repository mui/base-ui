'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { activeElement, contains } from '@floating-ui/react/utils';
import { ToastContext } from './ToastProviderContext';
import { generateId } from '../../utils/generateId';
import { resolvePromiseOptions } from '../utils/resolvePromiseOptions';
import { useEventCallback } from '../../utils/useEventCallback';
import { useToast, type ToastObject } from '../useToast';
import { useLatestRef } from '../../utils/useLatestRef';
import { ownerDocument } from '../../utils/owner';
import { isFocusVisible } from '../utils/focusVisible';
import { createToastManager } from '../createToastManager';

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

  const timersRef = React.useRef(new Map<string, TimerInfo>());
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

    const toastElements = toasts
      .filter((toast) => toast.animation !== 'ending')
      .map((toast) => toast.ref?.current);
    const currentIndex = toasts.findIndex((toast) => toast.id === toastId);
    const nextToast = toastElements[currentIndex + 1] || toastElements[currentIndex - 1];

    if (nextToast) {
      nextToast.focus();
    } else {
      prevFocusElement?.focus({ preventScroll: true });
    }
  });

  const pauseTimers = useEventCallback(() => {
    timersRef.current.forEach((timer) => {
      if (timer.timeoutId) {
        clearTimeout(timer.timeoutId);
        const elapsed = Date.now() - timer.start;
        const remaining = timer.delay - elapsed;
        timer.remaining = remaining > 0 ? remaining : 0;
      }
    });
  });

  const resumeTimers = useEventCallback(() => {
    timersRef.current.forEach((timer, id) => {
      timer.remaining = timer.remaining > 0 ? timer.remaining : timer.delay;
      timer.timeoutId = setTimeout(() => {
        timersRef.current.delete(id);
        timer.callback();
      }, timer.remaining);
      timer.start = Date.now();
    });
  });

  const close = useEventCallback((toastId: string) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === toastId ? { ...toast, animation: 'ending' as const } : toast,
      ),
    );

    const timer = timersRef.current.get(toastId);
    if (timer && timer.timeoutId) {
      clearTimeout(timer.timeoutId);
      timersRef.current.delete(toastId);
    }

    const toast = toasts.find((t) => t.id === toastId);
    toast?.onClose?.();

    handleFocusManagement(toastId);
  });

  const remove = useEventCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const toast = toasts.find((t) => t.id === id);
    toast?.onRemove?.();
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
    const id = toast.id || generateId('toast');
    const toastToAdd = {
      ...toast,
      id,
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
            ? { ...t, animation: 'ending' as const }
            : t,
        );
      }

      return updatedToasts;
    });

    const duration = toastToAdd.timeout ?? timeout;
    if (toastToAdd.type !== 'loading' && duration > 0) {
      scheduleTimer(id, duration, () => close(id));
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

  React.useEffect(() => {
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
  }, [add, update, scheduleTimer, timeout, toastManager, promise, close]);

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
    }),
    [
      toasts,
      hovering,
      focused,
      add,
      close,
      remove,
      update,
      promise,
      pauseTimers,
      resumeTimers,
      prevFocusElement,
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
    toastManager?: createToastManager.ToastManager;
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
    ' subscribe': PropTypes.func.isRequired,
    add: PropTypes.func.isRequired,
    promise: PropTypes.func.isRequired,
    remove: PropTypes.func.isRequired,
    update: PropTypes.func.isRequired,
  }),
} as any;

export { ToastProvider };
