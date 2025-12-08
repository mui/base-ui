import { Store, createSelector, createSelectorMemoized } from '@base-ui-components/utils/store';
import { generateId } from '@base-ui-components/utils/generateId';
import { ownerDocument } from '@base-ui-components/utils/owner';
import { Timeout } from '@base-ui-components/utils/useTimeout';
import {
  ToastManagerAddOptions,
  ToastManagerPromiseOptions,
  ToastManagerUpdateOptions,
  ToastObject,
} from './useToastManager';
import { resolvePromiseOptions } from './utils/resolvePromiseOptions';
import { activeElement, contains, getTarget } from '../floating-ui-react/utils';
import { isFocusVisible } from './utils/focusVisible';

export type State = {
  toasts: ToastObject<any>[];
  hovering: boolean;
  focused: boolean;
  timeout: number;
  limit: number;
  isWindowFocused: boolean;
  viewport: HTMLElement | null;
  prevFocusElement: HTMLElement | null;
};

const toastMapSelector = createSelectorMemoized(
  (state: State) => state.toasts,
  (toasts) => {
    const map = new Map<
      string,
      { value: ToastObject<any>; domIndex: number; visibleIndex: number; offsetY: number }
    >();
    let visibleIndex = 0;
    let offsetY = 0;
    toasts.forEach((toast, toastIndex) => {
      const isEnding = toast.transitionStatus === 'ending';
      map.set(toast.id, {
        value: toast,
        domIndex: toastIndex,
        visibleIndex: isEnding ? -1 : visibleIndex,
        offsetY,
      });

      offsetY += toast.height || 0;

      if (!isEnding) {
        visibleIndex += 1;
      }
    });
    return map;
  },
);

export const selectors = {
  toasts: createSelector((state: State) => state.toasts),
  isEmpty: createSelector((state: State) => state.toasts.length === 0),
  toast: createSelector(toastMapSelector, (toastMap, id: string) => toastMap.get(id)?.value),
  toastIndex: createSelector(
    toastMapSelector,
    (toastMap, id: string) => toastMap.get(id)?.domIndex ?? -1,
  ),
  toastOffsetY: createSelector(
    toastMapSelector,
    (toastMap, id: string) => toastMap.get(id)?.offsetY ?? 0,
  ),
  toastVisibleIndex: createSelector(
    toastMapSelector,
    (toastMap, id: string) => toastMap.get(id)?.visibleIndex ?? -1,
  ),
  hovering: createSelector((state: State) => state.hovering),
  focused: createSelector((state: State) => state.focused),
  expanded: createSelector((state: State) => state.hovering || state.focused),
  expandedOrOutOfFocus: createSelector(
    (state: State) => state.hovering || state.focused || !state.isWindowFocused,
  ),
  prevFocusElement: createSelector((state: State) => state.prevFocusElement),
};

export class ToastStore extends Store<State> {
  private timers = new Map<string, TimerInfo>();

  private areTimersPaused = false;

  setFocused(focused: boolean) {
    this.set('focused', focused);
  }

  setHovering(hovering: boolean) {
    this.set('hovering', hovering);
  }

  setIsWindowFocused(isWindowFocused: boolean) {
    this.set('isWindowFocused', isWindowFocused);
  }

  setPrevFocusElement(prevFocusElement: HTMLElement | null) {
    this.set('prevFocusElement', prevFocusElement);
  }

  setViewport = (viewport: HTMLElement | null) => {
    this.set('viewport', viewport);
  };

  removeToast(toastId: string) {
    const index = selectors.toastIndex(this.state, toastId);
    if (index === -1) {
      return;
    }

    const toast = this.state.toasts[index];
    toast?.onRemove?.();

    const newToasts = [...this.state.toasts];
    newToasts.splice(index, 1);
    this.setToasts(newToasts);
  }

  addToast = <Data extends object>(toast: ToastManagerAddOptions<Data>): string => {
    const { toasts, timeout, limit } = this.state;
    const id = toast.id || generateId('toast');
    const toastToAdd: ToastObject<Data> = {
      ...toast,
      id,
      transitionStatus: 'starting',
    };

    const updatedToasts = [toastToAdd, ...toasts];
    const activeToasts = updatedToasts.filter((t) => t.transitionStatus !== 'ending');

    // Mark oldest toasts for removal when over limit
    if (activeToasts.length > limit) {
      const excessCount = activeToasts.length - limit;
      const oldestActiveToasts = activeToasts.slice(-excessCount);
      const limitedIds = new Set(oldestActiveToasts.map((t) => t.id));

      this.setToasts(
        updatedToasts.map((t) => {
          const limited = limitedIds.has(t.id);
          if (t.limited !== limited) {
            return { ...t, limited };
          }
          return t;
        }),
      );
    } else {
      this.setToasts(updatedToasts.map((t) => (t.limited ? { ...t, limited: false } : t)));
    }

    const duration = toastToAdd.timeout ?? timeout;
    if (toastToAdd.type !== 'loading' && duration > 0) {
      this.scheduleTimer(id, duration, () => this.closeToast(id));
    }

    if (selectors.expandedOrOutOfFocus(this.state)) {
      this.pauseTimers();
    }

    return id;
  };

  updateToast = <Data extends object>(id: string, updates: ToastManagerUpdateOptions<Data>) => {
    const index = selectors.toastIndex(this.state, id);
    if (index === -1) {
      return;
    }
    const { toasts } = this.state;
    const newToasts = [...toasts];
    newToasts.splice(index, 1, { ...toasts[index], ...updates });
    this.setToasts(newToasts);
  };

