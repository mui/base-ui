import { Store, createSelector } from '@base-ui-components/utils/store';
import type { InteractionType } from '@base-ui-components/utils/useEnhancedClickHandler';
import type { TransitionStatus } from '../utils/useTransitionStatus';
import type { HTMLProps } from '../utils/types';
import type { useFieldControlValidation } from '../field/control/useFieldControlValidation';
import type { ComboboxRootInternal } from './root/ComboboxRootInternal';
import { compareItemEquality } from '../utils/itemEquality';

export type State = {
  id: string | undefined;

  query: string;

  filter: (item: any, query: string) => boolean;

  items: readonly any[] | undefined;

  selectedValue: any;
  inputValue: React.ComponentProps<'input'>['value'];

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
  typeaheadTriggerProps: HTMLProps;

  positionerElement: HTMLElement | null;
  listElement: HTMLElement | null;
  triggerElement: HTMLElement | null;
  inputElement: HTMLInputElement | null;

  openMethod: InteractionType | null;

  inputInsidePopup: boolean;

  selectionMode: 'single' | 'multiple' | 'none';

  listRef: React.RefObject<Array<HTMLElement | null>>;
  popupRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  keyboardActiveRef: React.RefObject<boolean>;
  chipsContainerRef: React.RefObject<HTMLDivElement | null>;
  clearRef: React.RefObject<HTMLButtonElement | null>;
  valuesRef: React.RefObject<Array<any>>;
  allValuesRef: React.RefObject<Array<any>>;

  setOpen: (open: boolean, eventDetails: ComboboxRootInternal.ChangeEventDetails) => void;
  setInputValue: (value: string, eventDetails: ComboboxRootInternal.ChangeEventDetails) => void;
  setSelectedValue: (value: any, eventDetails: ComboboxRootInternal.ChangeEventDetails) => void;
  setIndices: (indices: {
    activeIndex?: number | null;
    selectedIndex?: number | null;
    type?: 'keyboard' | 'pointer' | 'none';
  }) => void;
  onItemHighlighted: (
    item: any,
    info: { type: 'keyboard' | 'pointer' | 'none'; index: number },
  ) => void;
  forceMount: () => void;
  handleSelection: (event: MouseEvent | PointerEvent | KeyboardEvent, passedValue?: any) => void;
  getItemProps: (
    props?: HTMLProps & { active?: boolean; selected?: boolean },
  ) => Record<string, unknown>;

  name: string | undefined;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  fieldControlValidation: ReturnType<typeof useFieldControlValidation>;
  grid: boolean;
  isGrouped: boolean;
  virtualized: boolean;
  onOpenChangeComplete: (open: boolean) => void;
  openOnInputClick: boolean;
  itemToStringLabel?: (item: any) => string;
  isItemEqualToValue: (item: any, value: any) => boolean;
  modal: boolean;
  autoHighlight: boolean;
  alwaysSubmitOnEnter: boolean;
  hasInputValue: boolean;
};

export type ComboboxStore = Store<State>;

export const selectors = {
  id: createSelector((state: State) => state.id),

  query: createSelector((state: State) => state.query),

  items: createSelector((state: State) => state.items),

  selectedValue: createSelector((state: State) => state.selectedValue),
  inputValue: createSelector((state: State) => state.inputValue),

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
  typeaheadTriggerProps: createSelector((state: State) => state.typeaheadTriggerProps),
  getItemProps: createSelector((state: State) => state.getItemProps),

  positionerElement: createSelector((state: State) => state.positionerElement),
  listElement: createSelector((state: State) => state.listElement),
  triggerElement: createSelector((state: State) => state.triggerElement),
  inputElement: createSelector((state: State) => state.inputElement),

  openMethod: createSelector((state: State) => state.openMethod),

  inputInsidePopup: createSelector((state: State) => state.inputInsidePopup),

  selectionMode: createSelector((state: State) => state.selectionMode),
  listRef: createSelector((state: State) => state.listRef),
  popupRef: createSelector((state: State) => state.popupRef),
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
  fieldControlValidation: createSelector((state: State) => state.fieldControlValidation),
  grid: createSelector((state: State) => state.grid),
  isGrouped: createSelector((state: State) => state.isGrouped),
  virtualized: createSelector((state: State) => state.virtualized),
  onOpenChangeComplete: createSelector((state: State) => state.onOpenChangeComplete),
  openOnInputClick: createSelector((state: State) => state.openOnInputClick),
  itemToStringLabel: createSelector((state: State) => state.itemToStringLabel),
  isItemEqualToValue: createSelector((state: State) => state.isItemEqualToValue),
  modal: createSelector((state: State) => state.modal),
  autoHighlight: createSelector((state: State) => state.autoHighlight),
  alwaysSubmitOnEnter: createSelector((state: State) => state.alwaysSubmitOnEnter),
};
