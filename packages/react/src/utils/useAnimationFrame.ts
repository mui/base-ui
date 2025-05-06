'use client';
import { useLazyRef } from './useLazyRef';
import { useOnMount } from './useOnMount';

type AnimationFrameId = ReturnType<typeof requestAnimationFrame>;

const EMPTY = 0 as unknown as AnimationFrameId;

abstract class Scheduler {
  static callbacks = [] as (FrameRequestCallback | null)[];
  static nextId = 1;
  static startId = 1;
  static isScheduled = false;

  static onAnimationFrame(timestamp: number) {
    this.isScheduled = false;

    let currentRenderCallbacks = this.callbacks;
    this.callbacks = [];
    for (let i = 0; i < currentRenderCallbacks.length; i++) {
      currentRenderCallbacks[i]?.(timestamp);
    }
    this.startId = this.nextId;
  }

  static requestAnimationFrame(fn: FrameRequestCallback) {
    const id = this.nextId++;
    this.callbacks.push(fn);
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

export default function useAnimationFrame() {
  const timeout = useLazyRef(AnimationFrame.create).current;

  useOnMount(timeout.disposeEffect);

  return timeout;
}
