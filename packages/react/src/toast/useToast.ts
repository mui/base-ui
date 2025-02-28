import * as React from 'react';
import { Toast, ToastContext } from './provider/ToastProviderContext';

/**
 * Returns the array of toasts and methods to create toasts.
 */
export function useToast(): useToast.ReturnValue {
  const context = React.useContext(ToastContext);

  if (!context) {
    throw new Error('Base UI: useToast must be used within <Toast.Provider>.');
  }

  const { toasts, add, remove, update, promise } = context;

  return React.useMemo(
    () => ({
      toasts,
      add,
      remove,
      update,
      promise,
    }),
    [toasts, add, remove, update, promise],
  );
}

export namespace useToast {
  export type ToastType<Data = Record<string, unknown>> = Toast<Data>;

  export interface ReturnValue {
    toasts: ToastContext['toasts'];
    add: ToastContext['add'];
    remove: ToastContext['remove'];
    update: ToastContext['update'];
    promise: ToastContext['promise'];
  }

  export interface AddOptions extends Omit<Toast, 'id' | 'animation' | 'height'> {}
}
