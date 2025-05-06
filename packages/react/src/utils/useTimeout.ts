'use client';
import { useLazyRef } from './useLazyRef';
import { useOnMount } from './useOnMount';

type TimeoutId = ReturnType<typeof setTimeout>;

const EMPTY = 0 as unknown as TimeoutId;

export class Timeout {
  static create() {
    return new Timeout();
  }

  currentId: TimeoutId = EMPTY;

  /**
   * Executes `fn` after `delay`, clearing any previously scheduled call.
   */
  start(delay: number, fn: Function) {
    this.clear();
    this.currentId = setTimeout(() => {
      this.currentId = EMPTY;
      fn();
    }, delay);
  }

  clear = () => {
    if (this.currentId !== EMPTY) {
      clearTimeout(this.currentId as TimeoutId);
      this.currentId = EMPTY;
    }
  };

  disposeEffect = () => {
    return this.clear;
  };
}

export function useTimeout() {
  const timeout = useLazyRef(Timeout.create).current;

  useOnMount(timeout.disposeEffect);

  return timeout;
}
