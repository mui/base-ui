import { Store, createSelector } from '@base-ui/utils/store';
import { type InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import type { TransitionStatus } from '../internals/useTransitionStatus';
import type { HTMLProps } from '../internals/types';
import { compareItemEquality, findItemIndex } from '../internals/itemEquality';
import { type Group, hasNullItemLabel, stringifyAsValue } from '../internals/resolveValueLabel';

export type State = {
  id: string | undefined;
  labelId: string | undefined;
  modal: boolean;
  multiple: boolean;

  items:
    | Record<string, React.ReactNode>
    | ReadonlyArray<{ label: React.ReactNode; value: any }>
    | ReadonlyArray<Group<any>>
    | undefined;
  itemToStringLabel: ((item: any) => string) | undefined;
  itemToStringValue: ((item: any) => string) | undefined;
  isItemEqualToValue: (itemValue: any, selectedValue: any) => boolean;

  value: any;

  open: boolean;
  mounted: boolean;
  forceMount: boolean;
  transitionStatus: TransitionStatus;
  openMethod: InteractionType | null;

  activeIndex: number | null;
  itemValues: readonly any[];

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
  labelId: createSelector((state: State) => state.labelId),
  modal: createSelector((state: State) => state.modal),
  multiple: createSelector((state: State) => state.multiple),

  items: createSelector((state: State) => state.items),
  itemToStringLabel: createSelector((state: State) => state.itemToStringLabel),
  itemToStringValue: createSelector((state: State) => state.itemToStringValue),
  isItemEqualToValue: createSelector((state: State) => state.isItemEqualToValue),

  value: createSelector((state: State) => state.value),

  hasSelectedValue: createSelector((state: State) => {
    const { value, multiple, itemToStringValue } = state;
    if (value == null) {
      return false;
    }
    if (multiple && Array.isArray(value)) {
      return value.length > 0;
    }

    return stringifyAsValue(value, itemToStringValue) !== '';
  }),

  hasNullItemLabel: createSelector((state: State, enabled: boolean) => {
    return enabled ? hasNullItemLabel(state.items) : false;
  }),

  open: createSelector((state: State) => state.open),
  mounted: createSelector((state: State) => state.mounted),
  forceMount: createSelector((state: State) => state.forceMount),
  transitionStatus: createSelector((state: State) => state.transitionStatus),
  openMethod: createSelector((state: State) => state.openMethod),

  activeIndex: createSelector((state: State) => state.activeIndex),
  selectedIndex: createSelector(getSelectedIndex),
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

    return compareItemEquality(itemValue, storeValue, comparer);
  }),
  isSelectedByFocus: createSelector(
    (state: State, index: number) => getSelectedIndex(state) === index,
  ),

  popupProps: createSelector((state: State) => state.popupProps),
  triggerProps: createSelector((state: State) => state.triggerProps),
  triggerElement: createSelector((state: State) => state.triggerElement),
  positionerElement: createSelector((state: State) => state.positionerElement),
  listElement: createSelector((state: State) => state.listElement),

  scrollUpArrowVisible: createSelector((state: State) => state.scrollUpArrowVisible),
  scrollDownArrowVisible: createSelector((state: State) => state.scrollDownArrowVisible),

  hasScrollArrows: createSelector((state: State) => state.hasScrollArrows),
};

function getSelectedIndex(state: State) {
  const { value, itemValues, isItemEqualToValue } = state;
  let selectedValue = value;
  if (state.multiple) {
    if (!Array.isArray(value) || value.length === 0) {
      return null;
    }
    selectedValue = value[value.length - 1];
  }

  const index = findItemIndex(itemValues, selectedValue, isItemEqualToValue);
  return index === -1 ? null : index;
}
