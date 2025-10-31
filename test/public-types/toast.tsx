import {
  Toast,
  type UseToastManagerReturnValue,
  type UseToastManagerAddOptions,
  type UseToastManagerPromiseOptions,
  type UseToastManagerUpdateOptions,
} from '@base-ui-components/react/toast';

export type ToastProviderProps = Toast.Provider.Props;
export type ToastViewportProps = Toast.Viewport.Props;
export type ToastRootProps = Toast.Root.Props;

export type ToastManagerReturnValue = UseToastManagerReturnValue;
export type ToastManagerAdd = UseToastManagerReturnValue['add'];
export type ToastManagerUpdate = UseToastManagerReturnValue['update'];
export type ToastManagerPromise = UseToastManagerReturnValue['promise'];

export type ToastManagerAddOptions<Data extends object> = UseToastManagerAddOptions<Data>;
export type ToastManagerUpdateOptions<Data extends object> = UseToastManagerUpdateOptions<Data>;
export type ToastManagerPromiseOptions<Value, Data extends object> = UseToastManagerPromiseOptions<
  Value,
  Data
>;

export type ToastCreateManagerReturn = ReturnType<typeof Toast.createToastManager>;

export const { useToastManager, createToastManager } = Toast;
