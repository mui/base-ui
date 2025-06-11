import * as React from 'react';
import type { FloatingRootContext } from '@floating-ui/react';
import type { BaseOpenChangeReason } from '../../utils/translateOpenChangeReason';
import { ComboboxStore } from '../store';
import { HTMLProps } from '../../utils/types';

export type ValueChangeReason = 'item-press' | 'input-change';

export interface ComboboxRootContext {
  selectable: boolean;
  mounted: boolean;
  value: any;
  setValue: (value: any, event: Event | undefined, reason: ValueChangeReason | undefined) => void;
  open: boolean;
  setOpen: (
    open: boolean,
    event: Event | undefined,
    reason: BaseOpenChangeReason | undefined,
  ) => void;
  listRef: React.RefObject<Array<HTMLElement | null>>;
  popupRef: React.RefObject<HTMLDivElement | null>;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  keyboardActiveRef: React.RefObject<boolean>;
  allowActiveIndexSyncRef: React.RefObject<boolean>;
  store: ComboboxStore;
  getItemProps: (
    props?: HTMLProps & { active?: boolean; selected?: boolean },
  ) => Record<string, unknown>;
  valuesRef: React.RefObject<Array<any>>;
  registerSelectedItem: (index: number) => void;
}

export const ComboboxRootContext = React.createContext<ComboboxRootContext | undefined>(undefined);
export const ComboboxFloatingContext = React.createContext<FloatingRootContext | null>(null);

export function useComboboxRootContext() {
  const context = React.useContext(ComboboxRootContext);
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
