import type { HTMLProps } from '../internals/types';
import { compareItemEquality } from '../internals/itemEquality';
import { hasNullItemLabel, stringifyAsValue } from '../internals/resolveValueLabel';
import type { Group } from '../internals/resolveValueLabel';
import { popupStoreSelectors } from '../utils/popups/store';
import type { SelectRoot } from './root/SelectRoot';
import { ValuePopupStore, valuePopupSelectors } from '../utils/popups/value-popup/ValuePopupStore';
import type {
  ValuePopupContext,
  ValuePopupState,
} from '../utils/popups/value-popup/ValuePopupStore';

export type State = ValuePopupState & {
  items:
    | Record<string, React.ReactNode>
    | ReadonlyArray<{ label: React.ReactNode; value: any }>
    | ReadonlyArray<Group<any>>
    | undefined;
  highlightItemOnHover: boolean;
  itemToStringValue: ((item: any) => string) | undefined;

  // Root values every item reads, combined so each item needs a single subscription for them.
  itemRoot: {
    props: HTMLProps;
    multiple: boolean;
    disabled: boolean;
    readOnly: boolean;
    isItemEqualToValue: (itemValue: any, selectedValue: any) => boolean;
  };
  listElement: HTMLDivElement | null;

  scrollUpArrowVisible: boolean;
  scrollDownArrowVisible: boolean;

  hasScrollArrows: boolean;
};

/**
 * Non-reactive values shared with the select parts. Nothing here is observable through
 * `selectors`, so writing to a ref never notifies subscribers.
 */
export type SelectStoreContext = ValuePopupContext<SelectRoot.OpenChangeEventDetails> & {
  readonly popupRef: React.RefObject<HTMLDivElement | null>;
  readonly scrollHandlerRef: React.RefObject<((element: HTMLDivElement) => void) | null>;
  readonly scrollArrowsMountedCountRef: React.RefObject<number>;
  readonly valueRef: React.RefObject<HTMLSpanElement | null>;
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

  // Callbacks. Initialized when the store is constructed and assigned during the root's
  // first render, so they are not `readonly`.
  isItemEqualToValue: State['isItemEqualToValue'];
  setValue: (nextValue: any, eventDetails: SelectRoot.ChangeEventDetails) => void;
  handleScrollArrowVisibility: (scroller: HTMLElement) => void;
};

export const selectors = {
  ...valuePopupSelectors,
  items: (state: State) => state.items,
  hasNullItemLabel: (state: State, enabled: boolean) =>
    enabled ? hasNullItemLabel(state.items) : false,
  multiple: (state: State) => state.selectionMode === 'multiple',
  highlightItemOnHover: (state: State) => state.highlightItemOnHover,

  hasSelectedValue: (state: State) => {
    const { selectedValue, itemToStringValue } = state;
    if (selectedValue == null) {
      return false;
    }
    if (state.selectionMode === 'multiple' && Array.isArray(selectedValue)) {
      return selectedValue.length > 0;
    }

    return stringifyAsValue(selectedValue, itemToStringValue) !== '';
  },

  // `open` is the effective open state, so a controlled `open` prop counts.
  isActiveWhileOpen: (state: State, index: number) =>
    popupStoreSelectors.open(state) && state.activeIndex === index,

  isSelected: (state: State, itemValue: any) => {
    const comparer = state.isItemEqualToValue;
    const selectedValue = state.selectedValue;

    if (state.selectionMode === 'multiple') {
      return (
        Array.isArray(selectedValue) &&
        selectedValue.some((selectedItem) => compareItemEquality(itemValue, selectedItem, comparer))
      );
    }

    // The value is the source of truth: a stale `selectedIndex` (e.g. the controlled
    // value changes while the popup is open, where the index sync is deferred) must not
    // keep a previously selected item marked as selected.
    return compareItemEquality(itemValue, selectedValue, comparer);
  },
  isSelectedByFocus: (state: State, index: number) => {
    return state.selectedIndex === index;
  },

  itemRoot: (state: State) => state.itemRoot,

  scrollUpArrowVisible: (state: State) => state.scrollUpArrowVisible,
  scrollDownArrowVisible: (state: State) => state.scrollDownArrowVisible,

  hasScrollArrows: (state: State) => state.hasScrollArrows,
};

export class SelectStore extends ValuePopupStore<
  State,
  SelectStoreContext,
  typeof selectors,
  SelectRoot.OpenChangeEventDetails
> {
  protected getAnchorElement(state: Readonly<State>) {
    return state.triggerElement;
  }

  protected prepareUnmount() {
    return {
      activeIndex: null,
      openMethod: null,
      instantType: undefined,
      scrollUpArrowVisible: false,
      scrollDownArrowVisible: false,
    };
  }
}
