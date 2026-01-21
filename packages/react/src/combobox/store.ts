import { Store, createSelector } from '@base-ui/utils/store';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import type { TransitionStatus } from '../utils/useTransitionStatus';
import type { HTMLProps } from '../utils/types';
import type { Side } from '../utils/useAnchorPositioning';
import { compareItemEquality } from '../utils/itemEquality';
import { hasNullItemLabel } from '../utils/resolveValueLabel';
import type { AriaCombobox } from './root/AriaCombobox';

export type State = {
  id: string | undefined;

  query: string;

  filter: (item: any, query: string) => boolean;

  items: readonly any[] | undefined;

  selectedValue: any;

  open: boolean;
  mounted: boolean;
  transitionStatus: TransitionStatus;
  forceMounted: boolean;

  inline: boolean;

  activeIndex: number | null;
  selectedIndex: number | null;

  popupProps: HTMLProps;
  inputProps: HTMLProps;
  triggerProps: HTMLProps;

  positionerElement: HTMLElement | null;
  listElement: HTMLElement | null;
  triggerElement: HTMLElement | null;
  inputElement: HTMLInputElement | null;
  popupSide: Side | null;

  openMethod: InteractionType | null;

  inputInsidePopup: boolean;

  selectionMode: 'single' | 'multiple' | 'none';

  listRef: React.RefObject<Array<HTMLElement | null>>;
  labelsRef: React.RefObject<Array<string | null>>;
  popupRef: React.RefObject<HTMLDivElement | null>;
  emptyRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  keyboardActiveRef: React.RefObject<boolean>;
  chipsContainerRef: React.RefObject<HTMLDivElement | null>;
  clearRef: React.RefObject<HTMLButtonElement | null>;
  valuesRef: React.RefObject<Array<any>>;
  allValuesRef: React.RefObject<Array<any>>;
  selectionEventRef: React.RefObject<MouseEvent | PointerEvent | KeyboardEvent | null>;

  setOpen: (open: boolean, eventDetails: AriaCombobox.ChangeEventDetails) => void;
  setInputValue: (value: string, eventDetails: AriaCombobox.ChangeEventDetails) => void;
  setSelectedValue: (value: any, eventDetails: AriaCombobox.ChangeEventDetails) => void;
  setIndices: (indices: {
    activeIndex?: (number | null) | undefined;
    selectedIndex?: (number | null) | undefined;
    type?: ('keyboard' | 'pointer' | 'none') | undefined;
  }) => void;
  onItemHighlighted: (item: any, eventDetails: AriaCombobox.HighlightEventDetails) => void;
  forceMount: () => void;
  handleSelection: (event: MouseEvent | PointerEvent | KeyboardEvent, passedValue?: any) => void;
  getItemProps: (
    props?: HTMLProps & { active?: boolean | undefined; selected?: boolean | undefined },
  ) => Record<string, unknown>;
  requestSubmit: () => void;

  name: string | undefined;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  grid: boolean;
  isGrouped: boolean;
  virtualized: boolean;
  onOpenChangeComplete: (open: boolean) => void;
  openOnInputClick: boolean;
  itemToStringLabel?: ((item: any) => string) | undefined;
  isItemEqualToValue: (item: any, value: any) => boolean;
  modal: boolean;
  autoHighlight: false | 'always' | 'input-change';
  submitOnItemClick: boolean;
  hasInputValue: boolean;
};

export type ComboboxStore = Store<State>;

export const selectors = {
  id: createSelector((state: State) => state.id),

  query: createSelector((state: State) => state.query),

  items: createSelector((state: State) => state.items),

  selectedValue: createSelector((state: State) => state.selectedValue),
  hasSelectionChips: createSelector((state: State) => {
    const selectedValue = state.selectedValue;
    return Array.isArray(selectedValue) && selectedValue.length > 0;
  }),

  hasSelectedValue: createSelector((state: State) => {
    const { selectedValue, selectionMode } = state;
    if (selectedValue == null) {
      return false;
    }
    if (selectionMode === 'multiple' && Array.isArray(selectedValue)) {
      return selectedValue.length > 0;
    }
    return true;
  }),

  hasNullItemLabel: createSelector((state: State, enabled: boolean) => {
    return enabled ? hasNullItemLabel(state.items) : false;
  }),

  open: createSelector((state: State) => state.open),
  mounted: createSelector((state: State) => state.mounted),
  forceMounted: createSelector((state: State) => state.forceMounted),

  inline: createSelector((state: State) => state.inline),

  activeIndex: createSelector((state: State) => state.activeIndex),
  selectedIndex: createSelector((state: State) => state.selectedIndex),
  isActive: createSelector((state: State, index: number) => state.activeIndex === index),
  isSelected: createSelector((state: State, candidate: any) => {
    const comparer = state.isItemEqualToValue;
    const selectedValue = state.selectedValue;
    if (Array.isArray(selectedValue)) {
      return selectedValue.some((value) => compareItemEquality(value, candidate, comparer));
    }
    return compareItemEquality(selectedValue, candidate, comparer);
  }),

  transitionStatus: createSelector((state: State) => state.transitionStatus),

  popupProps: createSelector((state: State) => state.popupProps),
  inputProps: createSelector((state: State) => state.inputProps),
  triggerProps: createSelector((state: State) => state.triggerProps),
  getItemProps: createSelector((state: State) => state.getItemProps),

  positionerElement: createSelector((state: State) => state.positionerElement),
  listElement: createSelector((state: State) => state.listElement),
  triggerElement: createSelector((state: State) => state.triggerElement),
  inputElement: createSelector((state: State) => state.inputElement),
  popupSide: createSelector((state: State) => state.popupSide),

  openMethod: createSelector((state: State) => state.openMethod),

  inputInsidePopup: createSelector((state: State) => state.inputInsidePopup),

  selectionMode: createSelector((state: State) => state.selectionMode),
  listRef: createSelector((state: State) => state.listRef),
  labelsRef: createSelector((state: State) => state.labelsRef),
  popupRef: createSelector((state: State) => state.popupRef),
  emptyRef: createSelector((state: State) => state.emptyRef),
  inputRef: createSelector((state: State) => state.inputRef),
  keyboardActiveRef: createSelector((state: State) => state.keyboardActiveRef),
  chipsContainerRef: createSelector((state: State) => state.chipsContainerRef),
  clearRef: createSelector((state: State) => state.clearRef),
  valuesRef: createSelector((state: State) => state.valuesRef),
  allValuesRef: createSelector((state: State) => state.allValuesRef),

  name: createSelector((state: State) => state.name),
  disabled: createSelector((state: State) => state.disabled),
  readOnly: createSelector((state: State) => state.readOnly),
  required: createSelector((state: State) => state.required),
  grid: createSelector((state: State) => state.grid),
  isGrouped: createSelector((state: State) => state.isGrouped),
  virtualized: createSelector((state: State) => state.virtualized),
  onOpenChangeComplete: createSelector((state: State) => state.onOpenChangeComplete),
  openOnInputClick: createSelector((state: State) => state.openOnInputClick),
  itemToStringLabel: createSelector((state: State) => state.itemToStringLabel),
  isItemEqualToValue: createSelector((state: State) => state.isItemEqualToValue),
  modal: createSelector((state: State) => state.modal),
  autoHighlight: createSelector((state: State) => state.autoHighlight),
  submitOnItemClick: createSelector((state: State) => state.submitOnItemClick),
};
