import * as React from 'react';
import { useFloatingRootContext, type FloatingRootContext } from '../../floating-ui-react';
import type { SelectStore } from '../store';
import type { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import type { HTMLProps } from '../../utils/types';
import type { SelectRoot } from './SelectRoot';

export interface SelectRootContext {
  store: SelectStore;
  name: string | undefined;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  multiple: boolean;
  setValue: (nextValue: any, event?: Event) => void;
  setOpen: (
    open: boolean,
    event: Event | undefined,
    reason: SelectRoot.OpenChangeReason | undefined,
  ) => void;
  listRef: React.MutableRefObject<Array<HTMLElement | null>>;
  popupRef: React.MutableRefObject<HTMLDivElement | null>;
  getItemProps: (
    props?: HTMLProps & { active?: boolean; selected?: boolean },
  ) => Record<string, unknown>; // PREVENT_COMMIT
  events: ReturnType<typeof useFloatingRootContext>['events'];
  valueRef: React.MutableRefObject<HTMLSpanElement | null>;
  valuesRef: React.MutableRefObject<Array<any>>;
  labelsRef: React.MutableRefObject<Array<string | null>>;
  typingRef: React.MutableRefObject<boolean>;
  selectionRef: React.MutableRefObject<{
    allowUnselectedMouseUp: boolean;
    allowSelectedMouseUp: boolean;
  }>;
  selectedItemTextRef: React.MutableRefObject<HTMLSpanElement | null>;
  fieldControlValidation: ReturnType<typeof useFieldControlValidation>;
  /**
   * Called by each <Select.Item> when it knows its stable list index.
   * Allows the root to map option values to their DOM positions.
   */
  registerItemIndex: (index: number) => void;
  onOpenChangeComplete?: (open: boolean) => void;
  keyboardActiveRef: React.MutableRefObject<boolean>;
  alignItemWithTriggerActiveRef: React.RefObject<boolean>;
  initialValueRef: React.MutableRefObject<any>;
}

export const SelectRootContext = React.createContext<SelectRootContext | null>(null);
export const SelectFloatingContext = React.createContext<FloatingRootContext | null>(null);

export function useSelectRootContext() {
  const context = React.useContext(SelectRootContext);
  if (context === null) {
    throw new Error(
      'Base UI: SelectRootContext is missing. Select parts must be placed within <Select.Root>.',
    );
  }
  return context;
}

export function useSelectFloatingContext() {
  const context = React.useContext(SelectFloatingContext);
  if (context === null) {
    throw new Error(
      'Base UI: SelectFloatingContext is missing. Select parts must be placed within <Select.Root>.',
    );
  }
  return context;
}
