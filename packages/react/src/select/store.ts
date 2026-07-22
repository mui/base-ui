import { ReactStore } from '@base-ui/utils/store';
import { type InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import type { TransitionStatus } from '../internals/useTransitionStatus';
import type { HTMLProps } from '../internals/types';
import type { Side } from '../utils/useAnchorPositioning';
import { compareItemEquality } from '../internals/itemEquality';
import { type Group, hasNullItemLabel, stringifyAsValue } from '../internals/resolveValueLabel';
import type { ListVirtualizationRegistry } from '../internals/virtualization/ListVirtualizationRegistry';

export type HighlightType = 'none' | 'keyboard' | 'pointer';

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
  isItemDisabled: ((item: any, index: number) => boolean) | undefined;
  isItemEqualToValue: (itemValue: any, selectedValue: any) => boolean;

  value: any;

  open: boolean;
  mounted: boolean;
  forceMount: boolean;
  transitionStatus: TransitionStatus;
  openMethod: InteractionType | null;

  activeIndex: number | null;
  highlightType: HighlightType;
  selectedIndex: number | null;

  popupProps: HTMLProps;
  triggerProps: HTMLProps;
  triggerElement: HTMLElement | null;
  positionerElement: HTMLElement | null;
  listElement: HTMLDivElement | null;
  virtualizerElement: HTMLDivElement | null;
  popupSide: Side | null;

  scrollUpArrowVisible: boolean;
  scrollDownArrowVisible: boolean;

  hasScrollArrows: boolean;
  virtualizationRegistry: ListVirtualizationRegistry;
};

export type SelectStore = ReactStore<State>;

export const selectors = {
  id: (state: State) => state.id,
  labelId: (state: State) => state.labelId,
  modal: (state: State) => state.modal,

  items: (state: State) => state.items,
  itemToStringLabel: (state: State) => state.itemToStringLabel,
  isItemDisabled: (state: State) => state.isItemDisabled,
  isItemEqualToValue: (state: State) => state.isItemEqualToValue,

  value: (state: State) => state.value,

  hasSelectedValue: (state: State) => {
    const { value, multiple, itemToStringValue } = state;
    if (value == null) {
      return false;
    }
    if (multiple && Array.isArray(value)) {
      return value.length > 0;
    }

    return stringifyAsValue(value, itemToStringValue) !== '';
  },

  hasNullItemLabel: (state: State, enabled: boolean) => {
    return enabled ? hasNullItemLabel(state.items) : false;
  },

  open: (state: State) => state.open,
  mounted: (state: State) => state.mounted,
  forceMount: (state: State) => state.forceMount,
  transitionStatus: (state: State) => state.transitionStatus,
  openMethod: (state: State) => state.openMethod,

  activeIndex: (state: State) => state.activeIndex,
  highlightType: (state: State) => state.highlightType,
  selectedIndex: (state: State) => state.selectedIndex,
  isActive: (state: State, index: number) => state.activeIndex === index,

  isSelected: (state: State, itemValue: any) => {
    const comparer = state.isItemEqualToValue;
    const storeValue = state.value;

    if (state.multiple) {
      return (
        Array.isArray(storeValue) &&
        storeValue.some((selectedItem) => compareItemEquality(itemValue, selectedItem, comparer))
      );
    }

    // The value is the source of truth: a stale `selectedIndex` (e.g. the controlled
    // value changes while the popup is open, where the index sync is deferred) must not
    // keep a previously selected item marked as selected.
    return compareItemEquality(itemValue, storeValue, comparer);
  },
  isSelectedByFocus: (state: State, index: number) => {
    return state.selectedIndex === index;
  },

  popupProps: (state: State) => state.popupProps,
  triggerProps: (state: State) => state.triggerProps,
  triggerElement: (state: State) => state.triggerElement,
  positionerElement: (state: State) => state.positionerElement,
  listElement: (state: State) => state.listElement,
  virtualizerElement: (state: State) => state.virtualizerElement,
  popupSide: (state: State) => state.popupSide,

  scrollUpArrowVisible: (state: State) => state.scrollUpArrowVisible,
  scrollDownArrowVisible: (state: State) => state.scrollDownArrowVisible,

  hasScrollArrows: (state: State) => state.hasScrollArrows,
};
