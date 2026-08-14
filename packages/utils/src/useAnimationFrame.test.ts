import { describe, expect, it, vi } from 'vitest';
import { AnimationFrame } from './useAnimationFrame';

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
  const ownerWindow = { requestAnimationFrame, cancelAnimationFrame } as unknown as Window;
  return { ownerWindow, requestAnimationFrame, cancelAnimationFrame, scheduled };
}

describe('AnimationFrame with an owner window', () => {
  it('requests through the owner window and resets currentId before the callback runs', () => {
    const { ownerWindow, requestAnimationFrame, scheduled } = createFakeWindow();
    const frame = new AnimationFrame(ownerWindow);
    const observedIds: Array<number | null> = [];
    const fn = vi.fn(() => {
      observedIds.push(frame.currentId);
    });

    frame.request(fn);

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(frame.currentId).toBe(1);
    scheduled.get(1)!(0);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(observedIds).toEqual([null]);
    expect(frame.currentId).toBeNull();
  });

  it('keeps accepting callbacks with required parameters', () => {
    const { ownerWindow, scheduled } = createFakeWindow();
    const frame = new AnimationFrame(ownerWindow);
    const callback = vi.fn((_event: Event) => {});

    frame.request(callback);
    scheduled.get(1)!(0);

    expect(callback).toHaveBeenCalledOnce();
  });

  it('cancels through the owner window', () => {
    const { ownerWindow, cancelAnimationFrame, scheduled } = createFakeWindow();
    const frame = new AnimationFrame(ownerWindow);
    const fn = vi.fn();

    frame.request(fn);
    frame.cancel();

    expect(cancelAnimationFrame).toHaveBeenCalledOnce();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
    expect(frame.currentId).toBeNull();
    expect(scheduled.size).toBe(0);
    expect(fn).not.toHaveBeenCalled();

    frame.cancel();
    expect(cancelAnimationFrame).toHaveBeenCalledOnce();
  });

  it('releases the handle when cancellation throws for a dead window', () => {
    const requestAnimationFrame = vi.fn(() => 1);
    const cancelAnimationFrame = vi.fn(() => {
      throw new DOMException('The browsing context is gone', 'InvalidStateError');
    });
    const ownerWindow = { requestAnimationFrame, cancelAnimationFrame } as unknown as Window;
    const frame = new AnimationFrame(ownerWindow);

    frame.request(() => {});
    expect(() => frame.cancel()).not.toThrow();
    expect(frame.currentId).toBeNull();

    frame.request(() => {});
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
  });
});
