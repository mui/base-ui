'use client';
import * as React from 'react';
import { ownerDocument } from '@base-ui-components/utils/owner';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';
import { generateId } from '@base-ui-components/utils/generateId';
import { Timeout } from '@base-ui-components/utils/useTimeout';
import { useRefWithInit } from '@base-ui-components/utils/useRefWithInit';
import { Store, useStore } from '@base-ui-components/utils/store';
import { activeElement, contains } from '../../floating-ui-react/utils';
import { ToastContext } from './ToastProviderContext';
import { isFocusVisible } from '../utils/focusVisible';
import { resolvePromiseOptions } from '../utils/resolvePromiseOptions';
import type {
  ToastObject,
  ToastManagerAddOptions,
  ToastManagerPromiseOptions,
  ToastManagerUpdateOptions,
} from '../useToastManager';
import type { ToastManager } from '../createToastManager';
import { selectors, type State as StoreState } from '../store';

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

  const store = useRefWithInit(() => new Store<StoreState>({ toasts: [] })).current;
  const [hovering, setHovering] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [prevFocusElement, setPrevFocusElement] = React.useState<HTMLElement | null>(null);
  const isEmpty = useStore(store, selectors.isEmpty);

  if (isEmpty) {
    if (hovering) {
      setHovering(false);
    }

    if (focused) {
      setFocused(false);
    }
  }

  const expanded = hovering || focused;

  const timersRef = React.useRef(new Map<string, TimerInfo>());
  const viewportRef = React.useRef<HTMLElement | null>(null);
  const windowFocusedRef = React.useRef(true);
  const isPausedRef = React.useRef(false);

  function handleFocusManagement(toastId: string) {
    const activeEl = activeElement(ownerDocument(viewportRef.current));
    if (
      !viewportRef.current ||
      !contains(viewportRef.current, activeEl) ||
      !isFocusVisible(activeEl)
    ) {
      return;
    }

    const toasts = selectors.toasts(store.state);
    const currentIndex = selectors.toastDOMIndex(store.state, toastId);
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
  }

  const pauseTimers = useStableCallback(() => {
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

  const resumeTimers = useStableCallback(() => {
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

  const close = useStableCallback((toastId: string) => {
    const toast = selectors.toast(store.state, toastId);
    toast?.onClose?.();

    const toastsWithEnding = selectors
      .toasts(store.state)
      .map((item) =>
        item.id === toastId ? { ...item, transitionStatus: 'ending' as const, height: 0 } : item,
      );

    const activeToasts = toastsWithEnding.filter((t) => t.transitionStatus !== 'ending');

    const newToasts = toastsWithEnding.map((item) => {
      if (item.transitionStatus === 'ending') {
        return item;
      }
      const isActiveToastLimited = activeToasts.indexOf(item) >= limit;
      return { ...item, limited: isActiveToastLimited };
    });

    const timer = timersRef.current.get(toastId);
    if (timer && timer.timeout) {
      timer.timeout.clear();
      timersRef.current.delete(toastId);
    }

    handleFocusManagement(toastId);

    store.set('toasts', newToasts);

    if (selectors.isEmpty(store.state)) {
      setHovering(false);
      setFocused(false);
    }
  });

  const remove = useStableCallback((toastId: string) => {
    const toast = selectors.toast(store.state, toastId);
    toast?.onRemove?.();

    store.set(
      'toasts',
      selectors.toasts(store.state).filter((item) => item.id !== toastId),
    );
  });

  const scheduleTimer = useStableCallback((id: string, delay: number, callback: () => void) => {
    const start = Date.now();

    const shouldStartActive = windowFocusedRef.current && !hovering && !focused;

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

  const add = useStableCallback(
    <Data extends object>(toast: ToastManagerAddOptions<Data>): string => {
      const id = toast.id || generateId('toast');
      const toastToAdd: ToastObject<Data> = {
        ...toast,
        id,
        transitionStatus: 'starting',
      };

      const updatedToasts = [toastToAdd, ...selectors.toasts(store.state)];
      const activeToasts = updatedToasts.filter((t) => t.transitionStatus !== 'ending');

      // Mark oldest toasts for removal when over limit
      if (activeToasts.length > limit) {
        const excessCount = activeToasts.length - limit;
        const oldestActiveToasts = activeToasts.slice(-excessCount);

        store.set(
          'toasts',
          updatedToasts.map((t) => {
            const limited = oldestActiveToasts.some((old) => old.id === t.id);
            if (t.limited !== limited) {
              return { ...t, limited };
            }
            return t;
          }),
        );
      } else {
        store.set(
          'toasts',
          updatedToasts.map((t) => ({ ...t, limited: false })),
        );
      }

      const duration = toastToAdd.timeout ?? timeout;
      if (toastToAdd.type !== 'loading' && duration > 0) {
        scheduleTimer(id, duration, () => close(id));
      }

      if (hovering || focused || !windowFocusedRef.current) {
        pauseTimers();
      }

      return id;
    },
  );

  const update = useStableCallback(
    <Data extends object>(id: string, updates: ToastManagerUpdateOptions<Data>) => {
      const newToasts = selectors
        .toasts(store.state)
        .map((toast) => (toast.id === id ? { ...toast, ...updates } : toast));
      store.set('toasts', newToasts);
    },
  );

  const promise = useStableCallback(
    <Value, Data extends object>(
      promiseValue: Promise<Value>,
      options: ToastManagerPromiseOptions<Value, Data>,
    ): Promise<Value> => {
      // Create a loading toast (which does not auto-dismiss).
      const loadingOptions = resolvePromiseOptions(options.loading);
      const id = add({
        ...loadingOptions,
        type: 'loading',
      });

      const handledPromise = promiseValue
        .then((result: Value) => {
          const successOptions = resolvePromiseOptions(options.success, result);
          update(id, {
            ...successOptions,
            type: 'success',
          });

          const successTimeout = successOptions.timeout ?? timeout;
          if (successTimeout > 0) {
            scheduleTimer(id, successTimeout, () => close(id));
          }

          if (hovering || focused || !windowFocusedRef.current) {
            pauseTimers();
          }

          return result;
        })
        .catch((error) => {
          const errorOptions = resolvePromiseOptions(options.error, error);
          update(id, {
            ...errorOptions,
            type: 'error',
          });

          const errorTimeout = errorOptions.timeout ?? timeout;
          if (errorTimeout > 0) {
            scheduleTimer(id, errorTimeout, () => close(id));
          }

          if (hovering || focused || !windowFocusedRef.current) {
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
      store,
      hovering,
      setHovering,
      focused,
      setFocused,
      expanded,
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
      add,
      close,
      focused,
      hovering,
      expanded,
      pauseTimers,
      prevFocusElement,
      promise,
      remove,
      resumeTimers,
      scheduleTimer,
      store,
      update,
    ],
  ) as ToastContext<any>;

  return <ToastContext.Provider value={contextValue}>{children}</ToastContext.Provider>;
};

export interface ToastProviderProps {
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
  toastManager?: ToastManager;
}

export namespace ToastProvider {
  export type Props = ToastProviderProps;
}
