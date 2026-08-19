export interface Cancelable {
  clear(): void;
}

/**
 *  Creates a throttled function that only invokes `fn` at most once per animation frame.
 *
 * @example
 * ```ts
 * const throttled = rafThrottle((value: number) => console.log(value));
 * window.addEventListener('scroll', (e) => throttled(e.target.scrollTop));
 * ```
 *
 * @param fn Callback function
 * @return The `requestAnimationFrame` throttled function
 */
export function rafThrottle<T extends (...args: any[]) => any>(fn: T): T & Cancelable {
  let lastArgs: Parameters<T>;
  let rafRef: ReturnType<typeof requestAnimationFrame> | null;

  const later = () => {
    rafRef = null;
    fn(...lastArgs);
  };

  function throttled(...args: Parameters<T>) {
    lastArgs = args;
    if (!rafRef) {
      rafRef = requestAnimationFrame(later);
    }
  }

  throttled.clear = () => {
    if (rafRef) {
      cancelAnimationFrame(rafRef);
      rafRef = null;
    }
  };

  return throttled as T & Cancelable;
}
