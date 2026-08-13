import { describe, expect, it, vi } from 'vitest';
import { WindowAnimationFrame } from './windowAnimationFrame';
import { WindowTimeout } from './windowTimeout';

/**
 * Both handles exist to schedule through the *injected* window (an iframe's or a
 * popout's), never the main realm's globals — the browser throttles/freezes a
 * hidden window's timers and frames independently of its opener's.
 */

describe('WindowAnimationFrame', () => {
  function createFakeWindow() {
    const scheduled = new Map<number, FrameRequestCallback>();
    let nextId = 1;
    const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      const id = nextId;
      nextId += 1;
      scheduled.set(id, callback);
      return id;
    });
    const cancelAnimationFrame = vi.fn((id: number) => {
      scheduled.delete(id);
    });
    const win = { requestAnimationFrame, cancelAnimationFrame } as unknown as Window;
    return { win, requestAnimationFrame, cancelAnimationFrame, scheduled };
  }

  it('requests through the injected window and resets currentId before the callback runs', () => {
    const { win, requestAnimationFrame, scheduled } = createFakeWindow();
    const frame = new WindowAnimationFrame(win);

    const observedIds: Array<number | null> = [];
    const fn = vi.fn(() => {
      observedIds.push(frame.currentId);
    });
    frame.request(fn);

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(frame.currentId).toBe(1);

    scheduled.get(1)!(0);
    expect(fn).toHaveBeenCalledTimes(1);
    // Reset before the callback, so the callback can re-arm the next frame.
    expect(observedIds).toEqual([null]);
    expect(frame.currentId).toBeNull();
  });

  it('cancels through the injected window', () => {
    const { win, cancelAnimationFrame, scheduled } = createFakeWindow();
    const frame = new WindowAnimationFrame(win);

    const fn = vi.fn();
    frame.request(fn);
    frame.cancel();

    expect(cancelAnimationFrame).toHaveBeenCalledTimes(1);
    expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
    expect(frame.currentId).toBeNull();
    expect(scheduled.size).toBe(0);
    expect(fn).not.toHaveBeenCalled();

    // Idempotent: cancelling with nothing scheduled does not reach the window.
    frame.cancel();
    expect(cancelAnimationFrame).toHaveBeenCalledTimes(1);
  });

  it('releases a frame handle when cancellation throws for a dead window', () => {
    const requestAnimationFrame = vi.fn(() => 1);
    const cancelAnimationFrame = vi.fn(() => {
      throw new DOMException('The browsing context is gone', 'InvalidStateError');
    });
    const win = { requestAnimationFrame, cancelAnimationFrame } as unknown as Window;
    const frame = new WindowAnimationFrame(win);

    frame.request(() => {});
    expect(() => frame.cancel()).not.toThrow();
    expect(frame.currentId).toBeNull();

    frame.request(() => {});
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
  });
});

describe('WindowTimeout', () => {
  function createFakeWindow() {
    const scheduled = new Map<number, () => void>();
    let nextId = 1;
    const setTimeout = vi.fn((callback: () => void, _delay?: number) => {
      const id = nextId;
      nextId += 1;
      scheduled.set(id, callback);
      return id;
    });
    const clearTimeout = vi.fn((id: number) => {
      scheduled.delete(id);
    });
    const win = { setTimeout, clearTimeout } as unknown as Window;
    return { win, setTimeout, clearTimeout, scheduled };
  }

  it('starts through the injected window with the given delay', () => {
    const { win, setTimeout, scheduled } = createFakeWindow();
    const timeout = new WindowTimeout(win);

    const fn = vi.fn();
    timeout.start(250, fn);

    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout.mock.calls[0][1]).toBe(250);
    expect(timeout.currentId).toBe(1);

    scheduled.get(1)!();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(timeout.currentId).toBeNull();
  });

  it('clears through the injected window, including the previous timer on restart', () => {
    const { win, clearTimeout, scheduled } = createFakeWindow();
    const timeout = new WindowTimeout(win);

    const first = vi.fn();
    const second = vi.fn();
    timeout.start(100, first);
    // Restarting replaces the pending timer rather than stacking a second one.
    timeout.start(100, second);
    expect(clearTimeout).toHaveBeenCalledWith(1);
    expect(scheduled.has(1)).toBe(false);
    expect(timeout.currentId).toBe(2);

    timeout.clear();
    expect(clearTimeout).toHaveBeenCalledWith(2);
    expect(timeout.currentId).toBeNull();
    expect(scheduled.size).toBe(0);
    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();

    // Idempotent: clearing with nothing pending does not reach the window.
    timeout.clear();
    expect(clearTimeout).toHaveBeenCalledTimes(2);
  });
});