  closeToast = (toastId: string) => {
    const toast = selectors.toast(this.state, toastId);
    toast?.onClose?.();

    const { limit, toasts } = this.state;

    const toastsWithEnding = toasts.map((item) =>
      item.id === toastId ? { ...item, transitionStatus: 'ending' as const, height: 0 } : item,
    );

    const activeToasts = toastsWithEnding.filter((t) => t.transitionStatus !== 'ending');

    const newToasts = toastsWithEnding.map((item) => {
      if (item.transitionStatus === 'ending') {
        return item;
      }
      const isActiveToastLimited = activeToasts.indexOf(item) >= limit;
      return { ...item, limited: isActiveToastLimited };
    });

    const timer = this.timers.get(toastId);
    if (timer && timer.timeout) {
      timer.timeout.clear();
      this.timers.delete(toastId);
    }

    this.handleFocusManagement(toastId);
    this.setToasts(newToasts);
  };

  promiseToast = <Value, Data extends object>(
    promiseValue: Promise<Value>,
    options: ToastManagerPromiseOptions<Value, Data>,
  ): Promise<Value> => {
    // Create a loading toast (which does not auto-dismiss).
    const loadingOptions = resolvePromiseOptions(options.loading);
    const id = this.addToast({
      ...loadingOptions,
      type: 'loading',
    });

    const handledPromise = promiseValue
      .then((result: Value) => {
        const successOptions = resolvePromiseOptions(options.success, result);
        this.updateToast(id, {
          ...successOptions,
          type: 'success',
        });

        const successTimeout = successOptions.timeout ?? this.state.timeout;
        if (successTimeout > 0) {
          this.scheduleTimer(id, successTimeout, () => this.closeToast(id));
        }

        if (selectors.expandedOrOutOfFocus(this.state)) {
          this.pauseTimers();
        }

        return result;
      })
      .catch((error) => {
        const errorOptions = resolvePromiseOptions(options.error, error);
        this.updateToast(id, {
          ...errorOptions,
          type: 'error',
        });

        const errorTimeout = errorOptions.timeout ?? this.state.timeout;
        if (errorTimeout > 0) {
          this.scheduleTimer(id, errorTimeout, () => this.closeToast(id));
        }

        if (selectors.expandedOrOutOfFocus(this.state)) {
          this.pauseTimers();
        }

        return Promise.reject(error);
      });

    // Private API used exclusively by `Manager` to handoff the promise
    // back to the manager after it's handled here.
    if ({}.hasOwnProperty.call(options, 'setPromise')) {
      (options as any).setPromise(handledPromise);
    }

    return handledPromise;
  };

  pauseTimers() {
    if (this.areTimersPaused) {
      return;
    }
    this.areTimersPaused = true;
    this.timers.forEach((timer) => {
      if (timer.timeout) {
        timer.timeout.clear();
        const elapsed = Date.now() - timer.start;
        const remaining = timer.delay - elapsed;
        timer.remaining = remaining > 0 ? remaining : 0;
      }
    });
  }

  resumeTimers() {
    if (!this.areTimersPaused) {
      return;
    }
    this.areTimersPaused = false;
    this.timers.forEach((timer, id) => {
      timer.remaining = timer.remaining > 0 ? timer.remaining : timer.delay;
      timer.timeout ??= Timeout.create();
      timer.timeout.start(timer.remaining, () => {
        this.timers.delete(id);
        timer.callback();
      });
      timer.start = Date.now();
    });
  }

  restoreFocusToPrevElement() {
    this.state.prevFocusElement?.focus({ preventScroll: true });
  }

  handleDocumentPointerDown(event: PointerEvent) {
    if (event.pointerType !== 'touch') {
      return;
    }

    const target = getTarget(event) as Element | null;
    if (contains(this.state.viewport, target)) {
      return;
    }

    this.resumeTimers();
    this.update({ hovering: false, focused: false });
  }

  private scheduleTimer(id: string, delay: number, callback: () => void) {
    const start = Date.now();
    const shouldStartActive = !selectors.expandedOrOutOfFocus(this.state);
    const currentTimeout = shouldStartActive ? Timeout.create() : undefined;

    currentTimeout?.start(delay, () => {
      this.timers.delete(id);
      callback();
    });

    this.timers.set(id, {
      timeout: currentTimeout,
      start: shouldStartActive ? start : 0,
      delay,
      remaining: delay,
      callback,
    });
  }

  private setToasts(newToasts: ToastObject<any>[]) {
    const updates: Partial<State> = { toasts: newToasts };
    if (newToasts.length === 0) {
      updates.hovering = false;
      updates.focused = false;
    }
    this.update(updates);
  }

  private handleFocusManagement(toastId: string) {
    const activeEl = activeElement(ownerDocument(this.state.viewport));
    if (
      !this.state.viewport ||
      !contains(this.state.viewport, activeEl) ||
      !isFocusVisible(activeEl)
    ) {
      return;
    }

    const toasts = selectors.toasts(this.state);
    const currentIndex = selectors.toastIndex(this.state, toastId);
    let nextToast: ToastObject<any> | null = null;

    // Try to find the next toast that isn't animating out
    let index = currentIndex + 1;
    while (index < toasts.length) {
      if (toasts[index].transitionStatus !== 'ending') {
        nextToast = toasts[index];
        break;
      }
      index += 1;
    }

    // Go backwards if no next toast is found
    if (!nextToast) {
      index = currentIndex - 1;
      while (index >= 0) {
        if (toasts[index].transitionStatus !== 'ending') {
          nextToast = toasts[index];
          break;
        }
        index -= 1;
      }
    }

    if (nextToast) {
      nextToast.ref?.current?.focus();
    } else {
      this.restoreFocusToPrevElement();
    }
  }
}

interface TimerInfo {
  timeout?: Timeout;
  start: number;
  delay: number;
  remaining: number;
  callback: () => void;
}
