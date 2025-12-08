import { Store, createSelector, createSelectorMemoized } from '@base-ui-components/utils/store';
import { ToastObject } from './useToastManager';

export type State = {
  toasts: ToastObject<any>[];
};

export type ToastStore = Store<State>;

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
};
