import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import { expect, vi } from 'vitest';

type IdleCallbackModule = typeof import('./useIdleCallback');

let IdleCallback: IdleCallbackModule['IdleCallback'];
let useIdleCallback: IdleCallbackModule['useIdleCallback'];

const scheduledCallbacks = new Map<number, () => void>();
let nextId = 0;

function scheduleCallback(callback: () => void) {
  nextId += 1;
  scheduledCallbacks.set(nextId, callback);
  return nextId;
}

function flushIdleCallbacks() {
  const callbacks = Array.from(scheduledCallbacks.values());
  scheduledCallbacks.clear();
  callbacks.forEach((callback) => callback());
}

beforeAll(async () => {
  vi.stubGlobal('requestIdleCallback', scheduleCallback);
  vi.stubGlobal('cancelIdleCallback', (id: number) => {
    scheduledCallbacks.delete(id);
  });

  ({ IdleCallback, useIdleCallback } = await import('./useIdleCallback'));
});

beforeEach(() => {
  scheduledCallbacks.clear();
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('IdleCallback', () => {
  describe('IdleCallback class', () => {
    it('create() returns a new instance each time', () => {
      const a = IdleCallback.create();
      const b = IdleCallback.create();
      expect(a).toBeInstanceOf(IdleCallback);
      expect(b).toBeInstanceOf(IdleCallback);
      expect(a).not.toBe(b);
    });

    it('runs the scheduled callback after the current task', async () => {
      const idleCallback = IdleCallback.create();
      const fn = vi.fn();

      idleCallback.start(fn);

      // The callback runs asynchronously after the current task, not synchronously.
      expect(fn).not.toHaveBeenCalled();

      flushIdleCallbacks();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('clear() cancels a pending callback', () => {
      const idleCallback = IdleCallback.create();
      const fn = vi.fn();

      idleCallback.start(fn);
      idleCallback.clear();

      flushIdleCallbacks();
      expect(fn).not.toHaveBeenCalled();
    });

    it('start() clears any previously scheduled callback', () => {
      const idleCallback = IdleCallback.create();
      const first = vi.fn();
      const second = vi.fn();

      idleCallback.start(first);
      idleCallback.start(second);

      flushIdleCallbacks();
      expect(second).toHaveBeenCalledTimes(1);
      expect(first).not.toHaveBeenCalled();
    });

    it('can be reused after the callback has run', () => {
      const idleCallback = IdleCallback.create();
      const fn = vi.fn();

      idleCallback.start(fn);
      flushIdleCallbacks();
      expect(fn).toHaveBeenCalledTimes(1);

      // The completed handle must be reset so a later `clear()` cannot cancel an unrelated callback.
      expect(idleCallback.currentId).toBe(null);

      idleCallback.start(fn);
      flushIdleCallbacks();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('disposeEffect() returns the clear function', () => {
      const idleCallback = IdleCallback.create();
      const fn = vi.fn();

      idleCallback.start(fn);
      const dispose = idleCallback.disposeEffect();
      expect(dispose).toBe(idleCallback.clear);

      dispose();

      flushIdleCallbacks();
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('useIdleCallback', () => {
    const { render } = createRenderer();

    it('returns a stable scheduler across re-renders', async () => {
      let scheduler!: ReturnType<IdleCallbackModule['useIdleCallback']>;

      function Test() {
        scheduler = useIdleCallback();
        return null;
      }

      const { rerender } = await render(<Test />);
      const afterMount = scheduler;
      await rerender(<Test />);

      expect(afterMount).toBeInstanceOf(IdleCallback);
      expect(scheduler).toBe(afterMount);
    });

    it('cancels a pending callback on unmount', async () => {
      const fn = vi.fn();
      let scheduler!: ReturnType<IdleCallbackModule['useIdleCallback']>;

      function Test() {
        scheduler = useIdleCallback();
        return null;
      }

      const { unmount } = await render(<Test />);

      scheduler.start(fn);
      unmount();

      flushIdleCallbacks();
      expect(fn).not.toHaveBeenCalled();
    });
  });
});
