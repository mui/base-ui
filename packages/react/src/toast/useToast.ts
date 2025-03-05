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
  export type ToastType<Data extends object> = Toast<Data>;

  export interface ReturnValue {
    toasts: ToastContext<any>['toasts'];
    add: <Data extends object>(options: AddOptions<Data>) => string;
    remove: (toastId: string) => void;
    update: <Data extends object>(toastId: string, options: UpdateOptions<Data>) => void;
    promise: <Value, Data extends object>(
      promise: Promise<Value>,
      options: PromiseOptions<Value, Data>,
    ) => Promise<Value>;
  }

  export interface AddOptions<Data extends object>
    extends Omit<Toast<Data>, 'id' | 'animation' | 'height'> {}

  export interface UpdateOptions<Data extends object> extends Partial<AddOptions<Data>> {}

  export interface PromiseOptions<Value, Data extends object> {
    loading: string | UpdateOptions<Data>;
    success: string | UpdateOptions<Data> | ((result: Value) => string | UpdateOptions<Data>);
    error: string | UpdateOptions<Data> | ((error: any) => string | UpdateOptions<Data>);
  }
}

export interface Toast<Data extends object> {
  /**
   * The unique identifier for the toast.
   */
  id: string;
  /**
   * The title of the toast.
   */
  title: string;
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

export interface ToastContextValue<Data extends object> {
  toasts: Toast<Data>[];
  setToasts: React.Dispatch<React.SetStateAction<Toast<Data>[]>>;
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
  remove: (id: string) => void;
  pauseTimers: () => void;
  resumeTimers: () => void;
  finalizeRemove: (id: string) => void;
  prevFocusRef: React.RefObject<HTMLElement | null>;
  viewportRef: React.RefObject<HTMLElement | null>;
  scheduleTimer: (id: string, delay: number, callback: () => void) => void;
}
