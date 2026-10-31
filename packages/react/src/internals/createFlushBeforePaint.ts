'use client';
import * as ReactDOM from 'react-dom';

/**
 * Creates a queue that runs callbacks in a synchronous flush before the browser paints, so that
 * the browser doesn't paint an intermediate frame: https://github.com/mui/base-ui/issues/979
 * Callbacks that become ready within the same microtask checkpoint are batched into a single
 * commit: https://github.com/mui/base-ui/issues/5481
 * A callback runs before the React updates of earlier callbacks in its batch commit, so callers
 * that read DOM or state another caller can change need their own queue.
 */
export function createFlushBeforePaint() {
  let pendingCallbacks: Array<() => void> | null = null;

  return function flushBeforePaint(fn: () => void) {
    if (!pendingCallbacks) {
      const callbacks: Array<() => void> = [];
      pendingCallbacks = callbacks;
      queueMicrotask(() => {
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
