'use client';
import { EventEmitter } from '../utils/EventEmitter';
import type { Toast } from './provider/ToastProviderContext';

export type ToastOptions = Omit<Toast, 'id' | 'animation' | 'height'> & {
  id?: string;
  isUpdate?: boolean;
};

export const globalToastEmitter = new EventEmitter<ToastOptions>();

export function add(options: ToastOptions): void {
  globalToastEmitter.emit(options);
}

export function promise<T>(
  promiseValue: Promise<T>,
  options: { loading: string; success: string; error: string } & ToastOptions,
): Promise<T> {
  const toastId = globalToastEmitter.lastEventId;

  add({
    ...options,
    id: toastId,
    title: options.loading,
    type: 'loading',
  });

  return promiseValue
    .then((result: T) => {
      add({
        ...options,
        id: toastId,
        title: options.success,
        type: 'success',
        isUpdate: true,
      });
      return result;
    })
    .catch((error) => {
      add({
        ...options,
        id: toastId,
        title: options.error,
        type: 'error',
        isUpdate: true,
      });
      return Promise.reject(error);
    });
}
