'use client';
import { useRefWithInit } from './useRefWithInit';
import { useOnMount } from './useOnMount';

const supportsIdleCallback = typeof requestIdleCallback === 'function';

// Macrotask fallback for environments without `requestIdleCallback` (e.g. Safari),
// which still runs after the current commit and paint.
const requestCallback = supportsIdleCallback
  ? requestIdleCallback
  : (fn: () => void) => setTimeout(fn, 0);
const cancelCallback = supportsIdleCallback ? cancelIdleCallback : clearTimeout;

export class IdleCallback {
  static create() {
    return new IdleCallback();
  }

  currentId: number | null = null;

  /**
   * Schedules `fn` to run during idle time, after the current commit and paint, clearing any
   * previously scheduled call.
   */
  start(fn: () => void) {
    this.clear();
    this.currentId = requestCallback(() => {
      this.currentId = null;
      fn();
    });
  }

  clear = () => {
    if (this.currentId !== null) {
      cancelCallback(this.currentId);
      this.currentId = null;
    }
  };

  disposeEffect = () => {
    return this.clear;
  };
}

/**
 * A `requestIdleCallback` with automatic cleanup and guard, mirroring `useTimeout`.
 *
 * Returns an imperative scheduler that runs a callback during idle time, after the current commit
 * and paint. In environments without `requestIdleCallback` it falls back to a macrotask
 * (`setTimeout(0)`), which also runs after the current commit and paint.
 */
export function useIdleCallback() {
  const idleCallback = useRefWithInit(IdleCallback.create).current;

  useOnMount(idleCallback.disposeEffect);

  return idleCallback;
}
