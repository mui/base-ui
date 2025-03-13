'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { ToastContext } from './ToastProviderContext';
import { useToastProvider } from './useToastProvider';

/**
 * Provides a context for creating and managing toasts.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
const ToastProvider: React.FC<ToastProvider.Props> = function ToastProvider(props) {
  const { children, timeout = 5000, limit = 3, toastManager } = props;

  const contextValue = useToastProvider({
    timeout,
    limit,
    toastManager,
  });

  return <ToastContext.Provider value={contextValue}>{children}</ToastContext.Provider>;
};

namespace ToastProvider {
  export interface Props extends useToastProvider.Parameters {
    children?: React.ReactNode;
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
