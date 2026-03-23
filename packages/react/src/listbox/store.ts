import { Store, createSelector } from '@base-ui/utils/store';
import { compareItemEquality } from '../utils/itemEquality';
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
  selectedIndex: number | null;

  listElement: HTMLElement | null;

  // DnD state
  dragActiveIndex: number | null;
  dropTargetIndex: number | null;

  // Loading state
  loading: boolean;

  orientation: 'vertical' | 'horizontal';

  disabled: boolean;
};

export type ListboxStore = Store<State>;

export const selectors = {
  id: createSelector((state: State) => state.id),
  labelId: createSelector((state: State) => state.labelId),
  selectionMode: createSelector((state: State) => state.selectionMode),

  itemToStringLabel: createSelector((state: State) => state.itemToStringLabel),
  itemToStringValue: createSelector((state: State) => state.itemToStringValue),
  isItemEqualToValue: createSelector((state: State) => state.isItemEqualToValue),

  value: createSelector((state: State) => state.value),

  activeIndex: createSelector((state: State) => state.activeIndex),
  selectedIndex: createSelector((state: State) => state.selectedIndex),
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

  dragActiveIndex: createSelector((state: State) => state.dragActiveIndex),
  dropTargetIndex: createSelector((state: State) => state.dropTargetIndex),
  isDragging: createSelector((state: State, index: number) => state.dragActiveIndex === index),
  isDropTarget: createSelector((state: State, index: number) => state.dropTargetIndex === index),

  loading: createSelector((state: State) => state.loading),

  orientation: createSelector((state: State) => state.orientation),

  disabled: createSelector((state: State) => state.disabled),
};
