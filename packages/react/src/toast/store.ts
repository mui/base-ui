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
import { activeElement, contains } from '../floating-ui-react/utils';
import { isFocusVisible } from './utils/focusVisible';

export type State = {
  toasts: ToastObject<any>[];
  hovering: boolean;
  focused: boolean;
  timeout: number;
  limit: number;
  isWindowFocused: boolean;
  viewportRef: React.RefObject<HTMLElement | null>;
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
  toastMap: toastMapSelector,
  isEmpty: createSelector((state: State) => state.toasts.length === 0),
  toast: createSelector(toastMapSelector, (toastMap, id: string) => toastMap.get(id)?.value),
  toastDOMIndex: createSelector(
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
  prevFocusElement: createSelector((state: State) => state.prevFocusElement),
};

export class ToastStore extends Store<State> {
  private timers = new Map<string, TimerInfo>();

  private areTimersPaused = false;

  focus(focused: boolean) {
    this.set('focused', focused);
  }

  hover(hovering: boolean) {
    this.set('hovering', hovering);
  }

  setIsWindowFocused(isWindowFocused: boolean) {
    this.set('isWindowFocused', isWindowFocused);
  }

  setPrevFocusElement(prevFocusElement: HTMLElement | null) {
    this.set('prevFocusElement', prevFocusElement);
  }

  removeToast(toastId: string) {
    const toast = selectors.toast(this.state, toastId);
    toast?.onRemove?.();

    this.set(
      'toasts',
      selectors.toasts(this.state).filter((item) => item.id !== toastId),
    );
  }

  addToast<Data extends object>(toast: ToastManagerAddOptions<Data>): string {
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

      this.set(
        'toasts',
        updatedToasts.map((t) => {
          const limited = oldestActiveToasts.some((old) => old.id === t.id);
          if (t.limited !== limited) {
            return { ...t, limited };
          }
          return t;
        }),
      );
    } else {
      this.set(
        'toasts',
        updatedToasts.map((t) => ({ ...t, limited: false })),
      );
    }

    const duration = toastToAdd.timeout ?? timeout;
    if (toastToAdd.type !== 'loading' && duration > 0) {
      this.scheduleTimer(id, duration, () => this.closeToast(id));
    }

    if (selectors.expanded(this.state) || !this.state.isWindowFocused) {
      this.pauseTimers();
    }

    return id;
  }

  updateToast<Data extends object>(id: string, updates: ToastManagerUpdateOptions<Data>) {
    this.set(
      'toasts',
      this.state.toasts.map((toast) => (toast.id === id ? { ...toast, ...updates } : toast)),
    );
  }

  closeToast(toastId: string) {
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

    const updates: Partial<State> = { toasts: newToasts };
    if (newToasts.length === 0) {
      updates.hovering = false;
      updates.focused = false;
    }
    this.update(updates);
  }

  promiseToast<Value, Data extends object>(
    promiseValue: Promise<Value>,
    options: ToastManagerPromiseOptions<Value, Data>,
  ): Promise<Value> {
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

        if (selectors.expanded(this.state) || !this.state.isWindowFocused) {
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

        if (selectors.expanded(this.state) || !this.state.isWindowFocused) {
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
  }

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

  scheduleTimer(id: string, delay: number, callback: () => void) {
    const start = Date.now();

    const shouldStartActive = this.state.isWindowFocused && !selectors.expanded(this.state);

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

  restoreFocusToPrevElement() {
    this.state.prevFocusElement?.focus({ preventScroll: true });
  }

  private handleFocusManagement(toastId: string) {
    const { viewportRef } = this.state;
    const activeEl = activeElement(ownerDocument(viewportRef.current));
    if (
      !viewportRef.current ||
      !contains(viewportRef.current, activeEl) ||
      !isFocusVisible(activeEl)
    ) {
      return;
    }

    const toasts = selectors.toasts(this.state);
    const currentIndex = selectors.toastDOMIndex(this.state, toastId);
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
