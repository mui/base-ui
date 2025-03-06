import { generateId } from '../utils/generateId';
import { useToast } from './useToast';

export interface ToastManagerEvent {
  action: 'add' | 'remove' | 'update' | 'promise';
  options: any;
}

/**
 * Creates a new toast manager.
 */
export function createToastManager(): createToastManager.ToastManager {
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

    add<Data extends object>(options: useToast.AddOptions<Data>): string {
      const id = options.id || generateId('toast');
      const toastToAdd = {
        ...options,
        id,
        animation: 'starting' as const,
      };

      emit({
        action: 'add',
        options: toastToAdd,
      });

      return id;
    },

    remove(id: string): void {
      emit({
        action: 'remove',
        options: { id },
      });
    },

    update<Data extends object>(id: string, updates: useToast.UpdateOptions<Data>): void {
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
      options: useToast.PromiseOptions<Value, Data>,
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

export namespace createToastManager {
  export interface ToastManager {
    ' subscribe': (listener: (data: ToastManagerEvent) => void) => () => void;
    add: <Data extends object>(options: useToast.AddOptions<Data>) => string;
    remove: (id: string) => void;
    update: <Data extends object>(id: string, updates: useToast.UpdateOptions<Data>) => void;
    promise: <Value, Data extends object>(
      promiseValue: Promise<Value>,
      options: useToast.PromiseOptions<Value, Data>,
    ) => Promise<Value>;
  }
}
