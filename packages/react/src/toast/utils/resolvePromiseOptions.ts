import { useToastManager } from '../useToastManager';

export function resolvePromiseOptions<T, Data extends object>(
  options:
    | string
    | useToastManager.UpdateOptions<Data>
    | ((result: T) => string | useToastManager.UpdateOptions<Data>),
  result?: T,
): useToastManager.UpdateOptions<Data> {
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
