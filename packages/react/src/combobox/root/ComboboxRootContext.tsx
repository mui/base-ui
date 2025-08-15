import * as React from 'react';
import { ComboboxStore } from '../store';
import type { FloatingRootContext } from '../../floating-ui-react';
import type { HTMLProps } from '../../utils/types';
import type { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import type { BaseOpenChangeReason } from '../../utils/translateOpenChangeReason';

export type ValueChangeReason = 'item-press' | 'input-change' | 'input-clear';

export interface ComboboxRootContext {
  selectionMode: 'single' | 'multiple' | 'none';
  setOpen: (
    open: boolean,
    event: Event | undefined,
    reason: BaseOpenChangeReason | undefined,
  ) => void;
  setInputValue: (
    value: string,
    event: Event | undefined,
    reason: ValueChangeReason | undefined,
  ) => void;
  setSelectedValue: (
    value: any,
    event: Event | undefined,
    reason: ValueChangeReason | undefined,
  ) => void;
  listRef: React.RefObject<Array<HTMLElement | null>>;
  popupRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  keyboardActiveRef: React.RefObject<boolean>;
  allowActiveIndexSyncRef: React.RefObject<boolean>;
  store: ComboboxStore;
  getItemProps: (
    props?: HTMLProps & { active?: boolean; selected?: boolean },
  ) => Record<string, unknown>;
  valuesRef: React.RefObject<Array<any>>;
  registerItemIndex: (index: number) => void;
  onItemHighlighted: (
    value: any,
    data: {
      type: 'keyboard' | 'pointer' | 'none';
      index: number;
    },
  ) => void;
  handleEnterSelection: (event: Event) => void;
  name: string | undefined;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  fieldControlValidation: ReturnType<typeof useFieldControlValidation>;
  cols: number;
  isGrouped: boolean;
  virtualized: boolean;
  onOpenChangeComplete: (open: boolean) => void;
  openOnInputClick: boolean;
  itemToString?: (item: any) => string;
  modal: boolean;
}

export interface ComboboxDerivedItemsContext {
  query: string;
  filteredItems: any[];
  flatFilteredItems: any[];
}

export const ComboboxRootContext = React.createContext<ComboboxRootContext | undefined>(undefined);
export const ComboboxFloatingContext = React.createContext<FloatingRootContext | undefined>(
  undefined,
);
export const ComboboxDerivedItemsContext = React.createContext<
  ComboboxDerivedItemsContext | undefined
>(undefined);

export function useComboboxRootContext() {
  const context = React.useContext(ComboboxRootContext) as ComboboxRootContext | undefined;
  if (!context) {
    throw new Error(
      'Base UI: ComboboxRootContext is missing. Combobox parts must be placed within <Combobox.Root>.',
    );
  }
  return context;
}

export function useComboboxFloatingContext() {
  const context = React.useContext(ComboboxFloatingContext);
  if (!context) {
    throw new Error(
      'Base UI: ComboboxFloatingContext is missing. Combobox parts must be placed within <Combobox.Root>.',
    );
  }
  return context;
}

export function useComboboxDerivedItemsContext() {
  const context = React.useContext(ComboboxDerivedItemsContext);
  if (!context) {
    throw new Error(
      'Base UI: ComboboxItemsContext is missing. Combobox parts must be placed within <Combobox.Root>.',
    );
  }
  return context;
}
