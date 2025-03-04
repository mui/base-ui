import { generateId } from '../utils/generateId';
import { Toast } from './provider/ToastProviderContext';
import { resolvePromiseContent, type ToastContent } from './utils/resolvePromiseContent';

export interface GlobalToastOptions<Data = Record<string, unknown>>
  extends Omit<Toast<Data>, 'id' | 'animation' | 'height'> {
  id?: string;
  promise?: boolean;
  actionProps?: React.ComponentPropsWithRef<'button'>;
}

export interface GlobalPromiseToastOptions<Value, Data = Record<string, unknown>>
  extends Omit<GlobalToastOptions<Data>, 'type' | 'title' | 'description'> {
  loading: ToastContent<void>;
  success: ToastContent<Value>;
  error: ToastContent<any>;
}

/**
 * Creates a new toast manager.
 */
export class Manager<T> {
  private listeners: ((data: T) => void)[] = [];

  public toasts: Toast<T>[] = [];

  subscribe(listener: (data: T) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  emit(data: T) {
    this.listeners.forEach((listener) => listener(data));
  }

  add<Data = Record<string, unknown>>(options: GlobalToastOptions<Data>): void {
    this.emit(options as T);

    if (options.id) {
      this.toasts = this.toasts.map((toast) =>
        toast.id === options.id ? ({ ...toast, ...options, id: options.id } as Toast<T>) : toast,
      );
    }
  }

  remove(id: string): void {
    this.toasts = this.toasts.filter((toast) => toast.id !== id);
  }

  update<Data = Record<string, unknown>>(
    id: string,
    updates: Partial<Omit<Toast<Data>, 'id'>>,
  ): void {
    const existingToast = this.toasts.find((toast) => toast.id === id);

    if (existingToast) {
      const updatedToast = {
        ...existingToast,
        ...updates,
        id,
        // Mark as a promise update for the provider to handle correctly
        promise: true,
      };

      this.emit(updatedToast as T);
      this.toasts = this.toasts.map((toast) =>
        toast.id === id ? ({ ...toast, ...updates, id } as Toast<T>) : toast,
      );
    }
  }

  promise<Value, Data = Record<string, unknown>>(
    promiseValue: Promise<Value>,
    options: GlobalPromiseToastOptions<Value, Data>,
  ): Promise<Value> {
    const id = generateId('toast');
    const loadingContent = resolvePromiseContent(options.loading);

    this.add({
      ...options,
      id,
      title: loadingContent.title,
      description: loadingContent.description,
      type: 'loading',
    });

    return promiseValue
      .then((result: Value) => {
        const successContent = resolvePromiseContent(options.success, result);
        this.update(id, {
          ...options,
          title: successContent.title,
          description: successContent.description,
          type: 'success',
        });
        return result;
      })
      .catch((error) => {
        const errorContent = resolvePromiseContent(options.error, error);
        this.update(id, {
          ...options,
          title: errorContent.title,
          description: errorContent.description,
          type: 'error',
        });
        return Promise.reject(error);
      });
  }
}
