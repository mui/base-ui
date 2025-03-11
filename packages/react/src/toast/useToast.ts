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

  const { toasts, add, close, update, promise } = context;

  return React.useMemo(
    () => ({
      toasts,
      add,
      close,
      update,
      promise,
    }),
    [toasts, add, close, update, promise],
  );
}

export namespace useToast {
  export interface ReturnValue {
    toasts: ToastContext<any>['toasts'];
    add: <Data extends object>(options: AddOptions<Data>) => string;
    close: (toastId: string) => void;
    update: <Data extends object>(toastId: string, options: UpdateOptions<Data>) => void;
    promise: <Value, Data extends object>(
      promise: Promise<Value>,
      options: PromiseOptions<Value, Data>,
    ) => Promise<Value>;
  }

  export interface AddOptions<Data extends object>
    extends Omit<ToastObject<Data>, 'id' | 'animation' | 'height' | 'ref'> {
    id?: string;
  }

  export interface UpdateOptions<Data extends object> extends Partial<AddOptions<Data>> {}

  export interface PromiseOptions<Value, Data extends object> {
    loading: string | UpdateOptions<Data>;
    success: string | UpdateOptions<Data> | ((result: Value) => string | UpdateOptions<Data>);
    error: string | UpdateOptions<Data> | ((error: any) => string | UpdateOptions<Data>);
  }
}

export interface ToastObject<Data extends object> {
  /**
   * The unique identifier for the toast.
   */
  id: string;
  /**
   * The ref for the toast.
   */
  ref?: React.RefObject<HTMLElement | null>;
  /**
   * The title of the toast.
   */
  title?: string;
  /**
   * The type of the toast. Used to conditionally style the toast,
   * including conditionally rendering elements based on the type.
   */
  type?: string;
  /**
   * The description of the toast.
   */
  description?: string;
  /**
   * The amount of time (in ms) before the toast is auto dismissed.
   * A value of `0` will prevent the toast from being dismissed automatically.
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
   * The transition status of the toast.
   */
  transitionStatus?: 'starting' | 'ending' | undefined;
  /**
   * Determines if the toast was closed due to the limit being reached.
   */
  limited?: boolean;
  /**
   * The height of the toast.
   */
  height?: number;
  /**
   * Callback function to be called when the toast is closes.
   */
  onClose?: () => void;
  /**
   * Callback function to be called when the toast is removed from the list after any animations are complete when closed.
   */
  onRemove?: () => void;
  /**
   * The props for the action button.
   */
  actionProps?: React.ComponentPropsWithoutRef<'button'>;
  /**
   * Custom data for the toast.
   */
  data?: Data;
}

export interface ToastContextValue<Data extends object> {
  toasts: ToastObject<Data>[];
  setToasts: React.Dispatch<React.SetStateAction<ToastObject<Data>[]>>;
  hovering: boolean;
  setHovering: React.Dispatch<React.SetStateAction<boolean>>;
  focused: boolean;
  setFocused: React.Dispatch<React.SetStateAction<boolean>>;
  add: (options: useToast.AddOptions<Data>) => string;
  update: (id: string, options: useToast.UpdateOptions<Data>) => void;
  promise: <Value>(
    value: Promise<Value>,
    options: useToast.PromiseOptions<Value, Data>,
  ) => Promise<Value>;
  close: (id: string) => void;
  pauseTimers: () => void;
  resumeTimers: () => void;
  remove: (id: string) => void;
  prevFocusElement: HTMLElement | null;
  setPrevFocusElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  viewportRef: React.RefObject<HTMLElement | null>;
  windowFocusedRef: React.RefObject<boolean>;
  scheduleTimer: (id: string, delay: number, callback: () => void) => void;
}
