import { ReactStore } from '@base-ui/utils/store';
import { type InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import type { TransitionStatus } from '../internals/useTransitionStatus';
import type { HTMLProps } from '../internals/types';
import type { Side } from '../internals/useAnchorPositioning';
import { compareItemEquality } from '../internals/itemEquality';
import { type Group, hasNullItemLabel, stringifyAsValue } from '../internals/resolveValueLabel';
import type { ListVirtualizationRegistry } from '../internals/virtualization/ListVirtualizationRegistry';
import type { SelectRoot } from './root/SelectRoot';

export type State = {
  id: string | undefined;
  labelId: string | undefined;
  modal: boolean;
  multiple: boolean;

  items:
    | Record<string, React.ReactNode>
    | ReadonlyArray<{ label: React.ReactNode; value: any }>
    | ReadonlyArray<Group<any>>
    | ReadonlyArray<unknown>
    | undefined;
  itemToStringLabel: ((item: any) => string) | undefined;
  itemToStringValue: ((item: any) => string) | undefined;
  isItemDisabled: ((itemValue: any, index: number) => boolean) | undefined;
  isItemEqualToValue: (itemValue: any, selectedValue: any) => boolean;

  value: any;

  open: boolean;
  mounted: boolean;
  forceMount: boolean;
  transitionStatus: TransitionStatus;
  openMethod: InteractionType | null;

  activeIndex: number | null;
  /**
   * What moved the highlight to `activeIndex`. A pointer highlight must not scroll the list: the
   * cursor is already on the item, and scrolling would slide a different one under it.
   */
  highlightType: 'keyboard' | 'pointer' | 'none';
  selectedIndex: number | null;

  popupProps: HTMLProps;
  triggerProps: HTMLProps;
  triggerElement: HTMLElement | null;
  positionerElement: HTMLElement | null;
  listElement: HTMLDivElement | null;
  popupSide: Side | null;

  scrollUpArrowVisible: boolean;
  scrollDownArrowVisible: boolean;

  hasScrollArrows: boolean;
};

/**
 * Non-reactive values shared with the select parts. Nothing here is observable through
 * `selectors`, so writing to a ref never notifies subscribers.
 */
export type SelectStoreContext = {
  /**
   * Part namespace of the public component, so diagnostics name the parts the reader has.
   */
  readonly componentName: string;
  /**
   * Coordinates the built-in virtualizer with the rest of the list.
   */
  readonly virtualizationRegistry: ListVirtualizationRegistry;
  /**
   * Whether the last interaction with the list came from the keyboard. Read when the highlight
   * moves, to tell a keypress apart from the pointer passing over an item.
   */
  readonly keyboardActiveRef: React.RefObject<boolean>;
  readonly listRef: React.RefObject<Array<HTMLElement | null>>;
  readonly popupRef: React.RefObject<HTMLDivElement | null>;
  readonly scrollHandlerRef: React.RefObject<((element: HTMLDivElement) => void) | null>;
  readonly scrollArrowsMountedCountRef: React.RefObject<number>;
  readonly valueRef: React.RefObject<HTMLSpanElement | null>;
  readonly valuesRef: React.RefObject<Array<any>>;
  readonly labelsRef: React.RefObject<Array<string | null>>;
  readonly typingRef: React.RefObject<boolean>;
  readonly selectionRef: React.RefObject<{
    allowUnselectedMouseUp: boolean;
    allowSelectedMouseUp: boolean;
    dragY: number;
  }>;
  readonly firstItemTextRef: React.RefObject<HTMLElement | null>;
  readonly selectedItemTextRef: React.RefObject<HTMLElement | null>;
  readonly alignItemWithTriggerActiveRef: React.RefObject<boolean>;
  readonly initialValueRef: React.RefObject<any>;

  // Commands. Seeded with `NOOP` when the store is constructed and assigned during the root's
  // first render, so they are not `readonly`.
  setValue: (nextValue: any, eventDetails: SelectRoot.ChangeEventDetails) => void;
  setOpen: (open: boolean, eventDetails: SelectRoot.ChangeEventDetails) => void;
  /**
   * Moves the highlight and records what moved it, in a single update.
   *
   * Writing the two separately would briefly expose the new index against the previous reason,
   * which is exactly the disagreement the reason exists to prevent.
   */
  setActiveIndex: (activeIndex: number | null, highlightType: State['highlightType']) => void;
  handleScrollArrowVisibility: (scroller: HTMLElement) => void;
  onOpenChangeComplete: (open: boolean) => void;
};

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
  popupSide: (state: State) => state.popupSide,

  scrollUpArrowVisible: (state: State) => state.scrollUpArrowVisible,
  scrollDownArrowVisible: (state: State) => state.scrollDownArrowVisible,

  hasScrollArrows: (state: State) => state.hasScrollArrows,
};

export type SelectStore = ReactStore<State, SelectStoreContext, typeof selectors>;
