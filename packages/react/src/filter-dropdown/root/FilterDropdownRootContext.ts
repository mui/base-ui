'use client';
import * as React from 'react';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import type { REASONS } from '../../internals/reasons';
import type { HTMLProps } from '../../internals/types';
import type { FilterDropdownStore } from '../store';

export interface FilterDropdownItemRegistration {
  getText: () => string | undefined;
  keywords: readonly string[] | undefined;
  filterValue: unknown;
}

export type FilterDropdownFilter = (
  filterText: string,
  query: string,
  filterValue?: unknown,
) => boolean;

export interface FilterDropdownRootContext {
  /**
   * The enclosing dropdown when this root is nested, such as a filterable submenu. A nested
   * root's provider shadows the enclosing one for children that belong to the enclosing list,
   * like the submenu's own trigger.
   */
  parent: FilterDropdownRootContext | null;
  open: boolean;
  disabled: boolean;
  inputFocusVisible: boolean;
  setInputFocusVisible: (visible: boolean) => void;
  /**
   * Whether the current query matched no items, supplied by a host whose data pass drives the
   * list. When undefined, the item registry decides.
   */
  empty: boolean | undefined;
  /**
   * Visibility of every registered item under the committed query.
   */
  store: FilterDropdownStore;
  popupId: string | undefined;
  setPopupId: React.Dispatch<React.SetStateAction<string | undefined>>;
  triggerId: string | undefined;
  setTriggerId: React.Dispatch<React.SetStateAction<string | undefined>>;
  listId: string | undefined;
  setListId: React.Dispatch<React.SetStateAction<string | undefined>>;
  liveRegionElement: HTMLDivElement | null;
  setTriggerElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  /**
   * The input when present, or the list when the input is omitted. This element owns real focus
   * while the host uses virtual list navigation.
   */
  focusOwnerRef: React.RefObject<HTMLElement | null>;
  setInputElement: (element: HTMLInputElement | null) => void;
  setListElement: (element: HTMLDivElement | null) => void;
  hasInput: boolean;
  registerItem: (id: symbol, registration: FilterDropdownItemRegistration) => () => void;
  /**
   * The host's list of item elements, in DOM order, and the index it currently highlights. The
   * host owns navigation; these are read to point `aria-activedescendant` at the right element.
   */
  listRef: React.RefObject<Array<HTMLElement | null>>;
  activeIndex: number | null;
  setActiveIndex: (index: number | null) => void;
  /**
   * The host's navigation props for the element that holds real focus while the popup is open.
   */
  inputProps: HTMLProps;
  onValueChange: (value: string, eventDetails: FilterDropdownRoot.ChangeEventDetails) => void;
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
    throw new Error(
      'Base UI: Filter parts must be placed within a filter root. Wrap them in <FilterMenu.Root>, ' +
        '<FilterMenu.SubmenuRoot>, or <FilterSelect.Root>; a plain <Menu.Root> or <Select.Root> cannot filter.',
    );
  }
  return context;
}

/**
 * Finds the dropdown that owns the given item list, walking out through nested roots.
 */
export function useFilterContextForList(
  listRef: React.RefObject<Array<HTMLElement | null>> | null,
) {
  let context = React.useContext(FilterDropdownRootContext);
  while (listRef !== null && context !== null && context.listRef !== listRef) {
    context = context.parent;
  }
  return listRef === null ? null : context;
}

/**
 * The element the host currently highlights, used for `aria-activedescendant`.
 */
export function useActiveItemId(context: FilterDropdownRootContext) {
  return context.listRef.current[context.activeIndex ?? -1]?.id;
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
