import { expect, vi } from 'vitest';

type IdleCallbackModule = typeof import('./useIdleCallback');

let IdleCallback: IdleCallbackModule['IdleCallback'];

beforeAll(async () => {
  vi.stubGlobal('requestIdleCallback', undefined);
  vi.stubGlobal('cancelIdleCallback', undefined);
  vi.useFakeTimers();

  ({ IdleCallback } = await import('./useIdleCallback'));
});

afterAll(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('IdleCallback fallback', () => {
  it('schedules and cancels callbacks when requestIdleCallback is unavailable', () => {
    const idleCallback = IdleCallback.create();
    const first = vi.fn();
    const second = vi.fn();

    idleCallback.start(first);
    idleCallback.start(second);

    vi.runOnlyPendingTimers();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);

    idleCallback.start(first);
    idleCallback.clear();

    vi.runOnlyPendingTimers();
    expect(first).not.toHaveBeenCalled();
  });
});
