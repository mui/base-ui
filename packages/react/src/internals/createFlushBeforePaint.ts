'use client';
import * as ReactDOM from 'react-dom';

interface PendingCallback {
  fn: () => void;
  shouldFlush?: (() => boolean) | undefined;
}

/**
 * Batches callbacks ready in the same microtask checkpoint into a synchronous
 * flush, so the browser does not paint an intermediate frame. If any callback
 * cannot flush yet, let React schedule the entire batch normally.
 */
export function createFlushBeforePaint() {
  let pendingCallbacks: Set<PendingCallback> | null = null;

  return function flushBeforePaint(fn: () => void, shouldFlush?: () => boolean) {
    if (!pendingCallbacks) {
      const callbacks = new Set<PendingCallback>();
      pendingCallbacks = callbacks;
      queueMicrotask(() => {
        // Work discovered during the flush starts a new batch. In particular, nested
        // portals must not keep extending React's synchronous update cascade.
        pendingCallbacks = null;

        if (callbacks.size === 0) {
          return;
        }

        const runCallbacks = () => {
          for (const callback of callbacks) {
            callback.fn();
          }
        };

        if (Array.from(callbacks).every((callback) => callback.shouldFlush?.() ?? true)) {
          ReactDOM.flushSync(runCallbacks);
        } else {
          runCallbacks();
        }
      });
    }

    const callbacks = pendingCallbacks;
    const callback = { fn, shouldFlush };
    callbacks.add(callback);

    return () => {
      callbacks.delete(callback);
    };
  };
}
