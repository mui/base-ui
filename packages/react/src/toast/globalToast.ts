'use client';
import { EventEmitter } from '../utils/EventEmitter';
import type { Toast } from './provider/ToastProviderContext';
import { resolvePromiseContent, type ToastContent } from './utils/resolvePromiseContent';

export interface ToastOptions extends Omit<Toast, 'id' | 'animation' | 'height'> {
  id?: string;
  promise?: boolean;
}

export interface PromiseToastOptions<Value>
  extends Omit<ToastOptions, 'type' | 'title' | 'description'> {
  loading: ToastContent<void>;
  success: ToastContent<Value>;
  error: ToastContent<any>;
}

export const globalToastEmitter = new EventEmitter<ToastOptions>();

export function add(options: ToastOptions): void {
  globalToastEmitter.emit(options);
}

export function promise<Value>(
  promiseValue: Promise<Value>,
  options: PromiseToastOptions<Value>,
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
