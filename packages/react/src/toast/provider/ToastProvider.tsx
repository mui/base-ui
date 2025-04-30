'use client';
import * as React from 'react';
import { ToastContext } from './ToastProviderContext';
import { useToastProvider } from './useToastProvider';

/**
 * Provides a context for creating and managing toasts.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export const ToastProvider: React.FC<ToastProvider.Props> = function ToastProvider(props) {
  const { children, timeout = 5000, limit = 3, toastManager } = props;

  const contextValue = useToastProvider({
    timeout,
    limit,
    toastManager,
  });

  return <ToastContext.Provider value={contextValue}>{children}</ToastContext.Provider>;
};

export namespace ToastProvider {
  export interface Props extends useToastProvider.Parameters {
    children?: React.ReactNode;
  }
}
