import * as React from 'react';
import { ReactStore, createSelector } from '@base-ui/utils/store';
import { compareItemEquality } from '../utils/itemEquality';
import type { UseFieldValidationReturnValue } from '../field/root/useFieldValidation';
import type { ListboxRoot } from './root/ListboxRoot';
import type { SelectionMode } from './utils/selectionReducer';

export type State = {
  id: string | undefined;
  labelId: string | undefined;
  selectionMode: SelectionMode;

  itemToStringLabel: ((item: any) => string) | undefined;
  itemToStringValue: ((item: any) => string) | undefined;
  isItemEqualToValue: (itemValue: any, selectedValue: any) => boolean;

  /** Always an array, regardless of selection mode. */
  value: any[];

  activeIndex: number | null;

  listElement: HTMLElement | null;

  // DnD state
  /** Indices of all items currently being dragged (multi-select drags all selected items). */
  dragActiveIndices: number[] | null;
  dropTargetIndex: number | null;

  // Loading state
  loading: boolean;
  loadingProp: boolean;
  hasOnLoadMore: boolean;

  orientation: 'vertical' | 'horizontal';

  disabled: boolean;
  name: string | undefined;
  required: boolean;
  loopFocus: boolean;
  highlightItemOnHover: boolean;
};

export type Context = {
  valuesRef: React.RefObject<Array<any>>;
  labelsRef: React.RefObject<Array<string | null>>;
  disabledItemsRef: React.RefObject<Array<boolean | undefined>>;
  groupIdsRef: React.RefObject<Array<string | undefined>>;
  typingRef: React.RefObject<boolean>;
  lastSelectedIndexRef: React.RefObject<number | null>;
  lastPointerTypeRef: React.RefObject<string | null>;
  pointerMoveSuppressedRef: React.RefObject<boolean>;
  validation: UseFieldValidationReturnValue;
  setValue: (nextValue: any, eventDetails: ListboxRoot.ChangeEventDetails) => void;
  requestHighlightReconcile: () => void;
  onItemsReorder:
    | ((event: {
        items: any[];
        referenceItem: any;
        edge: 'before' | 'after';
        reason: 'drag' | 'keyboard';
      }) => void)
    | undefined;
  onLoadMore: (() => void) | undefined;
};

export const selectors = {
  id: createSelector((state: State) => state.id),
  labelId: createSelector((state: State) => state.labelId),
  selectionMode: createSelector((state: State) => state.selectionMode),

  itemToStringLabel: createSelector((state: State) => state.itemToStringLabel),
  itemToStringValue: createSelector((state: State) => state.itemToStringValue),
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

  dragActiveIndices: createSelector((state: State) => state.dragActiveIndices),
  dropTargetIndex: createSelector((state: State) => state.dropTargetIndex),
  isDragging: createSelector(
    (state: State, index: number) =>
      state.dragActiveIndices != null && state.dragActiveIndices.includes(index),
  ),
  isDropTarget: createSelector((state: State, index: number) => state.dropTargetIndex === index),

  loading: createSelector((state: State) => state.loading),
  loadingProp: createSelector((state: State) => state.loadingProp),
  hasOnLoadMore: createSelector((state: State) => state.hasOnLoadMore),

  orientation: createSelector((state: State) => state.orientation),

  disabled: createSelector((state: State) => state.disabled),
  name: createSelector((state: State) => state.name),
  required: createSelector((state: State) => state.required),
  loopFocus: createSelector((state: State) => state.loopFocus),
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
}

function createInitialState(): State {
  return {
    id: undefined,
    labelId: undefined,
    selectionMode: 'single',
    itemToStringLabel: undefined,
    itemToStringValue: undefined,
    isItemEqualToValue: Object.is,
    value: [],
    activeIndex: null,
    listElement: null,
    dragActiveIndices: null,
    dropTargetIndex: null,
    loading: false,
    loadingProp: false,
    hasOnLoadMore: false,
    orientation: 'vertical',
    disabled: false,
    name: undefined,
    required: false,
    loopFocus: true,
    highlightItemOnHover: true,
  };
}

function createInitialContext(): Context {
  return {
    valuesRef: { current: [] },
    labelsRef: { current: [] },
    disabledItemsRef: { current: [] },
    groupIdsRef: { current: [] },
    typingRef: { current: false },
    lastSelectedIndexRef: { current: null },
    lastPointerTypeRef: { current: null },
    pointerMoveSuppressedRef: { current: false },
    validation: {
      getValidationProps: (props = {}) => props,
      getInputValidationProps: (props = {}) => props,
      inputRef: { current: null },
      commit: async () => {},
    },
    setValue: () => {},
    requestHighlightReconcile: () => {},
    onItemsReorder: undefined,
    onLoadMore: undefined,
  };
}
