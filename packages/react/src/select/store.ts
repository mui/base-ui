import { Store, createSelector } from '@base-ui-components/utils/store';
import type { TransitionStatus } from '../utils/useTransitionStatus';
import type { HTMLProps } from '../utils/types';
import { compareItemEquality } from '../utils/itemEquality';
import { stringifyAsValue } from '../utils/resolveValueLabel';

export type State = {
  id: string | undefined;
  modal: boolean;
  multiple: boolean;

  items:
    | Record<string, React.ReactNode>
    | ReadonlyArray<{ label: React.ReactNode; value: any }>
    | undefined;
  itemToStringLabel: ((item: any) => string) | undefined;
  itemToStringValue: ((item: any) => string) | undefined;
  isItemEqualToValue: (item: any, value: any) => boolean;

  value: any;

  open: boolean;
  mounted: boolean;
  forceMount: boolean;
  transitionStatus: TransitionStatus;
  touchModality: boolean;

  activeIndex: number | null;
  selectedIndex: number | null;

  popupProps: HTMLProps;
  triggerProps: HTMLProps;
  triggerElement: HTMLElement | null;
  positionerElement: HTMLElement | null;
  listElement: HTMLDivElement | null;

  scrollUpArrowVisible: boolean;
  scrollDownArrowVisible: boolean;

  hasScrollArrows: boolean;
};

export type SelectStore = Store<State>;

export const selectors = {
  id: createSelector((state: State) => state.id),
  modal: createSelector((state: State) => state.modal),
  multiple: createSelector((state: State) => state.multiple),

  items: createSelector((state: State) => state.items),
  itemToStringLabel: createSelector((state: State) => state.itemToStringLabel),
  itemToStringValue: createSelector((state: State) => state.itemToStringValue),
  isItemEqualToValue: createSelector((state: State) => state.isItemEqualToValue),

  value: createSelector((state: State) => state.value),
  open: createSelector((state: State) => state.open),
  mounted: createSelector((state: State) => state.mounted),
  forceMount: createSelector((state: State) => state.forceMount),
  transitionStatus: createSelector((state: State) => state.transitionStatus),
  touchModality: createSelector((state: State) => state.touchModality),

  activeIndex: createSelector((state: State) => state.activeIndex),
  selectedIndex: createSelector((state: State) => state.selectedIndex),
  isActive: createSelector((state: State, index: number) => state.activeIndex === index),

  isSelected: createSelector((state: State, index: number, candidate: any) => {
    const comparer = state.isItemEqualToValue;
    const storeValue = state.value;

    if (state.multiple) {
      return (
        Array.isArray(storeValue) &&
        storeValue.some((item) => compareItemEquality(item, candidate, comparer))
      );
    }

    // `selectedIndex` is only updated after the items mount for the first time,
    // the value check avoids a re-render for the initially selected item.
    if (state.selectedIndex === index && state.selectedIndex !== null) {
      return true;
    }

    return compareItemEquality(storeValue, candidate, comparer);
  }),
  isSelectedByFocus: createSelector((state: State, index: number) => {
    return state.selectedIndex === index;
  }),

  popupProps: createSelector((state: State) => state.popupProps),
  triggerProps: createSelector((state: State) => state.triggerProps),
  triggerElement: createSelector((state: State) => state.triggerElement),
  positionerElement: createSelector((state: State) => state.positionerElement),
  listElement: createSelector((state: State) => state.listElement),

  scrollUpArrowVisible: createSelector((state: State) => state.scrollUpArrowVisible),
  scrollDownArrowVisible: createSelector((state: State) => state.scrollDownArrowVisible),

  hasScrollArrows: createSelector((state: State) => state.hasScrollArrows),

  serializedValue: createSelector((state: State) => {
    const { multiple, value, itemToStringValue } = state;
    if (multiple && Array.isArray(value) && value.length === 0) {
      return '';
    }
    return stringifyAsValue(value, itemToStringValue);
  }),
};
