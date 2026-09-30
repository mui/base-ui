import { expect, vi, describe, it, beforeEach, afterEach } from 'vitest';
import type { AutoUpdateOptions } from '../floating-ui-react';
import { autoUpdateWhileMoving, SETTLE_FRAMES } from './autoUpdateWhileMoving';

const { autoUpdateSpy, autoUpdateCleanupSpy } = vi.hoisted(() => ({
  autoUpdateSpy: vi.fn(),
  autoUpdateCleanupSpy: vi.fn(),
}));

vi.mock('../floating-ui-react', async () => {
  const actual =
    await vi.importActual<typeof import('../floating-ui-react')>('../floating-ui-react');

  return {
    ...actual,
    autoUpdate: ((...args: Parameters<typeof actual.autoUpdate>) => {
      autoUpdateSpy(...args);
      return autoUpdateCleanupSpy;
    }) satisfies typeof actual.autoUpdate,
  };
});

const trackingOptions: AutoUpdateOptions = {
  ancestorScroll: true,
  elementResize: true,
  layoutShift: true,
};

function setup(options = trackingOptions) {
  let left = 0;
  const reference = document.createElement('button');
  reference.getBoundingClientRect = () =>
    DOMRect.fromRect({ x: left, y: 0, width: 10, height: 10 });
  const floating = document.createElement('div');
  const update = vi.fn();

  const cleanup = autoUpdateWhileMoving(reference, floating, update, options);
  // The callback autoUpdate calls on observer changes (and once initially).
  const observerUpdate: () => void = autoUpdateSpy.mock.calls[0][2];

  return {
    update,
    cleanup,
    observerUpdate,
    moveAnchor() {
      left += 1;
    },
  };
}

function nextFrame() {
  vi.advanceTimersToNextFrame();
}

// Polling counts still frames up to `SETTLE_FRAMES + 1` and stops on the frame after that.
const STILL_FRAMES_AFTER_MOVE = SETTLE_FRAMES + 1;

describe('autoUpdateWhileMoving', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    autoUpdateSpy.mockClear();
    autoUpdateCleanupSpy.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('passes the options through to autoUpdate', () => {
    const { cleanup } = setup();
    expect(autoUpdateSpy.mock.calls[0][3]).toBe(trackingOptions);
    cleanup();
  });

  it('updates every frame while the anchor rect changes', () => {
    const { update, observerUpdate, moveAnchor, cleanup } = setup();

    observerUpdate();
    expect(update).toHaveBeenCalledTimes(1);

    for (let i = 0; i < 5; i += 1) {
      moveAnchor();
      nextFrame();
      expect(update).toHaveBeenCalledTimes(i + 2);
    }

    cleanup();
  });

  it('stops polling once the anchor has settled', () => {
    const { update, observerUpdate, moveAnchor, cleanup } = setup();

    observerUpdate();
    moveAnchor();
    nextFrame();
    expect(update).toHaveBeenCalledTimes(2);

    for (let i = 0; i < STILL_FRAMES_AFTER_MOVE; i += 1) {
      expect(vi.getTimerCount()).toBe(1);
      nextFrame();
    }

    expect(vi.getTimerCount()).toBe(0);

    // Movement after settling is not picked up until the next observer update.
    moveAnchor();
    nextFrame();
    expect(update).toHaveBeenCalledTimes(2);

    cleanup();
  });

  it('resets the settle count when the anchor moves again', () => {
    const { update, observerUpdate, moveAnchor, cleanup } = setup();

    observerUpdate();
    for (let i = 0; i < SETTLE_FRAMES; i += 1) {
      nextFrame();
    }
    moveAnchor();
    nextFrame();
    expect(update).toHaveBeenCalledTimes(2);

    for (let i = 0; i < STILL_FRAMES_AFTER_MOVE; i += 1) {
      expect(vi.getTimerCount()).toBe(1);
      nextFrame();
    }
    expect(vi.getTimerCount()).toBe(0);

    cleanup();
  });

  it('restarts polling on the next observer update after settling', () => {
    const { update, observerUpdate, moveAnchor, cleanup } = setup();

    observerUpdate();
    // The observer update starts the count at 0, one frame before a moved frame would.
    for (let i = 0; i < STILL_FRAMES_AFTER_MOVE + 1; i += 1) {
      expect(vi.getTimerCount()).toBe(1);
      nextFrame();
    }
    expect(vi.getTimerCount()).toBe(0);

    observerUpdate();
    expect(update).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(1);

    moveAnchor();
    nextFrame();
    expect(update).toHaveBeenCalledTimes(3);

    cleanup();
  });

  it('cancels the pending frame and autoUpdate on cleanup', () => {
    const { update, observerUpdate, moveAnchor, cleanup } = setup();

    observerUpdate();
    cleanup();
    expect(autoUpdateCleanupSpy).toHaveBeenCalledTimes(1);

    moveAnchor();
    nextFrame();
    nextFrame();
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('does not poll when anchor tracking is disabled', () => {
    const options = { ancestorScroll: false, elementResize: false, layoutShift: false };
    const { update, observerUpdate, moveAnchor, cleanup } = setup(options);

    expect(observerUpdate).toBe(update);
    observerUpdate();
    expect(vi.getTimerCount()).toBe(0);

    moveAnchor();
    nextFrame();
    expect(update).toHaveBeenCalledTimes(1);

    cleanup();
  });
});
