import { afterEach, describe, expect, it, vi } from 'vitest';
import { reset as resetWarnings } from '@base-ui/utils/warn';
import { ToastStore, selectors } from './store';
import type { ToastObject } from './useToastManager';

function createStore(toasts: ToastObject<any>[]) {
  return new ToastStore({
    // Mirrors `addToast`, which always stamps an `updateKey` on the way in.
    toasts: toasts.map((toast) => ({ updateKey: 0, ...toast })),
    timeout: 0,
    limit: 3,
    hovering: false,
    focused: false,
    isWindowFocused: true,
    viewport: null,
    prevFocusElement: null,
  });
}

function expectToastMetadataToMatchToasts(store: ToastStore) {
  let visibleIndex = 0;
  let offsetY = 0;

  store.state.toasts.forEach((toast, index) => {
    const isEnding = toast.transitionStatus === 'ending';

    expect(selectors.toast(store.state, toast.id)).toBe(toast);
    expect(selectors.toastIndex(store.state, toast.id)).toBe(index);
    expect(selectors.toastOffsetY(store.state, toast.id)).toBe(offsetY);
    expect(selectors.toastVisibleIndex(store.state, toast.id)).toBe(isEnding ? -1 : visibleIndex);

    offsetY += toast.height || 0;

    if (!isEnding) {
      visibleIndex += 1;
    }
  });
}

