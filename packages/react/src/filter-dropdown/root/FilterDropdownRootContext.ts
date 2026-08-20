'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import type { REASONS } from '../../internals/reasons';
import type { HTMLProps } from '../../internals/types';
import type { FilterDropdownStore } from '../store';
import { selectors } from '../store';

export interface FilterDropdownItemRegistration {
  getText: () => string | undefined;
  keywords: readonly string[] | undefined;
}

export type FilterDropdownFilter = (
  filterText: string,
  query: string,
  keywords: readonly string[] | undefined,
) => boolean;

export interface FilterDropdownRootContext {
  open: boolean;
  inline: boolean;
  disabled: boolean;
  inputFocusVisible: boolean;
  setInputFocusVisible: (visible: boolean) => void;
  keyboardModality: boolean;
  setKeyboardModality: (keyboardModality: boolean) => void;
  autoHighlight: boolean | 'always';
  /**
   * Visibility of every registered item under the committed query.
   */
  store: FilterDropdownStore;
  defaultPopupId: string | undefined;
  popupId: string | undefined;
  setPopupId: React.Dispatch<React.SetStateAction<string | undefined>>;
  defaultTriggerId: string | undefined;
  triggerId: string | undefined;
  setTriggerId: React.Dispatch<React.SetStateAction<string | undefined>>;
  defaultListId: string | undefined;
  listId: string | undefined;
  setListId: React.Dispatch<React.SetStateAction<string | undefined>>;
  /**
   * The input when present, or the list when the input is omitted. This element owns real focus
   * while the host uses virtual list navigation.
   */
  focusOwnerRef: React.RefObject<HTMLElement | null>;
  setInputElement: (element: HTMLInputElement | null) => void;
  setListElement: (element: HTMLDivElement | null) => void;
  hasInput: boolean;
  activeIndex: number | null;
  setActiveIndex: (index: number | null) => void;
  /**
   * The host's navigation props for the element that holds real focus while the popup is open.
   */
  inputProps: HTMLProps;
  onValueChange: (value: string, eventDetails: FilterDropdownRoot.ChangeEventDetails) => void;
}

export interface FilterDropdownItemContext {
  /** The enclosing dropdown when this root is nested. */
  parent: FilterDropdownItemContext | null;
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
  while (listRef !== null && context !== null && context.listRef !== listRef) {
    context = context.parent;
  }
  return listRef === null ? null : context;
}

/**
 * The element the host currently highlights, used for `aria-activedescendant`.
 */
export function useActiveItemId(context: FilterDropdownRootContext) {
  return useStore(context.store, selectors.activeItemId, context.activeIndex);
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
