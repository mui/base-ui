import type { Toast } from '@base-ui/react/toast';
import type { CSSProperties, ReactNode } from 'react';

import type { IconProps } from '@/Icon';

export type ToastType = 'success' | 'info' | 'warning' | 'error' | 'loading' | 'default';

export type ToastPosition =
  | 'top'
  | 'top-left'
  | 'top-right'
  | 'bottom'
  | 'bottom-left'
  | 'bottom-right';

export type ToastActionVariant = 'primary' | 'secondary' | 'text' | 'danger' | 'ghost';

export interface ToastAction {
  /**
   * Action button label
   */
  label: ReactNode;
  /**
   * Click handler
   */
  onClick?: () => void;
  /**
   * Additional props for the button
   */
  props?: Omit<React.ComponentPropsWithRef<'button'>, 'onClick'>;
  /**
   * Button variant
   * @default 'primary'
   */
  variant?: ToastActionVariant;
}

export interface ToastOptions {
  /**
   * Action button props
   * @deprecated Use `actions` instead
   */
  actionProps?: React.ComponentPropsWithRef<'button'>;
  /**
   * Multiple action buttons
   */
  actions?: ToastAction[];
  /**
   * Additional class name
   */
  className?: string;
  /**
   * Whether the toast is closable
   * @default true
   */
  closable?: boolean;
  /**
   * Custom data for the toast
   */
  data?: Record<string, unknown>;
  /**
   * Toast description
   */
  description?: ReactNode;
  /**
   * Custom duration in milliseconds
   * @default 5000
   */
  duration?: number;
  /**
   * Hide the close button
   * @default false
   */
  hideCloseButton?: boolean;
  /**
   * Custom icon
   */
  icon?: IconProps['icon'];
  /**
   * Callback when toast is closed
   */
  onClose?: () => void;
  /**
   * Callback when toast is removed
   */
  onRemove?: () => void;
  /**
   * Toast placement, overrides global ToastHost position
   */
  placement?: ToastPosition;
  /**
   * Additional styles
   */
  style?: CSSProperties;
  /**
   * Toast title
   */
  title?: ReactNode;
  /**
   * Toast type
   * @default 'default'
   */
  type?: ToastType;
}

export interface ToastInstance {
  /**
   * Close the toast
   */
  close: () => void;
  /**
   * The toast ID
   */
  id: string;
  /**
   * Update the toast
   */
  update: (options: Partial<ToastOptions>) => void;
}

export interface ToastProps {
  classNames?: {
    action?: string;
    actions?: string;
    close?: string;
    content?: string;
    description?: string;
    icon?: string;
    root?: string;
    title?: string;
  };
  styles?: {
    action?: CSSProperties;
    actions?: CSSProperties;
    close?: CSSProperties;
    content?: CSSProperties;
    description?: CSSProperties;
    icon?: CSSProperties;
    root?: CSSProperties;
    title?: CSSProperties;
  };
  toast: Toast.Root.ToastObject<ToastOptions>;
}

export interface ToastPromiseOptions<T> {
  error: ReactNode | ((error: Error) => ReactNode) | Omit<ToastOptions, 'type'>;
  loading: ReactNode | Omit<ToastOptions, 'type'>;
  success: ReactNode | ((data: T) => ReactNode) | Omit<ToastOptions, 'type'>;
}

export interface ToastAPI {
  (options: ToastOptions): ToastInstance;
  dismiss: (id?: string) => void;
  error: (options: Omit<ToastOptions, 'type'> | string) => ToastInstance;
  info: (options: Omit<ToastOptions, 'type'> | string) => ToastInstance;
  loading: (options: Omit<ToastOptions, 'type'> | string) => ToastInstance;
  promise: <T>(promise: Promise<T>, options: ToastPromiseOptions<T>) => Promise<T>;
  success: (options: Omit<ToastOptions, 'type'> | string) => ToastInstance;
  warning: (options: Omit<ToastOptions, 'type'> | string) => ToastInstance;
}
