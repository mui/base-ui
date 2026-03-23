import { Store, createSelector } from '@base-ui/utils/store';
import { compareItemEquality } from '../utils/itemEquality';

export type State = {
  id: string | undefined;
  labelId: string | undefined;
  multiple: boolean;

  itemToStringLabel: ((item: any) => string) | undefined;
  itemToStringValue: ((item: any) => string) | undefined;
  isItemEqualToValue: (itemValue: any, selectedValue: any) => boolean;

  value: any;

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
  readOnly: boolean;
};

export type ListboxStore = Store<State>;

export const selectors = {
  id: createSelector((state: State) => state.id),
  labelId: createSelector((state: State) => state.labelId),
  multiple: createSelector((state: State) => state.multiple),

  itemToStringLabel: createSelector((state: State) => state.itemToStringLabel),
  itemToStringValue: createSelector((state: State) => state.itemToStringValue),
  isItemEqualToValue: createSelector((state: State) => state.isItemEqualToValue),

  value: createSelector((state: State) => state.value),

  activeIndex: createSelector((state: State) => state.activeIndex),
  selectedIndex: createSelector((state: State) => state.selectedIndex),
  isActive: createSelector((state: State, index: number) => state.activeIndex === index),

  isSelected: createSelector((state: State, index: number, itemValue: any) => {
    const comparer = state.isItemEqualToValue;
    const storeValue = state.value;

    if (state.multiple) {
      return (
        Array.isArray(storeValue) &&
        storeValue.some((selectedItem) => compareItemEquality(itemValue, selectedItem, comparer))
      );
    }

    if (state.selectedIndex === index && state.selectedIndex !== null) {
      return true;
    }

    return compareItemEquality(itemValue, storeValue, comparer);
  }),

  listElement: createSelector((state: State) => state.listElement),

  dragActiveIndex: createSelector((state: State) => state.dragActiveIndex),
  dropTargetIndex: createSelector((state: State) => state.dropTargetIndex),
  isDragging: createSelector((state: State, index: number) => state.dragActiveIndex === index),
  isDropTarget: createSelector((state: State, index: number) => state.dropTargetIndex === index),

  loading: createSelector((state: State) => state.loading),

  orientation: createSelector((state: State) => state.orientation),

  disabled: createSelector((state: State) => state.disabled),
  readOnly: createSelector((state: State) => state.readOnly),
};
