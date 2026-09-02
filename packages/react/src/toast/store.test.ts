import { afterEach, describe, expect, it, vi } from 'vitest';
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

  it('shallow merges custom data when updating a toast', () => {
    const store = createStore([{ id: 'a', data: { name: 'Draft', count: 1 } }]);

    store.updateToast('a', { data: { count: 2 } });
    expect(selectors.toast(store.state, 'a')?.data).toEqual({ name: 'Draft', count: 2 });

    store.updateToast('a', { title: 'Saved' });
    expect(selectors.toast(store.state, 'a')?.data).toEqual({ name: 'Draft', count: 2 });

    store.updateToast('a', { data: undefined });
    expect(selectors.toast(store.state, 'a')?.data).toBe(undefined);
  });

  it('replaces nested values in custom data rather than merging into them', () => {
    const store = createStore([{ id: 'a', data: { nested: { keep: 1, drop: 2 } } }]);

    store.updateToast('a', { data: { nested: { keep: 9 } } });
    expect(selectors.toast(store.state, 'a')?.data).toEqual({ nested: { keep: 9 } });
  });

  it('replaces array custom data instead of merging it index-wise', () => {
    const store = createStore([{ id: 'a', data: ['x', 'y'] }]);

    // Spreading an array merges it index-wise, which turns it into a plain object
    // and leaves the stale trailing entry behind.
    const nextData = ['z'];
    store.updateToast('a', { data: nextData });
    expect(selectors.toast(store.state, 'a')?.data).toBe(nextData);
  });

  it('replaces class instance custom data so its prototype survives', () => {
    class Model {
      name: string;

      constructor(name: string) {
        this.name = name;
      }

      greet() {
        return `hi ${this.name}`;
      }
    }

    const store = createStore([{ id: 'a', data: new Model('a') }]);

    // Spreading a class instance drops its prototype along with its methods.
    store.updateToast('a', { data: new Model('b') });
    const data = selectors.toast(store.state, 'a')?.data;
    expect(data).toBeInstanceOf(Model);
    expect(data.greet()).toBe('hi b');
  });

  it('replaces Map custom data instead of flattening it to an empty object', () => {
    const store = createStore([{ id: 'a', data: new Map([['k', 1]]) }]);

    // A `Map` keeps its entries off its own enumerable properties, so spreading one
    // yields an empty object and loses every entry.
    const nextData = new Map([['j', 2]]);
    store.updateToast('a', { data: nextData });
    expect(selectors.toast(store.state, 'a')?.data).toBe(nextData);
  });

  it('merges plain object custom data that does not use this realm’s Object.prototype', () => {
    // A record built in another realm — an iframe, say — has a prototype one hop from
    // `null` that is not this realm's `Object.prototype`. It is still a plain record, so it
    // merges, and the merge must not swap its prototype for the local one.
    const foreignObjectPrototype = Object.create(null);
    const store = createStore([
      {
        id: 'a',
        data: Object.assign(Object.create(foreignObjectPrototype), { name: 'Draft', count: 1 }),
      },
    ]);

    store.updateToast('a', { data: { count: 2 } });
    const data = selectors.toast(store.state, 'a')?.data;
    expect({ ...data }).toEqual({ name: 'Draft', count: 2 });
    expect(Object.getPrototypeOf(data)).toBe(foreignObjectPrototype);
  });

  it('keeps an own __proto__ key in custom data as an own key', () => {
    const store = createStore([{ id: 'a', data: { name: 'Draft' } }]);

    // `Object.assign` writes through the inherited `__proto__` setter, which would swap
    // the merged object's prototype and drop the key instead of copying it.
    const injected = JSON.parse('{"__proto__":{"injected":true}}');
    store.updateToast('a', { data: injected });
    const data = selectors.toast(store.state, 'a')?.data;
    expect(Object.getPrototypeOf(data)).toBe(Object.prototype);
    expect(Object.hasOwn(data, '__proto__')).toBe(true);
    expect('injected' in data).toBe(false);

    // The merged value is still a plain object, so a later patch still merges.
    store.updateToast('a', { data: { count: 1 } });
    expect(selectors.toast(store.state, 'a')?.data).toMatchObject({ name: 'Draft', count: 1 });
  });

  it('defines merged custom data as own properties instead of calling inherited setters', () => {
    const setter = vi.fn();
    const prototype = Object.create(null);
    Object.defineProperty(prototype, 'count', { set: setter });
    const store = createStore([
      { id: 'a', data: Object.assign(Object.create(prototype), { name: 'Draft' }) },
    ]);

    store.updateToast('a', { data: { count: 2 } });
    const data = selectors.toast(store.state, 'a')?.data;
    expect(setter).not.toHaveBeenCalled();
    expect(Object.hasOwn(data, 'count')).toBe(true);
    expect({ ...data }).toEqual({ name: 'Draft', count: 2 });
    expect(Object.getPrototypeOf(data)).toBe(prototype);
  });

  it('does not read custom data when updating a missing or ending toast', () => {
    const store = createStore([{ id: 'a', data: { name: 'Draft' } }]);
    store.closeToast('a');
    expect(selectors.toast(store.state, 'a')?.transitionStatus).toBe('ending');

    const data = {
      get name(): string {
        throw new Error('data was read');
      },
    };
    expect(() => store.updateToast('a', { data })).not.toThrow();
    expect(selectors.toast(store.state, 'a')?.data).toEqual({ name: 'Draft' });

    expect(() => store.updateToast('missing', { data })).not.toThrow();
  });

  it('replaces null prototype custom data so the null prototype survives', () => {
    const store = createStore([
      { id: 'a', data: Object.assign(Object.create(null), { name: 'Draft' }) },
    ]);

    // Merging would spread the dictionary into an object literal and hand back
    // `Object.prototype`, which is exactly what a null prototype guards against.
    const nextData = Object.assign(Object.create(null), { name: 'Saved' });
    store.updateToast('a', { data: nextData });
    const data = selectors.toast(store.state, 'a')?.data;
    expect(data).toBe(nextData);
    expect(Object.getPrototypeOf(data)).toBe(null);
  });

  it('replaces custom data when only one side is a plain object', () => {
    const store = createStore([
      { id: 'record', data: { name: 'Draft' } },
      { id: 'array', data: ['x'] },
    ]);

    const nextArray = ['z'];
    store.updateToast('record', { data: nextArray });
    expect(selectors.toast(store.state, 'record')?.data).toBe(nextArray);

    const nextRecord = { name: 'Saved' };
    store.updateToast('array', { data: nextRecord });
    expect(selectors.toast(store.state, 'array')?.data).toBe(nextRecord);
  });

  it('stores the given custom data as-is when the toast has none yet', () => {
    const store = createStore([{ id: 'a' }]);

    const nextData = { name: 'Draft' };
    store.updateToast('a', { data: nextData });
    expect(selectors.toast(store.state, 'a')?.data).toBe(nextData);
  });

  it('replaces custom data when re-adding a toast under an existing id', () => {
    const store = createStore([]);

    // `add` takes a complete `Data`, not a patch, so keys the caller leaves out must
    // not survive from the previous value.
    store.addToast({ id: 'a', data: { status: 'error', errorCode: 42 } });
    store.addToast({ id: 'a', data: { status: 'ok' } });
    expect(selectors.toast(store.state, 'a')?.data).toEqual({ status: 'ok' });

    const nextData = new Map([['j', 2]]);
    store.addToast({ id: 'a', data: nextData });
    expect(selectors.toast(store.state, 'a')?.data).toBe(nextData);

    // Only the data actually given is replaced; omitting it leaves the stored value alone.
    store.addToast({ id: 'a', title: 'Still uploading' });
    expect(selectors.toast(store.state, 'a')?.data).toBe(nextData);
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
