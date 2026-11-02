import type * as React from 'react';
import { ReactStore, createSelector } from '@base-ui/utils/store';
import { compareItemEquality } from '../internals/itemEquality';
import type { ListboxRoot } from './root/ListboxRoot';

export type State = {
  id: string | undefined;
  labelId: string | undefined;
  /** `'opt-in'` when pressing an item without a modifier replaces the selection. */
  multiple: boolean | 'opt-in';

  isItemEqualToValue: (itemValue: any, selectedValue: any) => boolean;

  /** The selected values. An array even when `multiple` is `false`. */
  value: any[];

  activeIndex: number | null;

  listElement: HTMLElement | null;

  orientation: 'vertical' | 'horizontal';

  disabled: boolean;
  highlightItemOnHover: boolean;
};

export type Context = {
  valuesRef: React.RefObject<Array<any>>;
  labelsRef: React.RefObject<Array<string | null>>;
  disabledItemsRef: React.RefObject<Array<boolean | undefined>>;
  typingRef: React.RefObject<boolean>;
  lastSelectedIndexRef: React.RefObject<number | null>;
  setValue: (nextValue: any, eventDetails: ListboxRoot.ChangeEventDetails) => void;
  /** The event that caused the current `activeIndex` update, read by `onItemHighlighted`. */
  highlightEvent: Event | undefined;
};

export const selectors = {
  id: createSelector((state: State) => state.id),
  labelId: createSelector((state: State) => state.labelId),
  multiple: createSelector((state: State) => state.multiple),

  isItemEqualToValue: createSelector((state: State) => state.isItemEqualToValue),

  value: createSelector((state: State) => state.value),

  activeIndex: createSelector((state: State) => state.activeIndex),
  isActive: createSelector((state: State, index: number) => state.activeIndex === index),

  // Value is always an array now, so isSelected always does array membership check.
  isSelected: createSelector((state: State, index: number, itemValue: any) => {
    const comparer = state.isItemEqualToValue;
    const storeValue = state.value;

    return (
      Array.isArray(storeValue) &&
      storeValue.some((selectedItem) => compareItemEquality(itemValue, selectedItem, comparer))
    );
  }),

  listElement: createSelector((state: State) => state.listElement),

  orientation: createSelector((state: State) => state.orientation),

  disabled: createSelector((state: State) => state.disabled),
  highlightItemOnHover: createSelector((state: State) => state.highlightItemOnHover),
};

export class ListboxStore extends ReactStore<Readonly<State>, Context, typeof selectors> {
  constructor(initialState?: Partial<State>, context?: Partial<Context>) {
    super(
      { ...createInitialState(), ...initialState },
      { ...createInitialContext(), ...context },
      selectors,
    );
  }

  /**
   * Sets the highlighted index and records the event that caused it,
   * so `onItemHighlighted` can report the reason.
   */
  setActiveIndex(index: number | null, event?: Event) {
    this.context.highlightEvent = event;
    this.set('activeIndex', index);
    this.context.highlightEvent = undefined;
  }
}

function createInitialState(): State {
  return {
    id: undefined,
    labelId: undefined,
    multiple: false,
    isItemEqualToValue: Object.is,
    value: [],
    activeIndex: null,
    listElement: null,
    orientation: 'vertical',
    disabled: false,
    highlightItemOnHover: true,
  };
}

function createInitialContext(): Context {
  return {
    valuesRef: { current: [] },
    labelsRef: { current: [] },
    disabledItemsRef: { current: [] },
    typingRef: { current: false },
    lastSelectedIndexRef: { current: null },
    setValue: () => {},
    highlightEvent: undefined,
  };
}
