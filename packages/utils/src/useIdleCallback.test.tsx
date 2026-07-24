import * as React from 'react';
import { createRenderer, waitFor } from '@mui/internal-test-utils';
import { expect, vi } from 'vitest';
import { IdleCallback, useIdleCallback } from './useIdleCallback';

/**
 * Waits for the specified number of milliseconds.
 */
async function wait(ms: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

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

      await waitFor(() => expect(fn).toHaveBeenCalledTimes(1));
    });

    it('clear() cancels a pending callback', async () => {
      const idleCallback = IdleCallback.create();
      const fn = vi.fn();

      idleCallback.start(fn);
      idleCallback.clear();

      await wait(50);
      expect(fn).not.toHaveBeenCalled();
    });

    it('start() clears any previously scheduled callback', async () => {
      const idleCallback = IdleCallback.create();
      const first = vi.fn();
      const second = vi.fn();

      idleCallback.start(first);
      idleCallback.start(second);

      await waitFor(() => expect(second).toHaveBeenCalledTimes(1));
      expect(first).not.toHaveBeenCalled();
    });

    it('can be reused after the callback has run', async () => {
      const idleCallback = IdleCallback.create();
      const fn = vi.fn();

      idleCallback.start(fn);
      await waitFor(() => expect(fn).toHaveBeenCalledTimes(1));

      // The completed handle must be reset so a later `clear()` cannot cancel an unrelated callback.
      expect(idleCallback.currentId).toBe(null);

      idleCallback.start(fn);
      await waitFor(() => expect(fn).toHaveBeenCalledTimes(2));
    });

    it('disposeEffect() returns the clear function', async () => {
      const idleCallback = IdleCallback.create();
      const fn = vi.fn();

      idleCallback.start(fn);
      const dispose = idleCallback.disposeEffect();
      expect(dispose).toBe(idleCallback.clear);

      dispose();

      await wait(50);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('useIdleCallback', () => {
    const { render } = createRenderer();

    it('returns a stable scheduler across re-renders', async () => {
      let scheduler!: IdleCallback;

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
      let scheduler!: IdleCallback;

      function Test() {
        scheduler = useIdleCallback();
        return null;
      }

      const { unmount } = await render(<Test />);

      scheduler.start(fn);
      unmount();

      await wait(50);
      expect(fn).not.toHaveBeenCalled();
    });
  });
});
