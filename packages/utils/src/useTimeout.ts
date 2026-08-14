'use client';
import { useRefWithInit } from './useRefWithInit';
import { useOnMount } from './useOnMount';

type TimeoutId = number;
type TimeoutCallback = (...args: never[]) => unknown;

const EMPTY = 0 as TimeoutId;

export class Timeout {
  static create(ownerWindow?: Window) {
    return new Timeout(ownerWindow);
  }

  constructor(private readonly ownerWindow?: Window) {}

  currentId: TimeoutId = EMPTY;

  /**
   * Executes `fn` after `delay`, clearing any previously scheduled call.
   */
  start(delay: number, fn: TimeoutCallback) {
    this.clear();
    const schedule = this.ownerWindow?.setTimeout.bind(this.ownerWindow) ?? setTimeout;
    this.currentId = schedule(() => {
      this.currentId = EMPTY;
      fn();
    }, delay) as unknown as number; /* Node.js types are enabled in development */
  }

  isStarted() {
    return this.currentId !== EMPTY;
  }

  clear = () => {
    if (this.currentId !== EMPTY) {
      const id = this.currentId;
      this.currentId = EMPTY;
      const clear = this.ownerWindow?.clearTimeout.bind(this.ownerWindow) ?? clearTimeout;
      clear(id);
    }
  };

  disposeEffect = () => {
    return this.clear;
  };
}

/**
 * A `setTimeout` with automatic cleanup and guard.
 */
export function useTimeout() {
  const timeout = useRefWithInit(Timeout.create).current;

  useOnMount(timeout.disposeEffect);

  return timeout;
}
