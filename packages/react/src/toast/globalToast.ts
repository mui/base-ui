'use client';
import { EventEmitter } from '../utils/EventEmitter';
import type { Toast } from './provider/ToastProviderContext';
import { resolvePromiseContent, type ToastContent } from './utils/resolvePromiseContent';

export interface ToastOptions<Data = Record<string, unknown>>
  extends Omit<Toast<Data>, 'id' | 'animation' | 'height'> {
  id?: string;
  promise?: boolean;
  actionProps?: React.ComponentPropsWithRef<'button'>;
}

export interface PromiseToastOptions<Value, Data = Record<string, unknown>>
  extends Omit<ToastOptions<Data>, 'type' | 'title' | 'description'> {
  loading: ToastContent<void>;
  success: ToastContent<Value>;
  error: ToastContent<Value>;
}

export const globalToastEmitter = new EventEmitter<ToastOptions<any>>();

const activeToasts: Map<string, Toast<any>> = new Map();

export function toasts(): Toast<any>[] {
  return Array.from(activeToasts.values());
}

export function add<Data = Record<string, unknown>>(options: ToastOptions<Data>): void {
  globalToastEmitter.emit(options);

  if (options.id) {
    activeToasts.set(options.id, { ...options, id: options.id } as Toast<Data>);
  }
}

export function remove(id: string): void {
  activeToasts.delete(id);
}

export function update<Data = Record<string, unknown>>(
  id: string,
  updates: Partial<Omit<Toast<Data>, 'id'>>,
): void {
  const existingToast = activeToasts.get(id);

  if (existingToast) {
    const updatedToast: ToastOptions<Data> = {
      ...existingToast,
      ...updates,
      id,
      // Mark as a promise update for the provider to handle correctly
      promise: true,
    };

    globalToastEmitter.emit(updatedToast);
    activeToasts.set(id, { ...existingToast, ...updates, id } as Toast<Data>);
  }
}

export function promise<Value, Data = Record<string, unknown>>(
  promiseValue: Promise<Value>,
  options: PromiseToastOptions<Value, Data>,
): Promise<Value> {
  const toastId = globalToastEmitter.lastEventId;

  const loadingContent = resolvePromiseContent(options.loading);
  add({
    ...options,
    id: toastId,
    title: loadingContent.title,
    description: loadingContent.description,
    type: 'loading',
  });

  return promiseValue
    .then((result: Value) => {
      const successContent = resolvePromiseContent(options.success, result);
      add({
        ...options,
        id: toastId,
        title: successContent.title,
        description: successContent.description,
        type: 'success',
        promise: true,
      });
      return result;
    })
    .catch((error) => {
      const errorContent = resolvePromiseContent(options.error, error);
      add({
        ...options,
        id: toastId,
        title: errorContent.title,
        description: errorContent.description,
        type: 'error',
        promise: true,
      });
      return Promise.reject(error);
    });
}
