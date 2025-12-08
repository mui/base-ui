'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui-components/utils/useRefWithInit';
import { ToastContext } from './ToastProviderContext';
import type { ToastManager } from '../createToastManager';
import { ToastStore } from '../store';

/**
 * Provides a context for creating and managing toasts.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export const ToastProvider: React.FC<ToastProvider.Props> = function ToastProvider(props) {
  const { children, timeout = 5000, limit = 3, toastManager } = props;

  const viewportRef = React.useRef<HTMLElement | null>(null);
  const store = useRefWithInit(
    () =>
      new ToastStore({
        timeout,
        limit,
        viewportRef,
        toasts: [],
        hovering: false,
        focused: false,
        isWindowFocused: true,
        prevFocusElement: null,
      }),
  ).current;

  React.useEffect(
    function subscribeToToastManager() {
      if (!toastManager) {
        return undefined;
      }

      const unsubscribe = toastManager[' subscribe'](({ action, options }) => {
        const id = options.id;

        if (action === 'promise' && options.promise) {
          store.promiseToast(options.promise, options);
        } else if (action === 'update' && id) {
          store.updateToast(id, options);
        } else if (action === 'close' && id) {
          store.closeToast(id);
        } else {
          store.addToast(options);
        }
      });

      return unsubscribe;
    },
    [store, timeout, toastManager],
  );

  useIsoLayoutEffect(() => {
    store.update({ timeout, limit });
  }, [store, timeout, limit]);

  const contextValue = React.useMemo(() => ({ store, viewportRef }), [store]);

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
