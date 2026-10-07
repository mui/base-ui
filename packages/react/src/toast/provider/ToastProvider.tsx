'use client';
import * as React from 'react';
import { useOnMount } from '@base-ui/utils/useOnMount';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';
import { ToastAnnouncerContext, ToastContext } from './ToastProviderContext';
import type { ToastManager } from '../createToastManager';
import { ToastStore } from '../store';

/**
 * Provides a context for creating and managing toasts.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export const ToastProvider: React.FC<ToastProvider.Props> = function ToastProvider(props) {
  const { children, timeout = 5000, limit = 3, toastManager } = props;

  const store = useRefWithInit(
    () =>
      new ToastStore({
        timeout,
        limit,
        viewport: null,
        toasts: [],
        hovering: false,
        focused: false,
        isWindowFocused: true,
        prevFocusElement: null,
      }),
  ).current;

  const [polite, setPolite] = React.useState<HTMLDivElement | null>(null);
  const [assertive, setAssertive] = React.useState<HTMLDivElement | null>(null);
  const announcers = React.useMemo(() => ({ polite, assertive }), [polite, assertive]);

  useOnMount(store.disposeEffect);

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
          store.updateToast(id, options.updates);
        } else if (action === 'close') {
          store.closeToast(id);
        } else {
          store.addToast(options);
        }
      });

      return unsubscribe;
    },
    [store, toastManager],
  );

  return (
    <ToastContext.Provider value={store}>
      <ToastProviderPropsSynchronizer store={store} timeout={timeout} limit={limit} />
      <ToastAnnouncerContext.Provider value={announcers}>
        <div
          ref={setPolite}
          role="status"
          aria-live="polite"
          aria-atomic={false}
          aria-relevant="additions"
          style={visuallyHidden}
        />
        <div
          ref={setAssertive}
          role="status"
          aria-live="assertive"
          aria-atomic={false}
          aria-relevant="additions"
          style={visuallyHidden}
        />
        {children}
      </ToastAnnouncerContext.Provider>
    </ToastContext.Provider>
  );
};

function ToastProviderPropsSynchronizer(props: {
  store: ToastStore;
  timeout: number;
  limit: number;
}) {
  const { store, timeout, limit } = props;

  // `limit` needs custom syncing because changing it must also recompute each
  // toast's `limited` flag; `useSyncedValues` would only update the raw value.
  useIsoLayoutEffect(() => {
    store.syncProviderProps(timeout, limit);
  }, [store, timeout, limit]);

  return null;
}

export interface ToastProviderState {}

export interface ToastProviderProps {
  children?: React.ReactNode;
  /**
   * The default amount of time (in ms) before a toast is auto dismissed.
   * A value of `0` will prevent the toast from being dismissed automatically.
   * @default 5000
   */
  timeout?: number | undefined;
  /**
   * The maximum number of toasts that can be displayed at once.
   * When the limit is exceeded, the oldest toasts are marked as `limited` (via the `data-limited`
   * attribute) rather than removed, so they can be hidden or animated out.
   * @default 3
   */
  limit?: number | undefined;
  /**
   * A global manager for toasts to use outside of a React component.
   */
  toastManager?: ToastManager | undefined;
}

export namespace ToastProvider {
  export type State = ToastProviderState;
  export type Props = ToastProviderProps;
}
