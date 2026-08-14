import { describe, expect, it, vi } from 'vitest';
import { Timeout } from './useTimeout';

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
  const ownerWindow = { setTimeout, clearTimeout } as unknown as Window;
  return { ownerWindow, setTimeout, clearTimeout, scheduled };
}

describe('Timeout with an owner window', () => {
  it('starts through the owner window with the given delay', () => {
    const { ownerWindow, setTimeout, scheduled } = createFakeWindow();
    const timeout = new Timeout(ownerWindow);
    const fn = vi.fn();

    timeout.start(250, fn);

    expect(setTimeout).toHaveBeenCalledOnce();
    expect(setTimeout.mock.calls[0][1]).toBe(250);
    expect(timeout.currentId).toBe(1);
    scheduled.get(1)!();
    expect(fn).toHaveBeenCalledOnce();
    expect(timeout.isStarted()).toBe(false);
  });

  it('clears through the owner window, including the previous timer on restart', () => {
    const { ownerWindow, clearTimeout, scheduled } = createFakeWindow();
    const timeout = new Timeout(ownerWindow);
    const first = vi.fn();
    const second = vi.fn();

    timeout.start(100, first);
    timeout.start(100, second);
    expect(clearTimeout).toHaveBeenCalledWith(1);
    expect(scheduled.has(1)).toBe(false);
    expect(timeout.currentId).toBe(2);

    timeout.clear();
    expect(clearTimeout).toHaveBeenCalledWith(2);
    expect(timeout.isStarted()).toBe(false);
    expect(scheduled.size).toBe(0);
    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();

    timeout.clear();
    expect(clearTimeout).toHaveBeenCalledTimes(2);
  });
});
