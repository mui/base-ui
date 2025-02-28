'use client';
import { EventEmitter } from '../utils/EventEmitter';
import type { Toast } from './provider/ToastProviderContext';
import { resolvePromiseContent, type ToastContent } from './utils/resolvePromiseContent';

export interface ToastOptions<Data = Record<string, unknown>>
  extends Omit<Toast<Data>, 'id' | 'animation' | 'height'> {
  id?: string;
  promise?: boolean;
  actionProps?: React.ComponentPropsWithoutRef<'button'>;
}

export interface PromiseToastOptions<Value, Data = Record<string, unknown>>
  extends Omit<ToastOptions<Data>, 'type' | 'title' | 'description'> {
  loading: ToastContent<void>;
  success: ToastContent<Value>;
  error: ToastContent<any>;
}

export const globalToastEmitter = new EventEmitter<ToastOptions<any>>();

export function add<Data = Record<string, unknown>>(options: ToastOptions<Data>): void {
  globalToastEmitter.emit(options);
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
