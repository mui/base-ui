import * as React from 'react';

export interface Toast<Data = Record<string, unknown>> {
  /**
   * The unique identifier for the toast.
   */
  id: string;
  /**
   * The title of the toast.
   */
  title: string;
  /**
   * The type of the toast.
   */
  type?: string;
  /**
   * The description of the toast.
   */
  description?: string;
  /**
   * The amount of time (in ms) before the toast is auto dismissed.
   */
  timeout?: number;
  /**
   * The priority of the toast.
   * - `low` - The toast will be announced politely.
   * - `high` - The toast will be announced urgently.
   * @default 'low'
   */
  priority?: 'low' | 'high';
  /**
   * The animation state of the toast.
   */
  animation?: 'starting' | 'ending' | undefined;
  /**
   * The height of the toast.
   */
  height?: number;
  /**
   * Callback function to be called when the toast is removed.
   */
  onRemove?: () => void;
  /**
   * Callback function to be called when the toast is removed after any animations are complete.
   */
  onRemoveComplete?: () => void;
  /**
   * The props for the action button.
   */
  actionProps?: React.ComponentPropsWithoutRef<'button'>;
  /**
   * Custom data for the toast.
   */
  data?: Data;
}

export interface ToastContentConfig<Value> {
  title: string | ((result: Value) => string);
  description?: string | ((result: Value) => string);
}

export type ToastContent<Value> = string | ((result: Value) => string) | ToastContentConfig<Value>;

export interface GlobalToastOptions<Data = Record<string, unknown>>
  extends Omit<Toast<Data>, 'id' | 'animation' | 'height'> {
  id?: string;
  promise?: boolean;
  actionProps?: React.ComponentPropsWithRef<'button'>;
}

export interface GlobalPromiseToastOptions<Value, Data = Record<string, unknown>> {
  loading: ToastContent<void>;
  success: ToastContent<Value>;
  error: ToastContent<any>;
  timeout?: number;
  priority?: 'low' | 'high';
  onRemove?: () => void;
  onRemoveComplete?: () => void;
  actionProps?: React.ComponentPropsWithRef<'button'>;
  data?: Data;
}
