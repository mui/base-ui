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
  /* This implementation uses an array as a backing data-structure for frame callbacks.
   * It allows `O(1)` callback cancelling by inserting a `null` in the array, though it
   * never calls the native `cancelAnimationFrame` if there are no frames left. This can
   * be much more efficient if there is a call pattern that alterns as
   * "request-cancel-request-cancel-…".
   * But in the case of "request-request-…-cancel-cancel-…", it leaves the final animation
   * frame to run anyway. We turn that frame into a `O(1)` no-op via `callbacksCount`. */

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
  static create(ownerWindow?: Window) {
    return new AnimationFrame(ownerWindow);
  }

  static request(fn: FrameRequestCallback, ownerWindow?: Window) {
    return ownerWindow ? ownerWindow.requestAnimationFrame(fn) : scheduler.request(fn);
  }

  static cancel(id: AnimationFrameId, ownerWindow?: Window) {
    if (ownerWindow) {
      try {
        ownerWindow.cancelAnimationFrame(id);
      } catch {
        // The window may have closed.
      }
      return;
    }
    scheduler.cancel(id);
  }

  constructor(private readonly ownerWindow?: Window) {}

  currentId: AnimationFrameId | null = EMPTY;

  /** Executes `fn` on the next animation frame, replacing any pending call. */
  request(fn: Function) {
    this.cancel();
    this.currentId = AnimationFrame.request(() => {
      this.currentId = EMPTY;
      fn();
    }, this.ownerWindow);
  }

  cancel = () => {
    if (this.currentId !== EMPTY) {
      const id = this.currentId;
      this.currentId = EMPTY;
      AnimationFrame.cancel(id, this.ownerWindow);
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
  const timeout = useRefWithInit(AnimationFrame.create).current;

  useOnMount(timeout.disposeEffect);

  return timeout;
}
