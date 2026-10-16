import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import type { HTMLProps } from '../internals/types';
import type { Side } from '../internals/useAnchorPositioning';
import { compareItemEquality } from '../internals/itemEquality';
import { hasNullItemLabel, stringifyAsValue } from '../internals/resolveValueLabel';
import type { Group } from '../internals/resolveValueLabel';
import { REASONS } from '../internals/reasons';
import type { SelectRoot } from './root/SelectRoot';
import { BasePopupStore, popupStoreSelectors } from '../utils/popups/store';
import type { PopupStoreContext, PopupStoreState } from '../utils/popups/store';

export type State = PopupStoreState<unknown> & {
  id: string | undefined;
  labelId: string | undefined;
  modal: boolean;
  multiple: boolean;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  highlightItemOnHover: boolean;

  items:
    | Record<string, React.ReactNode>
    | ReadonlyArray<{ label: React.ReactNode; value: any }>
    | ReadonlyArray<Group<any>>
    | undefined;
  itemToStringLabel: ((item: any) => string) | undefined;
  itemToStringValue: ((item: any) => string) | undefined;
  isItemEqualToValue: (itemValue: any, selectedValue: any) => boolean;

  value: any;

  forceMount: boolean;
  openMethod: InteractionType | null;

  activeIndex: number | null;
  selectedIndex: number | null;

  // Root values every item reads, combined so each item needs a single subscription for them.
  itemRoot: {
    props: HTMLProps;
    multiple: boolean;
    disabled: boolean;
    readOnly: boolean;
    isItemEqualToValue: (itemValue: any, selectedValue: any) => boolean;
  };
  triggerElement: HTMLElement | null;
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
export type SelectStoreContext = PopupStoreContext<SelectRoot.OpenChangeEventDetails> & {
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
  handleScrollArrowVisibility: (scroller: HTMLElement) => void;
};

export const selectors = {
  ...popupStoreSelectors,
  id: (state: State) => state.id,
  labelId: (state: State) => state.labelId,
  modal: (state: State) => state.modal,
  multiple: (state: State) => state.multiple,
  disabled: (state: State) => state.disabled,
  readOnly: (state: State) => state.readOnly,
  required: (state: State) => state.required,
  highlightItemOnHover: (state: State) => state.highlightItemOnHover,

  items: (state: State) => state.items,
  itemToStringLabel: (state: State) => state.itemToStringLabel,
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

  forceMount: (state: State) => state.forceMount,
  openMethod: (state: State) => state.openMethod,

  activeIndex: (state: State) => state.activeIndex,
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

  itemRoot: (state: State) => state.itemRoot,
  triggerElement: (state: State) => state.triggerElement,
  listElement: (state: State) => state.listElement,
  // The select anchors to its trigger, which the Root keeps in `anchorElement`, rather than to the
  // trigger that opened it.
  anchor: (state: State) => state.anchorOverride ?? state.anchorElement,
  popupSide: (state: State) => state.popupSide,

  scrollUpArrowVisible: (state: State) => state.scrollUpArrowVisible,
  scrollDownArrowVisible: (state: State) => state.scrollDownArrowVisible,

  hasScrollArrows: (state: State) => state.hasScrollArrows,
};

export class SelectStore extends BasePopupStore<
  State,
  SelectStoreContext,
  typeof selectors,
  SelectRoot.OpenChangeEventDetails
> {
  private wasUnmountPrevented = () => false;

  protected isOpenChangeIgnored(
    nextOpen: boolean,
    eventDetails: SelectRoot.OpenChangeEventDetails,
  ) {
    // `actionsRef.close()` does nothing while the select is closed.
    return eventDetails.reason === REASONS.imperativeAction && !nextOpen && !this.select('open');
  }

  protected attachPreventUnmountOnClose(eventDetails: SelectRoot.OpenChangeEventDetails) {
    this.wasUnmountPrevented = super.attachPreventUnmountOnClose(eventDetails);
    return this.wasUnmountPrevented;
  }

  protected completeOpenChange(nextOpen: boolean) {
    // Each close decides on its own whether the popup stays mounted.
    if (!nextOpen) {
      this.set('preventUnmountingOnClose', this.wasUnmountPrevented());
    }
  }

  protected prepareUnmount() {
    return {
      activeIndex: null,
      openMethod: null,
      scrollUpArrowVisible: false,
      scrollDownArrowVisible: false,
    };
  }
}
