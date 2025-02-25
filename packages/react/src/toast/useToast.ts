import * as React from 'react';
import { ToastContext } from './provider/ToastProviderContext';

/**
 * Returns the array of toasts and methods to create toasts.
 */
export function useToast(): useToast.ReturnValue {
  const context = React.useContext(ToastContext);

  if (!context) {
    throw new Error('Base UI: useToast must be used within <Toast.Provider>.');
  }

  const { toasts, add, promise } = context;

  return React.useMemo(() => ({ toasts, add, promise }), [toasts, add, promise]);
}

export namespace useToast {
  export interface ReturnValue {
    add: ToastContext['add'];
    promise: ToastContext['promise'];
    toasts: ToastContext['toasts'];
  }
}
