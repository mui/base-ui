'use client';
import * as React from 'react';
import { ToastContext } from './provider/ToastProviderContext';
import type {
  ToastManagerAddOptions,
  ToastManagerUpdateOptions,
  ToastManagerPromiseOptions,
} from './useToastManager';

/**
 * Returns methods to manage toasts without subscribing to toast state changes.
 *
 * Use this hook in components that only need to fire toasts (e.g. buttons)
 * but don't need to read or display the `toasts` array.
 * Unlike `useToastManager`, this hook will not cause the component to
 * re-render when toasts are added, updated, or removed.
 */
export function useToastActions<Data extends object = any>(): UseToastActionsReturnValue<Data> {
  const store = React.useContext(ToastContext);

  if (!store) {
    throw new Error('Base UI: useToastActions must be used within <Toast.Provider>.');
  }

  return React.useMemo(
    () => ({
      add: store.addToast as UseToastActionsReturnValue<Data>['add'],
      close: store.closeToast,
      update: store.updateToast as UseToastActionsReturnValue<Data>['update'],
      promise: store.promiseToast as UseToastActionsReturnValue<Data>['promise'],
    }),
    [store],
  );
}

export interface UseToastActionsReturnValue<Data extends object = any> {
  add: <T extends Data = Data>(options: ToastManagerAddOptions<T>) => string;
  close: (toastId: string) => void;
  update: <T extends Data = Data>(toastId: string, options: ToastManagerUpdateOptions<T>) => void;
  promise: <Value, T extends Data = Data>(
    promise: Promise<Value>,
    options: ToastManagerPromiseOptions<Value, T>,
  ) => Promise<Value>;
}
