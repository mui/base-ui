import type { ToastManagerAddOptions } from '../useToastManager';

export function resolvePromiseOptions<T, Data extends object>(
  options:
    string | ToastManagerAddOptions<Data> | ((result: T) => string | ToastManagerAddOptions<Data>),
  result?: T,
): ToastManagerAddOptions<Data> {
  if (typeof options === 'string') {
    return {
      description: options,
    };
  }

  if (typeof options === 'function') {
    const resolvedOptions = options(result as T);
    return typeof resolvedOptions === 'string' ? { description: resolvedOptions } : resolvedOptions;
  }

  return options;
}
