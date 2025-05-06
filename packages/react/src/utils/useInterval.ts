'use client';
import { useLazyRef } from './useLazyRef';
import { useOnMount } from './useOnMount';
import { Timeout } from './useTimeout';

type IntervalId = ReturnType<typeof setInterval>;

const EMPTY = 0 as unknown as IntervalId;

export class Interval extends Timeout {
  static create() {
    return new Interval();
  }

  /**
   * Executes `fn` at `delay` interval, clearing any previously scheduled call.
   */
  start(delay: number, fn: Function) {
    this.clear();
    this.currentId = setInterval(() => {
      fn();
    }, delay);
  }

  clear = () => {
    if (this.currentId !== EMPTY) {
      clearInterval(this.currentId as IntervalId);
      this.currentId = EMPTY;
    }
  };
}

export function useInterval() {
  const timeout = useLazyRef(Interval.create).current;

  useOnMount(timeout.disposeEffect);

  return timeout;
}
