import { useToast } from '../useToastManager';

export function resolvePromiseOptions<T, Data extends object>(
  options:
    | string
    | useToast.UpdateOptions<Data>
    | ((result: T) => string | useToast.UpdateOptions<Data>),
  result?: T,
): useToast.UpdateOptions<Data> {
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
