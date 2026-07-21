import { Store } from '@base-ui/utils/store';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import type { TransitionStatus } from '../internals/useTransitionStatus';
import type { HTMLProps } from '../internals/types';
import type { Side } from '../utils/useAnchorPositioning';
import { compareItemEquality } from '../internals/itemEquality';
import { hasNullItemLabel } from '../internals/resolveValueLabel';
import type { AriaCombobox } from './root/AriaCombobox';
import type { ListVirtualizationRegistry } from '../internals/virtualization/ListVirtualizationRegistry';

export type VirtualizationState = {
  renderAllRows: boolean;
  renderAllRowsRestoreVersion: number;
};

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

  listRef: React.RefObject<Array<HTMLElement | null>>;
  labelsRef: React.RefObject<Array<string | null>>;
  popupRef: React.RefObject<HTMLDivElement | null>;
  emptyRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  startDismissRef: React.RefObject<HTMLSpanElement | null>;
  endDismissRef: React.RefObject<HTMLSpanElement | null>;
  keyboardActiveRef: React.RefObject<boolean>;
  chipsContainerRef: React.RefObject<HTMLDivElement | null>;
  clearRef: React.RefObject<HTMLButtonElement | null>;
  valuesRef: React.RefObject<Array<any>>;
  pointerDownItemRef: React.RefObject<Element | null>;
  selectionEventRef: React.RefObject<MouseEvent | PointerEvent | KeyboardEvent | null>;

  setOpen: (open: boolean, eventDetails: AriaCombobox.ChangeEventDetails) => void;
  setInputValue: (value: string, eventDetails: AriaCombobox.ChangeEventDetails) => void;
  setSelectedValue: (value: any, eventDetails: AriaCombobox.ChangeEventDetails) => void;
  setIndices: (indices: {
    activeIndex?: number | null | undefined;
    selectedIndex?: number | null | undefined;
    type?: 'keyboard' | 'pointer' | 'none' | undefined;
  }) => void;
  forceMount: () => void;
  handleSelection: (event: MouseEvent | PointerEvent | KeyboardEvent, itemValue: any) => void;
  requestSubmit: () => void;

  name: string | undefined;
  form: string | undefined;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  grid: boolean;
  externallyVirtualized: boolean;
  virtualizationState: VirtualizationState;
  virtualizationRegistry: ListVirtualizationRegistry;
  onOpenChangeComplete: (open: boolean) => void;
  openOnInputClick: boolean;
  itemToStringLabel?: ((item: any) => string) | undefined;
  isItemDisabled?: ((item: any, index: number) => boolean) | undefined;
  isItemEqualToValue: (itemValue: any, selectedValue: any) => boolean;
  modal: boolean;
  autoHighlight: false | 'always' | 'input-change';
  submitOnItemClick: boolean;
  hasInputValue: boolean;
};

export type ComboboxStore = Store<State>;

type VirtualizationStore = {
  state: { virtualizationState: VirtualizationState };
  set: (key: 'virtualizationState', value: VirtualizationState) => void;
};

export function setVirtualizationRenderAllRows(store: VirtualizationStore, renderAllRows: boolean) {
  const virtualizationState = store.state.virtualizationState;

  if (virtualizationState.renderAllRows === renderAllRows) {
    return;
  }

  store.set('virtualizationState', {
    renderAllRows,
    renderAllRowsRestoreVersion:
      virtualizationState.renderAllRowsRestoreVersion + (renderAllRows ? 0 : 1),
  });
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
  virtualizationState: (state: State) => state.virtualizationState,
  itemToStringLabel: (state: State) => state.itemToStringLabel,
  isItemDisabled: (state: State) => state.isItemDisabled,
  isItemEqualToValue: (state: State) => state.isItemEqualToValue,
  modal: (state: State) => state.modal,
  autoHighlight: (state: State) => state.autoHighlight,
};
