import { expect, vi } from 'vitest';
import { rafThrottle } from './rafThrottle';

describe('rafThrottle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should throttle multiple calls to execute at most once per frame', async () => {
    const fn = vi.fn();
    const throttled = rafThrottle(fn);

    throttled('first', 1);
    throttled('second', 2);
    throttled('third', 3);

    // Function should not be called yet
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersToNextFrame();

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('third', 3);
  });

  it('should cancel pending calls when clear is called', async () => {
    const fn = vi.fn();
    const throttled = rafThrottle(fn);

    throttled(1);
    throttled(2);
    throttled(3);

    // Clear before RAF executes
    throttled.clear();

    vi.advanceTimersToNextFrame();

    // Function should not be called
    expect(fn).not.toHaveBeenCalled();
  });

  it('should allow new calls after clear', async () => {
    const fn = vi.fn();
    const throttled = rafThrottle(fn);

    throttled(1);
    throttled.clear();
    throttled(2);

    vi.advanceTimersToNextFrame();

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(2);
  });

  it('should execute on every frame when called continuously', async () => {
    const fn = vi.fn();
    const throttled = rafThrottle(fn);

    // First frame
    throttled(1);
    vi.advanceTimersToNextFrame();

    // Second frame
    throttled(2);
    vi.advanceTimersToNextFrame();

    // Third frame
    throttled(3);
    vi.advanceTimersToNextFrame();

    // Should execute once per frame
    expect(fn).toHaveBeenCalledTimes(3);
    expect(fn).toHaveBeenNthCalledWith(1, 1);
    expect(fn).toHaveBeenNthCalledWith(2, 2);
    expect(fn).toHaveBeenNthCalledWith(3, 3);
  });

  it('should work with functions that return values', async () => {
    const fn = vi.fn().mockReturnValue(42);
    const throttled = rafThrottle(fn);

    throttled(1);

    vi.advanceTimersToNextFrame();

    expect(fn).toHaveBeenCalledWith(1);
    expect(fn).toHaveReturnedWith(42);
  });

  it('should schedule a new RAF after the previous one completes', async () => {
    const fn = vi.fn();
    const throttled = rafThrottle(fn);
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

    throttled(1);
    expect(rafSpy).toHaveBeenCalledTimes(1);

    vi.advanceTimersToNextFrame();
    expect(fn).toHaveBeenCalledWith(1);

    throttled(2);
    expect(rafSpy).toHaveBeenCalledTimes(2);

    vi.advanceTimersToNextFrame();
    expect(fn).toHaveBeenCalledWith(2);
  });

  it('should handle multiple independent throttled functions', async () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    const throttled1 = rafThrottle(fn1);
    const throttled2 = rafThrottle(fn2);

    throttled1('a');
    throttled2('b');

    vi.advanceTimersToNextFrame();

    expect(fn1).toHaveBeenCalledWith('a');
    expect(fn2).toHaveBeenCalledWith('b');
  });

  it('should properly clear and not affect other throttled functions', async () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    const throttled1 = rafThrottle(fn1);
    const throttled2 = rafThrottle(fn2);

    throttled1('a');
    throttled2('b');
    throttled1.clear();

    vi.advanceTimersToNextFrame();

    expect(fn1).not.toHaveBeenCalled();
    expect(fn2).toHaveBeenCalledWith('b');
  });

  it('should handle edge case of clear being called multiple times', async () => {
    const fn = vi.fn();
    const throttled = rafThrottle(fn);

    throttled(1);
    throttled.clear();
    throttled.clear(); // Should not throw

    vi.advanceTimersToNextFrame();

    expect(fn).not.toHaveBeenCalled();
  });

  it('should handle edge case of clear being called when nothing is pending', () => {
    const fn = vi.fn();
    const throttled = rafThrottle(fn);

    // Should not throw when clearing with nothing pending
    expect(() => throttled.clear()).not.toThrow();
  });
});
