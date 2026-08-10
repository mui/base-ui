import { ReactStore } from '@base-ui/utils/store';
import { type InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import type { SelectFilterIntegration } from './root/SelectFilterIntegrationContext';
import type { TransitionStatus } from '../internals/useTransitionStatus';
import type { HTMLProps } from '../internals/types';
import type { Side } from '../internals/useAnchorPositioning';
import { compareItemEquality } from '../internals/itemEquality';
import { type Group, hasNullItemLabel, stringifyAsValue } from '../internals/resolveValueLabel';

export interface RegisteredItem {
  getValue: () => any;
  getLabel: () => string | undefined;
  getTextElement: () => HTMLElement | null;
}

export interface SelectItemMetadata {
  registrationId: symbol;
}

export type State = {
  id: string | undefined;
  labelId: string | undefined;
  modal: boolean;
  multiple: boolean;
  filterable: boolean;
  /** Filtering parts supplied by the `filterable-select` entrypoint, or null for an ordinary select. */
  filterIntegration: SelectFilterIntegration | null;

  items:
    | Record<string, React.ReactNode>
    | ReadonlyArray<{ label: React.ReactNode; value: any }>
    | ReadonlyArray<Group<any>>
    | undefined;
  itemToStringLabel: ((item: any) => string) | undefined;
  itemToStringValue: ((item: any) => string) | undefined;
  isItemEqualToValue: (itemValue: any, selectedValue: any) => boolean;
  /**
   * All logically mounted Select items, including items hidden by filtering.
   */
  registeredItems: ReadonlyMap<symbol, RegisteredItem>;
  /**
   * Composite indexes for the items currently rendered in the list.
   */
  visibleItemIndexes: ReadonlyMap<symbol, number>;

  value: any;

  open: boolean;
  mounted: boolean;
  forceMount: boolean;
  transitionStatus: TransitionStatus;
  openMethod: InteractionType | null;

  activeIndex: number | null;
  selectionReferenceItemId: symbol | null;
  inputFocusVisible: boolean;

  popupProps: HTMLProps;
  inputProps: HTMLProps;
  triggerProps: HTMLProps;
  triggerElement: HTMLElement | null;
  positionerElement: HTMLElement | null;
  listElement: HTMLDivElement | null;
  popupSide: Side | null;

  scrollUpArrowVisible: boolean;
  scrollDownArrowVisible: boolean;

  hasScrollArrows: boolean;
};

export type SelectStore = ReactStore<State>;

export const selectors = {
  id: (state: State) => state.id,
  labelId: (state: State) => state.labelId,
  modal: (state: State) => state.modal,
  multiple: (state: State) => state.multiple,
  filterable: (state: State) => state.filterable,
  filterIntegration: (state: State) => state.filterIntegration,

  items: (state: State) => state.items,
  itemToStringLabel: (state: State) => state.itemToStringLabel,
  isItemEqualToValue: (state: State) => state.isItemEqualToValue,
  registeredItems: (state: State) => state.registeredItems,
  visibleItemIndexes: (state: State) => state.visibleItemIndexes,

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
  selectionReferenceItemId: (state: State) => state.selectionReferenceItemId,
  inputFocusVisible: (state: State) => state.inputFocusVisible,
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

    // The value is the source of truth. The selection reference ID only identifies the item used
    // for navigation and positioning.
    return compareItemEquality(itemValue, storeValue, comparer);
  },

  popupProps: (state: State) => state.popupProps,
  inputProps: (state: State) => state.inputProps,
  triggerProps: (state: State) => state.triggerProps,
  triggerElement: (state: State) => state.triggerElement,
  positionerElement: (state: State) => state.positionerElement,
  listElement: (state: State) => state.listElement,
  popupSide: (state: State) => state.popupSide,

  scrollUpArrowVisible: (state: State) => state.scrollUpArrowVisible,
  scrollDownArrowVisible: (state: State) => state.scrollDownArrowVisible,

  hasScrollArrows: (state: State) => state.hasScrollArrows,
};
