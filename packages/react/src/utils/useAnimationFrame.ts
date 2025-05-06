'use client';
import { useLazyRef } from './useLazyRef';
import { useOnMount } from './useOnMount';

type AnimationFrameId = ReturnType<typeof requestAnimationFrame>;

const EMPTY = 0 as unknown as AnimationFrameId;

class Scheduler {
  /* This implementation uses an array as a backing data-structure for frame callbacks.
   * It allows `O(1)` callback cancelling by inserting a `null` in the array, though it
   * never calls the native `cancelAnimationFrame` if there are no frames left. This can
   * be much more efficient if there is a call pattern that alterns as
   * "request-cancel-request-cancel-…".
   * But in the case of "request-request-…-cancel-cancel-…", it leaves the final animation
   * frame to run anyway. We turn that frame into a `O(1)` no-op via `callbacksCount`. */

  static callbacks = [] as (FrameRequestCallback | null)[];
  static callbacksCount = 0;
  static nextId = 1;
  static startId = 1;
  static isScheduled = false;

  static onAnimationFrame(timestamp: number) {
    this.isScheduled = false;

    let currentCallbacks = this.callbacks;
    let currentCallbacksCount = this.callbacksCount;

    // Update these before iterating, callbacks could call `requestAnimationFrame` again.
    this.callbacks = [];
    this.callbacksCount = 0;
    this.startId = this.nextId;

    if (currentCallbacksCount > 0) {
      for (let i = 0; i < currentCallbacks.length; i++) {
        currentCallbacks[i]?.(timestamp);
      }
    }
  }

  static requestAnimationFrame(fn: FrameRequestCallback) {
    const id = this.nextId++;
    this.callbacks.push(fn);
    this.callbacksCount += 1;
    if (!this.isScheduled) {
      requestAnimationFrame(this.onAnimationFrame);
      this.isScheduled = true;
    }
    return id;
  }

  static cancelAnimationFrame(id: number) {
    const index = id - this.startId;
    if (index < 0 || index >= this.callbacks.length) {
      return;
    }
    this.callbacks[index] = null;
    this.callbacksCount -= 1;
  }
}

export class AnimationFrame {
  static create() {
    return new AnimationFrame();
  }

  currentId: AnimationFrameId = EMPTY;

  /**
   * Executes `fn` after `delay`, clearing any previously scheduled call.
   */
  request(fn: Function) {
    this.cancel();
    this.currentId = Scheduler.requestAnimationFrame(() => {
      this.currentId = EMPTY;
      fn();
    });
  }

  cancel = () => {
    if (this.currentId !== EMPTY) {
      Scheduler.cancelAnimationFrame(this.currentId as AnimationFrameId);
      this.currentId = EMPTY;
    }
  };

  disposeEffect = () => {
    return this.cancel;
  };
}

export function useAnimationFrame() {
  const timeout = useLazyRef(AnimationFrame.create).current;

  useOnMount(timeout.disposeEffect);

  return timeout;
}
