import { useToast } from '../useToast';

export function resolvePromiseOptions<T, Data extends object>(
  options:
    | string
    | useToast.UpdateOptions<Data>
    | ((result: T) => string | useToast.UpdateOptions<Data>),
  result?: T,
): useToast.UpdateOptions<Data> {
  if (typeof options === 'string') {
    return {
      title: options,
    };
  }

  if (typeof options === 'function') {
    const resolvedOptions = options(result as T);
    return typeof resolvedOptions === 'string' ? { title: resolvedOptions } : resolvedOptions;
  }

  return options;
}
