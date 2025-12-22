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
export function createToastManager(): ToastManager {
  const listeners: ((data: ToastManagerEvent) => void)[] = [];

  function emit(data: ToastManagerEvent) {
    listeners.forEach((listener) => listener(data));
  }

  return {
    // This should be private aside from ToastProvider needing to access it.
    // https://x.com/drosenwasser/status/1816947740032872664
    ' subscribe': function subscribe(listener: (data: ToastManagerEvent) => void) {
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      };
    },

    add<Data extends object>(options: ToastManagerAddOptions<Data>): string {
      const id = options.id || generateId('toast');
      const toastToAdd: ToastObject<Data> = {
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

    close(id: string): void {
      emit({
        action: 'close',
        options: { id },
      });
    },

    update<Data extends object>(id: string, updates: ToastManagerUpdateOptions<Data>): void {
      emit({
        action: 'update',
        options: {
          ...updates,
          id,
        },
      });
    },

    promise<Value, Data extends object>(
      promiseValue: Promise<Value>,
      options: ToastManagerPromiseOptions<Value, Data>,
    ): Promise<Value> {
      let handledPromise = promiseValue;

      emit({
        action: 'promise',
        options: {
          ...options,
          promise: promiseValue,
          setPromise(promise: Promise<Value>) {
            handledPromise = promise;
          },
        },
      });

      return handledPromise;
    },
  };
}

export interface ToastManager {
  ' subscribe': (listener: (data: ToastManagerEvent) => void) => () => void;
  add: <Data extends object>(options: ToastManagerAddOptions<Data>) => string;
  close: (id: string) => void;
  update: <Data extends object>(id: string, updates: ToastManagerUpdateOptions<Data>) => void;
  promise: <Value, Data extends object>(
    promiseValue: Promise<Value>,
    options: ToastManagerPromiseOptions<Value, Data>,
  ) => Promise<Value>;
}

export interface ToastManagerEvent {
  action: 'add' | 'close' | 'update' | 'promise';
  options: any;
}
