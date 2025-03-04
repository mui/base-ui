import { ToastContent } from '../types';

export function resolvePromiseContent<T>(
  content: ToastContent<T>,
  result?: T,
): { title: string; description?: string } {
  if (typeof content === 'string') {
    return {
      title: content,
    };
  }

  if (typeof content === 'function') {
    return {
      title: content(result as T),
    };
  }

  let description = content.description;
  if (typeof description === 'function') {
    description = description(result as T);
  }

  return {
    title: typeof content.title === 'function' ? content.title(result as T) : content.title,
    description,
  };
}
