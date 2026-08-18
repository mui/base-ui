'use client';
import { useRefWithInit } from './useRefWithInit';
import { useOnMount } from './useOnMount';

type AnimationFrameId = number;

/** Unlike `setTimeout`, rAF doesn't guarantee a positive integer return value, so we can't have
 * a monomorphic `uint` type with `0` meaning empty.
 * See warning note at:
 * https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame#return_value */
const EMPTY = null;

let LAST_RAF = globalThis.requestAnimationFrame;

class Scheduler {
  /* One native frame serves every callback requested before it fires. IDs index
   * the callback array, so cancellation only has to null one slot. When every
   * callback is canceled, the native frame stays armed but `callbacksCount`
   * turns its tick into a no-op; this avoids request/cancel churn. */

  callbacks = [] as (FrameRequestCallback | null)[];

  callbacksCount = 0;

  nextId = 1;

  startId = 1;

  isScheduled = false;

  tick = (timestamp: number) => {
    this.isScheduled = false;

    const currentCallbacks = this.callbacks;
    const currentCallbacksCount = this.callbacksCount;

    // Update these before iterating, callbacks could call `requestAnimationFrame` again.
    this.callbacks = [];
    this.callbacksCount = 0;
    this.startId = this.nextId;

    if (currentCallbacksCount > 0) {
      for (let i = 0; i < currentCallbacks.length; i += 1) {
        currentCallbacks[i]?.(timestamp);
      }
    }
  };

  request(fn: FrameRequestCallback) {
    const id = this.nextId;
    this.nextId += 1;
    this.callbacks.push(fn);
    this.callbacksCount += 1;

    /* In a test environment with fake timers, a fake `requestAnimationFrame` can be called
     * but there's no guarantee that the animation frame will actually run before the fake
     * timers are teared, which leaves `isScheduled` set, but won't run our `tick()`. */
    const didRAFChange =
      process.env.NODE_ENV !== 'production' &&
      LAST_RAF !== requestAnimationFrame &&
      ((LAST_RAF = requestAnimationFrame), true);

    if (!this.isScheduled || didRAFChange) {
      requestAnimationFrame(this.tick);
      this.isScheduled = true;
    }
    return id;
  }

  cancel(id: AnimationFrameId) {
    const index = id - this.startId;
    if (index < 0 || index >= this.callbacks.length) {
      return;
    }
    this.callbacks[index] = null;
    this.callbacksCount -= 1;
  }
}

let scheduler = new Scheduler();

/**
 * Replaces the shared scheduler and drops all pending animation frame callbacks.
 *
 * For test environments only. The scheduler is process-global, so a callback scheduled in one test
 * but never run (e.g. requested under fake timers that were torn down before the frame fired) would
 * otherwise survive into a later test and run there against stale state. Call between tests to drop
 * such leftovers.
 */
export function resetAnimationFrameScheduler() {
  const previous = scheduler;
  scheduler = new Scheduler();
  // Continue the id sequence so `cancel()` calls from `AnimationFrame` instances created before the
  // reset cannot cancel callbacks scheduled after it.
  scheduler.nextId = previous.nextId;
  scheduler.startId = previous.nextId;
  // A frame requested before the reset may still be pending and holds the previous scheduler's
  // `tick`; empty its queue in place so that frame runs nothing when it eventually fires.
  previous.callbacks = [];
  previous.callbacksCount = 0;
}

export class AnimationFrame {
  static create() {
    return new AnimationFrame();
  }

  static request(fn: FrameRequestCallback) {
    return scheduler.request(fn);
  }

  static cancel(id: AnimationFrameId) {
    scheduler.cancel(id);
  }

  currentId: AnimationFrameId | null = EMPTY;

  /** Executes `fn` on the next animation frame, replacing any pending call. */
  request(fn: Function) {
    this.cancel();
    this.currentId = scheduler.request(() => {
      this.currentId = EMPTY;
      fn();
    });
  }

  cancel = () => {
    if (this.currentId !== EMPTY) {
      const id = this.currentId;
      this.currentId = EMPTY;
      scheduler.cancel(id);
    }
  };

  disposeEffect = () => {
    return this.cancel;
  };
}

/**
 * A `requestAnimationFrame` with automatic cleanup and guard.
 */
export function useAnimationFrame() {
  const frame = useRefWithInit(AnimationFrame.create).current;

  useOnMount(frame.disposeEffect);

  return frame;
}
