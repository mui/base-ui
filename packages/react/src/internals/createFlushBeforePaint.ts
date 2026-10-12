'use client';
import * as ReactDOM from 'react-dom';

/**
 * Batches callbacks ready in the same microtask checkpoint into a synchronous
 * flush, so the browser does not paint an intermediate frame.
 */
export function createFlushBeforePaint() {
  let pendingCallbacks: Array<() => void> | null = null;

  return function flushBeforePaint(fn: () => void) {
    if (!pendingCallbacks) {
      const callbacks: Array<() => void> = [];
      pendingCallbacks = callbacks;
      queueMicrotask(() => {
        // Work discovered during the flush starts a new batch. In particular, nested
        // portals must not keep extending React's synchronous update cascade.
        pendingCallbacks = null;
        ReactDOM.flushSync(() => {
          for (const callback of callbacks) {
            callback();
          }
        });
      });
    }
    pendingCallbacks.push(fn);
  };
}
