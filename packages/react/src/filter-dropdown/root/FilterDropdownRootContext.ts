'use client';
import * as React from 'react';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import type { REASONS } from '../../internals/reasons';
import type { FilterDropdownStore } from '../store';

export interface FilterDropdownItemRegistration {
  getText: () => string | undefined;
  keywords: readonly string[] | undefined;
}

export type FilterDropdownFilter = (text: string, query: string) => boolean;

export interface FilterDropdownRootContext {
  open: boolean;
  inline: boolean;
  disabled: boolean;
  inputFocusVisible: boolean;
  setInputFocusVisible: (visible: boolean) => void;
  keyboardModality: boolean;
  setKeyboardModality: (keyboardModality: boolean) => void;
  autoHighlight: boolean | 'always';
  store: FilterDropdownStore;
  defaultPopupId: string | undefined;
  triggerId: string | undefined;
  defaultListId: string | undefined;
  listId: string | undefined;
  setListId: React.Dispatch<React.SetStateAction<string | undefined>>;
  /**
   * The input when present, or the list when the input is omitted. This element owns real focus
   * while the host uses virtual list navigation.
   */
  focusOwnerRef: React.RefObject<HTMLElement | null>;
  setInputElement: (element: HTMLInputElement | null) => void;
  /** Whether the input asks to be focused whenever the popup opens, hover opens included. */
  setInputAutoFocus: (autoFocus: boolean) => void;
  setListElement: (element: HTMLDivElement | null) => void;
  hasInput: boolean;
  /** Total item count when the host's items are windowed by an external virtualizer. */
  virtualized: number | undefined;
  setActiveIndex: (index: number | null) => void;
  onItemsChange: (hasItems: boolean) => void;
  onValueChange: (value: string, eventDetails: FilterDropdownRoot.ChangeEventDetails) => void;
}

export interface FilterDropdownItemContext {
  /** The enclosing dropdown when this root is nested. */
  parent: FilterDropdownItemContext | null;
  grid: boolean;
  store: FilterDropdownStore;
  registerItem: (id: symbol, registration: FilterDropdownItemRegistration) => () => void;
  listRef: React.RefObject<Array<HTMLElement | null>>;
}

function throwMissingFilterRoot(): never {
  throw new Error(
    'Base UI: Filter parts must be placed within a filter root. Wrap them in <FilterMenu.Root> ' +
      'or <FilterMenu.SubmenuRoot>; a plain <Menu.Root> cannot filter.',
  );
}

export const FilterDropdownItemContext = React.createContext<FilterDropdownItemContext | null>(
  null,
);

export function useFilterDropdownItemContext(optional?: false): FilterDropdownItemContext;
export function useFilterDropdownItemContext(optional: true): FilterDropdownItemContext | null;
export function useFilterDropdownItemContext(optional: boolean): FilterDropdownItemContext | null;
export function useFilterDropdownItemContext(optional = false) {
  const context = React.useContext(FilterDropdownItemContext);
  if (context === null && !optional) {
    throwMissingFilterRoot();
  }
  return context;
}

export const FilterDropdownRootContext = React.createContext<FilterDropdownRootContext | null>(
  null,
);

export function useFilterDropdownRootContext(optional?: false): FilterDropdownRootContext;
export function useFilterDropdownRootContext(optional: true): FilterDropdownRootContext | null;
export function useFilterDropdownRootContext(optional: boolean): FilterDropdownRootContext | null;
export function useFilterDropdownRootContext(optional = false) {
  const context = React.useContext(FilterDropdownRootContext);
  if (context === null && !optional) {
    throwMissingFilterRoot();
  }
  return context;
}

/**
 * Finds the dropdown that owns the given item list, walking out through nested roots.
 */
export function useFilterContextForList(
  listRef: React.RefObject<Array<HTMLElement | null>> | null,
) {
  let context = React.useContext(FilterDropdownItemContext);
  if (listRef === null) {
    return null;
  }

  while (context !== null && context.listRef !== listRef) {
    context = context.parent;
  }
  return context;
}

/**
 * The id of the highlighted item, for `aria-activedescendant`.
 */
export function useActiveItemId(context: FilterDropdownRootContext) {
  return context.store.useState('activeItemId');
}

// `value` controls a native input and can't be placed in the store without breaking the caret
// position when the input is controlled.
// https://github.com/mui/base-ui/issues/2703
export const FilterDropdownValueContext = React.createContext<string>('');

export function useFilterDropdownValueContext() {
  return React.useContext(FilterDropdownValueContext);
}

export type FilterDropdownRootChangeEventReason =
  | typeof REASONS.inputChange
  | typeof REASONS.inputClear
  | typeof REASONS.clearPress
  | typeof REASONS.popupClose;

export type FilterDropdownRootChangeEventDetails =
  BaseUIChangeEventDetails<FilterDropdownRootChangeEventReason>;

export namespace FilterDropdownRoot {
  export type ChangeEventReason = FilterDropdownRootChangeEventReason;
  export type ChangeEventDetails = FilterDropdownRootChangeEventDetails;
}
