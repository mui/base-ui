import { generateId } from '@base-ui/utils/generateId';
import type {
  ToastObject,
  ToastManagerAddOptions,
  ToastManagerPromiseOptions,
  ToastManagerUpdateOptions,
} from './useToastManager';

/**
 * Creates a new toast manager.
 */
export function createToastManager<Data extends object = any>(): ToastManager<Data> {
  const listeners = new Set<(data: ToastManagerEvent) => void>();
  // Events emitted while no provider is subscribed: before its subscription effect runs, or while
  // it sits in a hidden `<Activity>` (which runs effect cleanups). Replayed to the next subscriber.
  let pendingEvents: ToastManagerEvent[] = [];

  function emit(data: ToastManagerEvent) {
    if (listeners.size === 0) {
      // No provider ever subscribes on the server, so queuing there would only grow.
      if (typeof window !== 'undefined') {
        pendingEvents.push(data);
      }
      return;
    }

    listeners.forEach((listener) => listener(data));
  }

  return {
    // This should be private aside from ToastProvider needing to access it.
    // https://x.com/drosenwasser/status/1816947740032872664
    ' subscribe': function subscribe(listener: (data: ToastManagerEvent) => void) {
      listeners.add(listener);

      const events = pendingEvents;
      pendingEvents = [];
      events.forEach((event) => listener(event));

      return () => {
        listeners.delete(listener);
      };
    },

    add<T extends Data = Data>(options: ToastManagerAddOptions<T>): string {
      const id = options.id || generateId('toast');
      const toastToAdd: ToastObject<T> = {
        ...options,
        id,
        transitionStatus: 'starting',
      };

      emit({
        action: 'add',
        options: toastToAdd,
      });

      return id;
    },

    close(id?: string): void {
      emit({
        action: 'close',
        options: { id },
      });
    },

    update<T extends Data = Data>(
      id: string,
      updates:
        | ToastManagerUpdateOptions<T>
        | ((prevToast: ToastObject<T>) => ToastManagerUpdateOptions<T>),
    ): void {
      emit({
        action: 'update',
        options: { id, updates },
      });
    },

    promise<Value, T extends Data = Data>(
      promiseValue: Promise<Value>,
      options: ToastManagerPromiseOptions<Value, T>,
    ): Promise<Value> {
      let handledPromise = promiseValue;
      let returned = false;

      emit({
        action: 'promise',
        options: {
          ...options,
          promise: promiseValue,
          setPromise(promise: Promise<Value>) {
            if (returned) {
              // The event was queued, so the caller already received `promiseValue` and handles
              // its rejection. Don't let the provider's derived promise reject unhandled.
              promise.catch(() => {});
              return;
            }
            handledPromise = promise;
          },
        },
      });

      returned = true;
      return handledPromise;
    },
  };
}

export interface ToastManager<Data extends object = any> {
  ' subscribe': (listener: (data: ToastManagerEvent) => void) => () => void;
  add: <T extends Data = Data>(options: ToastManagerAddOptions<T>) => string;
  close: (id?: string) => void;
  update: <T extends Data = Data>(
    id: string,
    updates:
      ToastManagerUpdateOptions<T> | ((prevToast: ToastObject<T>) => ToastManagerUpdateOptions<T>),
  ) => void;
  promise: <Value, T extends Data = Data>(
    promiseValue: Promise<Value>,
    options: ToastManagerPromiseOptions<Value, T>,
  ) => Promise<Value>;
}

export interface ToastManagerEvent {
  action: 'add' | 'close' | 'update' | 'promise';
  options: any;
}
