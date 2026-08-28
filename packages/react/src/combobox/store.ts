import { ReactStore } from '@base-ui/utils/store';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import type { TransitionStatus } from '../internals/useTransitionStatus';
import type { HTMLProps } from '../internals/types';
import type { Side } from '../internals/useAnchorPositioning';
import { compareItemEquality } from '../internals/itemEquality';
import { hasNullItemLabel } from '../internals/resolveValueLabel';
import type { AriaCombobox } from './root/AriaCombobox';
import type { ListVirtualizationRegistry } from '../internals/virtualization/ListVirtualizationRegistry';

export type State = {
  id: string | undefined;
  labelId: string | undefined;

  items: readonly any[] | undefined;

  selectedValue: any;

  open: boolean;
  mounted: boolean;
  transitionStatus: TransitionStatus;
  forceMounted: boolean;

  inline: boolean;

  activeIndex: number | null;
  highlightType: AriaCombobox.HighlightEventReason;
  selectedIndex: number | null;

  popupProps: HTMLProps;
  listProps: HTMLProps;
  inputProps: HTMLProps;
  triggerProps: HTMLProps;
  itemProps: HTMLProps;

  positionerElement: HTMLElement | null;
  listElement: HTMLElement | null;
  popupId: string | undefined;
  triggerElement: HTMLElement | null;
  inputElement: HTMLInputElement | null;
  inputGroupElement: HTMLDivElement | null;
  popupSide: Side | null;

  openMethod: InteractionType | null;

  inputInsidePopup: boolean;
  inputOwnsFormValue: boolean;

  selectionMode: 'single' | 'multiple' | 'none';

  name: string | undefined;
  form: string | undefined;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  grid: boolean;
  externallyVirtualized: boolean;
  /**
   * Whether every item is temporarily mounted so browser autofill can read their rendered labels.
   * Published across the virtualization seam as `windowingSuspended`.
   */
  renderAllRows: boolean;
  openOnInputClick: boolean;
  itemToStringLabel?: ((item: any) => string) | undefined;
  isItemDisabled?: ((item: any, index: number) => boolean) | undefined;
  isItemEqualToValue: (itemValue: any, selectedValue: any) => boolean;
  modal: boolean;
  autoHighlight: false | 'always' | 'input-change';
  submitOnItemClick: boolean;
  hasInputValue: boolean;
};

/**
 * Non-reactive values shared with the combobox parts. Nothing here is observable through
 * `selectors`, so writing to a ref never notifies subscribers.
 */
export type ComboboxStoreContext = {
  /** Coordinates the built-in virtualizer with the items rendered outside it. */
  readonly virtualizationRegistry: ListVirtualizationRegistry;
  /** Item elements in list order, owned by `Combobox.List`. */
  readonly listRef: React.RefObject<Array<HTMLElement | null>>;
  /** Item text labels in list order, used for typeahead. */
  readonly labelsRef: React.RefObject<Array<string | null>>;
  /** The popup element. */
  readonly popupRef: React.RefObject<HTMLDivElement | null>;
  /** The empty-state element. */
  readonly emptyRef: React.RefObject<HTMLDivElement | null>;
  /** The input element that owns the combobox role. */
  readonly inputRef: React.RefObject<HTMLInputElement | null>;
  /** Internal dismiss button rendered before the popup content. */
  readonly startDismissRef: React.RefObject<HTMLSpanElement | null>;
  /** Internal dismiss button rendered after the popup content. */
  readonly endDismissRef: React.RefObject<HTMLSpanElement | null>;
  /** Whether the last interaction came from the keyboard. */
  readonly keyboardActiveRef: React.RefObject<boolean>;
  /** Container holding the selection chips. */
  readonly chipsContainerRef: React.RefObject<HTMLDivElement | null>;
  /** The clear button. */
  readonly clearRef: React.RefObject<HTMLButtonElement | null>;
  /** Item values in list order. */
  readonly valuesRef: React.RefObject<Array<any>>;
  /** Item element that received the last pointerdown, to pair it with a mouseup. */
  readonly pointerDownItemRef: React.RefObject<Element | null>;
  /** Native event that triggered the in-flight selection. */
  readonly selectionEventRef: React.RefObject<MouseEvent | PointerEvent | KeyboardEvent | null>;

  // Commands. Seeded with `NOOP` when the store is constructed and assigned during the root's
  // first render, so they are not `readonly`.

  /** Opens or closes the popup. */
  setOpen: (open: boolean, eventDetails: AriaCombobox.ChangeEventDetails) => void;
  /** Sets the input value. */
  setInputValue: (value: string, eventDetails: AriaCombobox.ChangeEventDetails) => void;
  /** Sets the selected value. */
  setSelectedValue: (value: any, eventDetails: AriaCombobox.ChangeEventDetails) => void;
  /** Sets the active and/or selected index. */
  setIndices: (indices: {
    activeIndex?: number | null | undefined;
    selectedIndex?: number | null | undefined;
    type?: AriaCombobox.HighlightEventReason | undefined;
  }) => void;
  /** Mounts the popup subtree without opening it, to resolve derived item labels. */
  forceMount: () => void;
  /** Applies a selection originating from an item. */
  handleSelection: (event: MouseEvent | PointerEvent | KeyboardEvent, itemValue: any) => void;
  /** Requests submission of the owning form. */
  requestSubmit: () => void;
  /** Called when the open state change animation completes. */
  onOpenChangeComplete: (open: boolean) => void;
};

