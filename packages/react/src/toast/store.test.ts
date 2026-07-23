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

  it('computes stacking metadata per group', () => {
    // Ordered newest-first, matching how `addToast` prepends. Two toasts in the
    // `top` group interleaved with two in the default (unnamed) group.
    const store = createStore([
      { id: 'd', height: 10, group: 'top' },
      { id: 'c', height: 20 },
      { id: 'b', height: 30, group: 'top' },
      { id: 'a', height: 40 },
    ]);

    // The default group ignores the `top` toasts entirely.
    expect(selectors.toastVisibleIndex(store.state, 'c')).toBe(0);
    expect(selectors.toastVisibleIndex(store.state, 'a')).toBe(1);
    expect(selectors.toastOffsetY(store.state, 'c')).toBe(0);
    expect(selectors.toastOffsetY(store.state, 'a')).toBe(20);
    expect(selectors.toastFrontmostHeight(store.state, 'a')).toBe(20);

    // ...and vice versa.
    expect(selectors.toastVisibleIndex(store.state, 'd')).toBe(0);
    expect(selectors.toastVisibleIndex(store.state, 'b')).toBe(1);
    expect(selectors.toastOffsetY(store.state, 'd')).toBe(0);
    expect(selectors.toastOffsetY(store.state, 'b')).toBe(10);
    expect(selectors.toastFrontmostHeight(store.state, 'b')).toBe(10);

    // DOM indices stay global; stack indices are per group.
    expect(selectors.toastIndex(store.state, 'b')).toBe(2);
    expect(selectors.toastStackIndex(store.state, 'b')).toBe(1);
    expect(selectors.toastIndex(store.state, 'a')).toBe(3);
    expect(selectors.toastStackIndex(store.state, 'a')).toBe(1);

    // An ending toast keeps holding space in its own group only.
    store.closeToast('d');
    expect(selectors.toastVisibleIndex(store.state, 'd')).toBe(-1);
    expect(selectors.toastVisibleIndex(store.state, 'b')).toBe(0);
    expect(selectors.toastVisibleIndex(store.state, 'c')).toBe(0);
    expect(selectors.toastVisibleIndex(store.state, 'a')).toBe(1);
  });

  it('measures the frontmost height from the newest toast that is not ending', () => {
    const store = createStore([
      { id: 'b', height: 10, group: 'top' },
      { id: 'a', height: 30, group: 'top' },
    ]);

    // Closing the frontmost toast zeroes its height; the toast behind it is now
    // the one collapsed stacks should size against.
    store.closeToast('b');
    expect(selectors.toastFrontmostHeight(store.state, 'a')).toBe(30);
    expect(selectors.toastFrontmostHeight(store.state, 'b')).toBe(30);
  });

  it('applies the limit per group', () => {
    const store = createStore([
      { id: 'f', group: 'top' },
      { id: 'e' },
      { id: 'd', group: 'top' },
      { id: 'c' },
      { id: 'b', group: 'top' },
      { id: 'a' },
    ]);

    store.syncProviderProps(0, 2);
    expect(selectors.toast(store.state, 'f')?.limited).toBe(false);
    expect(selectors.toast(store.state, 'd')?.limited).toBe(false);
    expect(selectors.toast(store.state, 'b')?.limited).toBe(true);
    expect(selectors.toast(store.state, 'e')?.limited).toBe(false);
    expect(selectors.toast(store.state, 'c')?.limited).toBe(false);
    expect(selectors.toast(store.state, 'a')?.limited).toBe(true);
  });

  it('recomputes limited flags when a toast moves between groups', () => {
    const store = createStore([{ id: 'b', group: 'top' }, { id: 'a' }]);
    store.syncProviderProps(0, 1);
    expect(selectors.toast(store.state, 'b')?.limited).toBe(false);
    expect(selectors.toast(store.state, 'a')?.limited).toBe(false);

    // Moving `b` into the default group exceeds its limit of 1.
    store.updateToast('b', { group: undefined });
    expect(selectors.toast(store.state, 'b')?.limited).toBe(false);
    expect(selectors.toast(store.state, 'a')?.limited).toBe(true);

    // Moving it back frees the slot again.
    store.updateToast('b', { group: 'top' });
    expect(selectors.toast(store.state, 'a')?.limited).toBe(false);
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
