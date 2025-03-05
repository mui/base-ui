import { generateId } from '../utils/generateId';
import { Toast, useToast } from './useToast';
import { resolvePromiseOptions } from './utils/resolvePromiseOptions';

/**
 * Creates a new toast manager.
 */
export class Manager {
  private listeners: ((data: any) => void)[] = [];

  public toasts: Toast<any>[] = [];

  subscribe(listener: (data: any) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  emit(data: any) {
    this.listeners.forEach((listener) => listener(data));
  }

  add<Data extends object>(options: useToast.AddOptions<Data> & { id?: string }): string {
    this.emit(options);
    return options.id || generateId('toast');
  }

  remove(id: string): void {
    this.toasts = this.toasts.filter((toast) => toast.id !== id);
  }

  update<Data extends object>(id: string, updates: useToast.UpdateOptions<Data>): void {
    const existingToast = this.toasts.find((toast) => toast.id === id);

    if (existingToast) {
      const updatedToast = {
        ...existingToast,
        ...updates,
        id,
        // Mark as a promise update for the provider to handle correctly
        promise: true,
      };

      this.emit(updatedToast);
      this.toasts = this.toasts.map((toast) =>
        toast.id === id ? ({ ...toast, ...updates, id } as Toast<any>) : toast,
      );
    }
  }

  promise<Value, Data extends object>(
    promiseValue: Promise<Value>,
    options: useToast.PromiseOptions<Value, Data>,
  ): Promise<Value> {
    const id = generateId('toast');

    const loadingOptions = resolvePromiseOptions(options.loading);
    const toastId = this.add({
      ...loadingOptions,
      id,
      title: loadingOptions.title || '',
      type: 'loading',
    });

    return promiseValue
      .then((result: Value) => {
        this.update(toastId, {
          ...resolvePromiseOptions(options.success, result),
          type: 'success',
        });
        return result;
      })
      .catch((error) => {
        this.update(toastId, {
          ...resolvePromiseOptions(options.error, error),
          type: 'error',
        });
        return Promise.reject(error);
      });
  }
}
