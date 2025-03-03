import * as React from 'react';
import { PromiseToastOptions } from '../globalToast';

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

export interface ToastContext<Data = Record<string, unknown>> {
  toasts: Toast<Data>[];
  setToasts: React.Dispatch<React.SetStateAction<Toast<Data>[]>>;
  hovering: boolean;
  setHovering: React.Dispatch<React.SetStateAction<boolean>>;
  focused: boolean;
  setFocused: React.Dispatch<React.SetStateAction<boolean>>;
  add: <ToastData extends Data>(toast: Omit<Toast<ToastData>, 'id'>) => string;
  remove: (id: string) => void;
  update: <ToastData extends Data>(
    id: string,
    updates: Partial<Omit<Toast<ToastData>, 'id'>>,
  ) => void;
  promise: <Value, ToastData extends Data>(
    promise: Promise<Value>,
    options: PromiseToastOptions<Value, ToastData>,
  ) => Promise<Value>;
  pauseTimers: () => void;
  resumeTimers: () => void;
  finalizeRemove: (id: string) => void;
  prevFocusRef: React.RefObject<HTMLElement | null>;
  viewportRef: React.RefObject<HTMLElement | null>;
  scheduleTimer: (id: string, delay: number, callback: () => void) => void;
}

export const ToastContext = React.createContext<ToastContext | undefined>(undefined);

export function useToastContext() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('Base UI: useToast must be used within <Toast.Provider>.');
  }
  return context;
}
