import { Toast } from '@base-ui-components/react/toast';

export type ToastProviderProps = Toast.Provider.Props;
export type ToastViewportProps = Toast.Viewport.Props;
export type ToastRootProps = Toast.Root.Props;

export type ToastManagerReturn = ReturnType<typeof Toast.useToastManager>;
export type ToastManagerAdd = ToastManagerReturn['add'];
export type ToastManagerUpdate = ToastManagerReturn['update'];
export type ToastManagerPromise = ToastManagerReturn['promise'];

export type ToastManagerAddOptions<Data extends object> = Toast.useToastManager.AddOptions<Data>;
export type ToastManagerUpdateOptions<Data extends object> = Toast.useToastManager.UpdateOptions<Data>;
export type ToastManagerPromiseOptions<Value, Data extends object> =
  Toast.useToastManager.PromiseOptions<Value, Data>;

export type ToastCreateManagerReturn = ReturnType<typeof Toast.createToastManager>;
