import type { UseToastManagerUpdateOptions } from '../useToastManager';

export function resolvePromiseOptions<T, Data extends object>(
  options:
    | string
    | UseToastManagerUpdateOptions<Data>
    | ((result: T) => string | UseToastManagerUpdateOptions<Data>),
  result?: T,
): UseToastManagerUpdateOptions<Data> {
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