type VirtualizationStore = {
  state: { renderAllRows: boolean };
  set: (key: 'renderAllRows', value: boolean) => void;
};

/**
 * Mounts or releases the whole collection for a browser autofill label pass.
 *
 * A built-in `<Virtualizer>` reads this as its windowing being suspended, and re-measures its
 * viewport when it is cleared. That makes the order of the release load-bearing: clear this
 * **before** releasing `forceMounted`, so the virtualizer is still mounted to observe it.
 *
 * Repeating a request is not a new pass, so an unchanged value publishes nothing: a redundant
 * notification would arm a viewport restore for a suspension that never happened.
 */
export function setVirtualizationRenderAllRows(store: VirtualizationStore, renderAllRows: boolean) {
  if (store.state.renderAllRows === renderAllRows) {
    return;
  }

  store.set('renderAllRows', renderAllRows);
}

export const selectors = {
  id: (state: State) => state.id,
  labelId: (state: State) => state.labelId,

  items: (state: State) => state.items,

  selectedValue: (state: State) => state.selectedValue,
  hasSelectionChips: (state: State) => {
    const selectedValue = state.selectedValue;
    return Array.isArray(selectedValue) && selectedValue.length > 0;
  },

  hasSelectedValue: (state: State) => {
    const { selectedValue, selectionMode } = state;
    if (selectedValue == null) {
      return false;
    }
    if (selectionMode === 'multiple' && Array.isArray(selectedValue)) {
      return selectedValue.length > 0;
    }
    return true;
  },

  hasNullItemLabel: (state: State, enabled: boolean) => {
    return enabled ? hasNullItemLabel(state.items) : false;
  },

  open: (state: State) => state.open,
  mounted: (state: State) => state.mounted,
  forceMounted: (state: State) => state.forceMounted,

  inline: (state: State) => state.inline,

  activeIndex: (state: State) => state.activeIndex,
  highlightType: (state: State) => state.highlightType,
  selectedIndex: (state: State) => state.selectedIndex,
  isActive: (state: State, index: number) => state.activeIndex === index,
  isSelected: (state: State, itemValue: any) => {
    const comparer = state.isItemEqualToValue;
    const selectedValue = state.selectedValue;
    if (Array.isArray(selectedValue)) {
      return selectedValue.some((selectedItem) =>
        compareItemEquality(itemValue, selectedItem, comparer),
      );
    }
    return compareItemEquality(itemValue, selectedValue, comparer);
  },

  transitionStatus: (state: State) => state.transitionStatus,

  popupProps: (state: State) => state.popupProps,
  listProps: (state: State) => state.listProps,
  inputProps: (state: State) => state.inputProps,
  triggerProps: (state: State) => state.triggerProps,
  itemProps: (state: State) => state.itemProps,

  positionerElement: (state: State) => state.positionerElement,
  listElement: (state: State) => state.listElement,
  popupId: (state: State) => state.popupId,
  triggerElement: (state: State) => state.triggerElement,
  inputElement: (state: State) => state.inputElement,
  inputGroupElement: (state: State) => state.inputGroupElement,
  popupSide: (state: State) => state.popupSide,

  openMethod: (state: State) => state.openMethod,

  inputInsidePopup: (state: State) => state.inputInsidePopup,
  inputOwnsFormValue: (state: State) => state.inputOwnsFormValue,

  selectionMode: (state: State) => state.selectionMode,

  name: (state: State) => state.name,
  form: (state: State) => state.form,
  disabled: (state: State) => state.disabled,
  readOnly: (state: State) => state.readOnly,
  required: (state: State) => state.required,
  grid: (state: State) => state.grid,
  externallyVirtualized: (state: State) => state.externallyVirtualized,
  renderAllRows: (state: State) => state.renderAllRows,
  itemToStringLabel: (state: State) => state.itemToStringLabel,
  isItemDisabled: (state: State) => state.isItemDisabled,
  isItemEqualToValue: (state: State) => state.isItemEqualToValue,
  modal: (state: State) => state.modal,
  autoHighlight: (state: State) => state.autoHighlight,
};

export type ComboboxStore = ReactStore<State, ComboboxStoreContext, typeof selectors>;
