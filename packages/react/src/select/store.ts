import { ReactStore } from '@base-ui/utils/store';
import { type InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
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
  items:
    | Record<string, React.ReactNode>
    | ReadonlyArray<{ label: React.ReactNode; value: any }>
    | ReadonlyArray<Group<any>>
    | undefined;
  itemToStringLabel: ((item: any) => string) | undefined;
  itemToStringValue: ((item: any) => string) | undefined;
  isItemEqualToValue: (itemValue: any, selectedValue: any) => boolean;
  /**
   * All logically mounted Select items.
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

  /**
   * Whether real focus stays on an element inside the popup while the list is navigated with
   * `aria-activedescendant` instead of roving DOM focus.
   */
  virtualFocus: boolean;

  popupProps: HTMLProps;
  triggerProps: HTMLProps;
  /**
   * Props for the element that holds real focus while `virtualFocus` is enabled.
   */
  inputProps: HTMLProps;
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
  isActive: (state: State, index: number) => state.activeIndex === index,
  virtualFocus: (state: State) => state.virtualFocus,
  inputProps: (state: State) => state.inputProps,

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
  triggerProps: (state: State) => state.triggerProps,
  triggerElement: (state: State) => state.triggerElement,
  positionerElement: (state: State) => state.positionerElement,
  listElement: (state: State) => state.listElement,
  popupSide: (state: State) => state.popupSide,

  scrollUpArrowVisible: (state: State) => state.scrollUpArrowVisible,
  scrollDownArrowVisible: (state: State) => state.scrollDownArrowVisible,

  hasScrollArrows: (state: State) => state.hasScrollArrows,
};

/** Guards against React 17, where the root id is undefined until an effect resolves it. */
export function suffixId(rootId: string | undefined, suffix: string | number) {
  return rootId != null ? `${rootId}-${suffix}` : undefined;
}