describe('ToastStore', () => {
  it('keeps toast metadata synchronized after mutations', () => {
    const store = createStore([
      { id: 'newest', height: 30 },
      { id: 'middle', height: 40 },
      { id: 'oldest', height: 50 },
    ]);

    expectToastMetadataToMatchToasts(store);

    store.updateToastInternal('middle', { height: 45 });

    expectToastMetadataToMatchToasts(store);

    store.closeToast('middle');

    expectToastMetadataToMatchToasts(store);
    expect(selectors.toast(store.state, 'middle')?.transitionStatus).toBe('ending');

    store.removeToast('middle', true);

    expectToastMetadataToMatchToasts(store);

    store.addToast({ id: 'front', title: 'Front', timeout: 0 });

    expectToastMetadataToMatchToasts(store);
  });

  it('ignores height recalculations while a toast is transitioning out', () => {
    const store = createStore([{ id: 'a', height: 40 }]);

    store.closeToast('a');
    expect(selectors.toast(store.state, 'a')?.transitionStatus).toBe('ending');

    // Mirrors the write `recalculateHeight` makes when a content observer fires:
    // it always includes `transitionStatus: undefined`. The ending toast must stay
    // ending so `useOpenChangeComplete` still removes it.
    store.updateToastInternal('a', { height: 80, transitionStatus: undefined });

    const toast = selectors.toast(store.state, 'a');
    expect(toast?.transitionStatus).toBe('ending');
    expect(toast?.height).toBe(0);

    store.removeToast('a', true);
    expect(selectors.toast(store.state, 'a')).toBe(undefined);
  });

  it('ignores mutations that target an unknown toast', () => {
    const store = createStore([{ id: 'a' }]);
    const toastsBefore = store.state.toasts;

    store.removeToast('missing');
    store.closeToast('missing');
    store.updateToast('missing', { title: 'nope' });

    expect(store.state.toasts).toBe(toastsBefore);
    expect(selectors.toast(store.state, 'a')?.transitionStatus).toBe(undefined);
  });

  it('replaces custom data wholesale when updating a toast', () => {
    const store = createStore([{ id: 'a', data: { name: 'Draft', count: 1 } }]);

    const nextData = { count: 2 };
    store.updateToast('a', { data: nextData });
    expect(selectors.toast(store.state, 'a')?.data).toBe(nextData);

    store.updateToast('a', { title: 'Saved' });
    expect(selectors.toast(store.state, 'a')?.data).toBe(nextData);

    store.updateToast('a', { data: undefined });
    expect(selectors.toast(store.state, 'a')?.data).toBe(undefined);
  });

  it('shallow merges a data patch into plain object custom data', () => {
    const store = createStore([
      { id: 'a', data: { name: 'Draft', count: 1, nested: { keep: 1 } } },
    ]);

    store.updateToast('a', { dataPatch: { count: 2, nested: { drop: 2 } } });
    const toast = selectors.toast(store.state, 'a');
    // Nested values are replaced rather than merged into.
    expect(toast?.data).toEqual({ name: 'Draft', count: 2, nested: { drop: 2 } });
    expect(toast).not.toHaveProperty('dataPatch');
    expect(toast?.updateKey).toBe(1);
  });

  it('merges a data patch into the data given in the same update', () => {
    const store = createStore([{ id: 'a', data: { name: 'Draft', stale: true } }]);

    store.updateToast<{ name: string; count?: number }>('a', {
      data: { name: 'Saved' },
      dataPatch: { count: 1 },
    });
    expect(selectors.toast(store.state, 'a')?.data).toEqual({ name: 'Saved', count: 1 });
  });

  it('ignores a data patch when the toast has no custom data', () => {
    resetWarnings();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const store = createStore([{ id: 'a' }]);

      store.updateToast('a', { title: 'Saved', dataPatch: { name: 'Draft' } });
      const toast = selectors.toast(store.state, 'a');
      expect(toast?.title).toBe('Saved');
      expect(toast?.data).toBe(undefined);
      expect(toast).not.toHaveProperty('dataPatch');
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0]?.[0]).toContain('The `dataPatch` option was ignored');
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('ignores a data patch when the custom data is not a plain object', () => {
    class Model {
      name: string;

      constructor(name: string) {
        this.name = name;
      }
    }
    class NullBasedModel {
      name: string;

      constructor(name: string) {
        this.name = name;
      }
    }
    // Its instances are now "one hop from `null`" like an object literal, but they are
    // still class instances.
    Object.setPrototypeOf(NullBasedModel.prototype, null);

    // Patching any of these key by key would strip the prototype (arrays, `Map`, class
    // instances) or swap a deliberately null prototype for `Object.prototype`.
    const values = [
      ['x', 'y'],
      new Map([['k', 1]]),
      new Model('a'),
      new NullBasedModel('a'),
      Object.assign(Object.create(null), { name: 'a' }),
    ];
    const store = createStore(values.map((data, index) => ({ id: `${index}`, data })));

    resetWarnings();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      values.forEach((data, index) => {
        store.updateToast(`${index}`, { dataPatch: { name: 'b' } });
        expect(selectors.toast(store.state, `${index}`)?.data).toBe(data);
      });
      // The warning is logged once per message.
      expect(warnSpy).toHaveBeenCalledTimes(1);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('ignores a data patch that is not itself a plain object', () => {
    resetWarnings();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const data = { name: 'Draft' };
      const store = createStore([{ id: 'a', data }]);

      store.updateToast('a', { dataPatch: ['x'] as any });
      expect(selectors.toast(store.state, 'a')?.data).toBe(data);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('keeps an own __proto__ key in a data patch as an own key', () => {
    const store = createStore([{ id: 'a', data: { name: 'Draft' } }]);

    // `Object.assign` writes through the inherited `__proto__` setter, which would swap
    // the merged object's prototype and drop the key instead of copying it.
    const injected = JSON.parse('{"__proto__":{"injected":true}}');
    store.updateToast('a', { dataPatch: injected });
    const data = selectors.toast(store.state, 'a')?.data;
    expect(Object.getPrototypeOf(data)).toBe(Object.prototype);
    expect(Object.hasOwn(data, '__proto__')).toBe(true);
    expect('injected' in data).toBe(false);

    // The merged value is still a plain object, so a later patch still merges.
    store.updateToast('a', { dataPatch: { count: 1 } });
    expect(selectors.toast(store.state, 'a')?.data).toMatchObject({ name: 'Draft', count: 1 });
  });

  it('does not read a data patch when updating a missing or ending toast', () => {
    const store = createStore([{ id: 'a', data: { name: 'Draft' } }]);
    store.closeToast('a');
    expect(selectors.toast(store.state, 'a')?.transitionStatus).toBe('ending');

    const dataPatch = {
      get name(): string {
        throw new Error('data was read');
      },
    };
    expect(() => store.updateToast('a', { dataPatch })).not.toThrow();
    expect(selectors.toast(store.state, 'a')?.data).toEqual({ name: 'Draft' });

    expect(() => store.updateToast('missing', { dataPatch })).not.toThrow();
  });

  it('replaces custom data when re-adding a toast under an existing id', () => {
    const store = createStore([]);

    // `add` takes a complete `Data`, so keys the caller leaves out must not survive from
    // the previous value.
    store.addToast({ id: 'a', data: { status: 'error', errorCode: 42 } });
    store.addToast({ id: 'a', data: { status: 'ok' } });
    expect(selectors.toast(store.state, 'a')?.data).toEqual({ status: 'ok' });

    // Only the data actually given is replaced; omitting it leaves the stored value alone.
    store.addToast({ id: 'a', title: 'Still uploading' });
    expect(selectors.toast(store.state, 'a')?.data).toEqual({ status: 'ok' });
  });

  it('patches the loading data of a promise toast on settlement', async () => {
    resetWarnings();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const store = createStore([]);

      await store.promiseToast(Promise.resolve('done'), {
        loading: { title: 'Saving', data: { step: 'save', progress: 0 } },
        success: { title: 'Saved', dataPatch: { progress: 100 } },
        error: 'Failed',
      });
      const toast = store.state.toasts[0];
      expect(toast?.data).toEqual({ step: 'save', progress: 100 });
      expect(toast).not.toHaveProperty('dataPatch');
      expect(warnSpy).not.toHaveBeenCalled();

      // A loading toast is brand new, so it has no data for a patch to merge into.
      await store.promiseToast(Promise.resolve('done'), {
        loading: {
          title: 'Saving',
          // @ts-expect-error - the `loading` type omits `dataPatch`; a JavaScript caller can still pass one
          dataPatch: { progress: 0 },
        },
        success: 'Saved',
        error: 'Failed',
      });
      const loadingToast = store.state.toasts[0];
      expect(loadingToast?.data).toBe(undefined);
      expect(loadingToast).not.toHaveProperty('dataPatch');
      expect(warnSpy).toHaveBeenCalledTimes(1);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('does not invoke onRemove for a toast that is no longer in the store', () => {
    const onRemove = vi.fn();
    const store = createStore([{ id: 'a', onRemove }]);

    store.removeToast('a');
    expect(onRemove).toHaveBeenCalledTimes(1);

    // Removing again must be a no-op rather than firing the callback a second time.
    store.removeToast('a');
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  describe('limit', () => {
    it('recomputes limited flags when the limit changes', () => {
      // Ordered newest-first, matching how `addToast` prepends.
      const store = createStore([{ id: 'c' }, { id: 'b' }, { id: 'a' }]);

      store.syncProviderProps(0, 1);
      expect(selectors.toast(store.state, 'c')?.limited).toBe(false);
      expect(selectors.toast(store.state, 'b')?.limited).toBe(true);
      expect(selectors.toast(store.state, 'a')?.limited).toBe(true);

      store.syncProviderProps(0, 3);
      expect(selectors.toast(store.state, 'c')?.limited).toBe(false);
      expect(selectors.toast(store.state, 'b')?.limited).toBe(false);
      expect(selectors.toast(store.state, 'a')?.limited).toBe(false);
    });
  });

  describe('timer pausing', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('re-pauses timers after the last toast is closed and a new one is added', () => {
      vi.useFakeTimers();
      const store = createStore([]);

      // Add a toast with a running timer, then pause it (as a hover would).
      store.addToast({ title: 'a', timeout: 100 });
      store.pauseTimers();

      // Closing the last toast must clear the internal "paused" flag, otherwise
      // the next toast's timer can never be paused again.
      store.closeToast(store.state.toasts[0].id);

      store.addToast({ title: 'b', timeout: 100 });
      const newToastId = store.state.toasts[0].id;

      // Hovering again should pause the new toast's timer.
      store.pauseTimers();
      vi.advanceTimersByTime(200);

      expect(selectors.toast(store.state, newToastId)?.transitionStatus).not.toBe('ending');
    });

    it('re-pauses timers after all toasts are closed and a new one is added', () => {
      vi.useFakeTimers();
      const store = createStore([]);

      store.addToast({ id: 'a', title: 'a', timeout: 100 });
      store.addToast({ id: 'b', title: 'b', timeout: 100 });
      store.pauseTimers();

      store.closeToast();

      store.addToast({ id: 'c', title: 'c', timeout: 100 });
      store.pauseTimers();
      vi.advanceTimersByTime(200);

      expect(selectors.toast(store.state, 'c')?.transitionStatus).not.toBe('ending');
    });

    it('re-pauses timers after the last active toast closes while ending toasts remain', () => {
      vi.useFakeTimers();
      const store = createStore([]);

      store.addToast({ id: 'a', title: 'a', timeout: 100 });
      store.addToast({ id: 'b', title: 'b', timeout: 100 });
      store.pauseTimers();

      store.closeToast('b');
      store.closeToast('a');

      store.addToast({ id: 'c', title: 'c', timeout: 100 });
      store.pauseTimers();
      vi.advanceTimersByTime(200);

      expect(selectors.toast(store.state, 'c')?.transitionStatus).not.toBe('ending');
    });

    it('re-pauses timers after the last timed toast closes while untimed toasts remain', () => {
      vi.useFakeTimers();
      const store = createStore([]);

      store.addToast({ id: 'loading', title: 'loading', type: 'loading' });
      store.addToast({ id: 'timed', title: 'timed', timeout: 100 });
      store.pauseTimers();

      store.closeToast('timed');

      store.addToast({ id: 'c', title: 'c', timeout: 100 });
      store.pauseTimers();
      vi.advanceTimersByTime(200);

      expect(selectors.toast(store.state, 'c')?.transitionStatus).not.toBe('ending');
    });

    it('keeps a rescheduled timer paused while expanded, and runs it once collapsed', () => {
      vi.useFakeTimers();
      const store = createStore([]);

      store.addToast({ id: 'a', title: 'a', timeout: 100 });

      // Hovering the viewport pauses the running timer.
      store.set('hovering', true);
      store.pauseTimers();

      // Passing `timeout` reschedules the timer. The replacement must not start
      // running while the viewport is still expanded.
      store.updateToast('a', { timeout: 100 });

      vi.advanceTimersByTime(200);
      expect(selectors.toast(store.state, 'a')?.transitionStatus).not.toBe('ending');

      // Collapsing must still be able to start the rescheduled timer.
      store.set('hovering', false);
      store.resumeTimers();

      vi.advanceTimersByTime(100);
      expect(selectors.toast(store.state, 'a')?.transitionStatus).toBe('ending');
    });

    it('does not extend the remaining time across repeated pause/resume cycles', () => {
      vi.useFakeTimers();
      const store = createStore([]);

      store.addToast({ id: 'a', title: 'a', timeout: 5000 });

      // Two hover cycles, each leaving the timer running for 1000ms.
      for (let cycle = 0; cycle < 2; cycle += 1) {
        vi.advanceTimersByTime(1000);
        store.pauseTimers();
        vi.advanceTimersByTime(1000);
        store.resumeTimers();
      }

      // 2000ms of the 5000ms timeout has been consumed, so 3000ms must remain.
      vi.advanceTimersByTime(2999);
      expect(selectors.toast(store.state, 'a')?.transitionStatus).not.toBe('ending');

      vi.advanceTimersByTime(2);
      expect(selectors.toast(store.state, 'a')?.transitionStatus).toBe('ending');
    });

    it('restarts the full delay when the clock jumped past the timeout before pausing', () => {
      vi.useFakeTimers();
      const store = createStore([]);

      store.addToast({ id: 'a', title: 'a', timeout: 5000 });

      // Mimics a throttled background tab: wall-clock time passes without the
      // scheduled timeout ever running.
      vi.setSystemTime(Date.now() + 60_000);
      store.pauseTimers();
      store.resumeTimers();

      vi.advanceTimersByTime(4999);
      expect(selectors.toast(store.state, 'a')?.transitionStatus).not.toBe('ending');

      vi.advanceTimersByTime(1);
      expect(selectors.toast(store.state, 'a')?.transitionStatus).toBe('ending');
    });

    it('re-pauses timers after the last timed toast becomes untimed', () => {
      vi.useFakeTimers();
      const store = createStore([]);

      store.addToast({ id: 'a', title: 'a', timeout: 100 });
      store.pauseTimers();

      store.updateToastInternal('a', { timeout: 0 });

      store.addToast({ id: 'b', title: 'b', timeout: 100 });
      store.pauseTimers();
      vi.advanceTimersByTime(200);

      expect(selectors.toast(store.state, 'b')?.transitionStatus).not.toBe('ending');
    });

    it('accumulates active time across hover cycles so the toast still dismisses', () => {
      vi.useFakeTimers();
      const store = createStore([]);

      store.addToast({ id: 'a', title: 'a', timeout: 100 });

      vi.advanceTimersByTime(40);
      store.pauseTimers();
      expect(selectors.toast(store.state, 'a')?.transitionStatus).not.toBe('ending');

      store.resumeTimers();
      vi.advanceTimersByTime(40);
      store.pauseTimers();
      expect(selectors.toast(store.state, 'a')?.transitionStatus).not.toBe('ending');

      store.resumeTimers();
      vi.advanceTimersByTime(40);

      expect(selectors.toast(store.state, 'a')?.transitionStatus).toBe('ending');
    });
  });
});
