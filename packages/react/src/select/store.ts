import { ReactStore } from '@base-ui/utils/store';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import type { TransitionStatus } from '../internals/useTransitionStatus';
import type { HTMLProps } from '../internals/types';
import type { Side } from '../internals/useAnchorPositioning';
import { compareItemEquality } from '../internals/itemEquality';
import { hasNullItemLabel, stringifyAsValue } from '../internals/resolveValueLabel';
import type { Group } from '../internals/resolveValueLabel';
import type { SelectRoot } from './root/SelectRoot';
import type {
  PopupInteractionContext,
  PositioningInteractionStore,
  ReferenceType,
} from '../utils/popups/types';
import type { BaseUIChangeEventDetails } from '../internals/createBaseUIEventDetails';
import { dispatchOpenChange } from '../utils/popups/floating-root/dispatchOpenChange';

export type State = {
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

  open: boolean;
  mounted: boolean;
  forceMount: boolean;
  transitionStatus: TransitionStatus;
  openMethod: InteractionType | null;

  activeIndex: number | null;
  selectedIndex: number | null;

  popupProps: HTMLProps;
  triggerProps: HTMLProps;
  // Root values every item reads, combined so each item needs a single subscription for them.
  itemRoot: {
    props: HTMLProps;
    multiple: boolean;
    disabled: boolean;
    readOnly: boolean;
    isItemEqualToValue: (itemValue: any, selectedValue: any) => boolean;
  };
  triggerElement: HTMLElement | null;
  positionerElement: HTMLElement | null;
  listElement: HTMLDivElement | null;
  /**
   * The element the interaction hooks treat as the anchor. It follows the trigger while the popup
   * is mounted, and is cleared once a closed popup stops positioning.
   */
  anchorElement: Element | null;
  /**
   * An anchor set explicitly by an interaction hook, which takes precedence over `anchorElement`.
   */
  anchorOverride: ReferenceType | null;
  /**
   * The popup's id unless its element sets one.
   */
  defaultPopupId: string | undefined;
  popupSide: Side | null;

  scrollUpArrowVisible: boolean;
  scrollDownArrowVisible: boolean;

  hasScrollArrows: boolean;
};

/**
 * Non-reactive values shared with the select parts. Nothing here is observable through
 * `selectors`, so writing to a ref never notifies subscribers.
 */
export type SelectStoreContext = PopupInteractionContext & {
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

  // Callbacks. Initialized when the store is constructed and assigned during the root's
  // first render, so they are not `readonly`.
  isItemEqualToValue: State['isItemEqualToValue'];
  setValue: (nextValue: any, eventDetails: SelectRoot.ChangeEventDetails) => void;
  /**
   * Applies an open change the interaction hooks have heard about. Call `store.setOpen` instead.
   */
  onOpenChange: (open: boolean, eventDetails: SelectRoot.ChangeEventDetails) => void;
  handleScrollArrowVisibility: (scroller: HTMLElement) => void;
  onOpenChangeComplete: (open: boolean) => void;
};

export const selectors = {
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

  open: (state: State) => state.open,
  mounted: (state: State) => state.mounted,
  forceMount: (state: State) => state.forceMount,
  transitionStatus: (state: State) => state.transitionStatus,
  openMethod: (state: State) => state.openMethod,

  activeIndex: (state: State) => state.activeIndex,
  selectedIndex: (state: State) => state.selectedIndex,
  isActive: (state: State, index: number) => state.activeIndex === index,
  isActiveWhileOpen: (state: State, index: number) => state.open && state.activeIndex === index,

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
  itemRoot: (state: State) => state.itemRoot,
  triggerElement: (state: State) => state.triggerElement,
  positionerElement: (state: State) => state.positionerElement,
  listElement: (state: State) => state.listElement,
  anchorElement: (state: State) => state.anchorElement,
  anchor: (state: State) => state.anchorOverride ?? state.anchorElement,
  defaultPopupId: (state: State) => state.defaultPopupId,
  popupSide: (state: State) => state.popupSide,

  scrollUpArrowVisible: (state: State) => state.scrollUpArrowVisible,
  scrollDownArrowVisible: (state: State) => state.scrollDownArrowVisible,

  hasScrollArrows: (state: State) => state.hasScrollArrows,
};

export class SelectStore
  extends ReactStore<State, SelectStoreContext, typeof selectors>
  implements PositioningInteractionStore
{
  /**
   * Requests an open change: the interaction hooks hear about it first, then the Root applies it.
   */
  setOpen = (open: boolean, eventDetails: BaseUIChangeEventDetails<string>) => {
    dispatchOpenChange(this.context, this.state.open, open, eventDetails);
    this.context.onOpenChange(open, eventDetails as SelectRoot.ChangeEventDetails);
  };

  /**
   * Forgets the anchor while the popup isn't mounted, so positioning doesn't run for a closed
   * popup that stays in the DOM.
   */
  clearPositioning() {
    this.update({ anchorElement: null, anchorOverride: null });
  }
}
