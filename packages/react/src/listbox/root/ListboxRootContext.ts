'use client';
import * as React from 'react';
import type { ListboxStore } from '../store';
import type { UseFieldValidationReturnValue } from '../../field/root/useFieldValidation';
import type { ListboxRoot } from './ListboxRoot';
import type { SelectionMode } from '../utils/selectionReducer';

export interface ListboxRootContext {
  store: ListboxStore;
  name: string | undefined;
  disabled: boolean;
  required: boolean;
  loadingProp: boolean;
  selectionMode: SelectionMode;
  highlightItemOnHover: boolean;
  orientation: 'vertical' | 'horizontal';
  loopFocus: boolean;
  requestHighlightReconcile: () => void;
  setValue: (nextValue: any, eventDetails: ListboxRoot.ChangeEventDetails) => void;
  listRef: React.RefObject<Array<HTMLElement | null>>;
  valuesRef: React.RefObject<Array<any>>;
  labelsRef: React.RefObject<Array<string | null>>;
  disabledItemsRef: React.RefObject<Array<boolean | undefined>>;
  groupIdsRef: React.RefObject<Array<string | undefined>>;
  typingRef: React.RefObject<boolean>;
  lastSelectedIndexRef: React.RefObject<number | null>;
  lastPointerTypeRef: React.RefObject<string | null>;
  pointerMoveSuppressedRef: React.RefObject<boolean>;
  validation: UseFieldValidationReturnValue;
  onItemsReorder:
    | ((event: {
        items: any[];
        referenceItem: any;
        edge: 'before' | 'after';
        reason: 'drag' | 'keyboard';
      }) => void)
    | undefined;
  onLoadMore: (() => void) | undefined;
}

export const ListboxRootContext = React.createContext<ListboxRootContext | null>(null);

export function useListboxRootContext() {
  const context = React.useContext(ListboxRootContext);
  if (context === null) {
    throw new Error(
      'Base UI: ListboxRootContext is missing. Listbox parts must be placed within <Listbox.Root>.',
    );
  }
  return context;
}
