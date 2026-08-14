'use client';
import * as React from 'react';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import type { REASONS } from '../../internals/reasons';
import type { HTMLProps } from '../../internals/types';
import type { FilterDropdownNavigationStore } from '../store';

export interface FilterDropdownItemRegistration {
  getText: () => string | undefined;
  keywords: readonly string[] | undefined;
  filterValue: unknown;
  ref: React.RefObject<HTMLElement | null>;
}

export type FilterDropdownFilter = (
  filterText: string,
  query: string,
  filterValue?: unknown,
) => boolean;

export interface FilterDropdownRootContext {
  /**
   * Context of the enclosing dropdown when this root is nested (e.g. a filterable submenu).
   * A nested root's provider shadows the enclosing one for children such as submenu triggers,
   * which belong to the enclosing dropdown's list.
   */
  parent: FilterDropdownRootContext | null;
  open: boolean;
  disabled: boolean;
  inputFocusVisible: boolean;
  setInputFocusVisible: (visible: boolean) => void;
  /**
   * Whether the current query matched no items, supplied by a host whose data pass drives the
   * list. When undefined, the popup's item registry decides.
   */
  empty: boolean | undefined;
  popupElements: WeakSet<EventTarget>;
  popupId: string | undefined;
  setPopupId: React.Dispatch<React.SetStateAction<string | undefined>>;
  triggerId: string | undefined;
  setTriggerId: React.Dispatch<React.SetStateAction<string | undefined>>;
  liveRegionElement: HTMLDivElement | null;
  setLiveRegionElement: React.Dispatch<React.SetStateAction<HTMLDivElement | null>>;
  setTriggerElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  setPopupElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  listRef: React.RefObject<Array<HTMLElement | null>>;
  registeredItems: ReadonlyMap<symbol, FilterDropdownItemRegistration>;
  registerItem: (id: symbol, registration: FilterDropdownItemRegistration) => () => void;
  navigationStore: FilterDropdownNavigationStore;
  activeIndex: number | null;
  setActiveIndex: (index: number | null) => void;
  navigation: {
    trigger: HTMLProps;
    reference: HTMLProps;
    floating: HTMLProps;
    item: HTMLProps;
  };
  locale: Intl.LocalesArgument | undefined;
  filter: FilterDropdownFilter | undefined;
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
      'Base UI: FilterDropdownRootContext is missing. FilterDropdown parts must be placed within <FilterDropdown.Root>.',
    );
  }
  return context;
}

/**
 * Whether the given item list is governed by a FilterDropdown, which keeps real focus on its
 * input and navigates virtually, so the list's items must not be focusable. Checks the nearest
 * context and its parent: a nested dropdown's provider shadows the enclosing one for a submenu
 * trigger, whose list belongs to the enclosing dropdown.
 */
export function useIsFilterableList(listRef: React.RefObject<Array<HTMLElement | null>>) {
  const context = React.useContext(FilterDropdownRootContext);
  return context !== null && (context.listRef === listRef || context.parent?.listRef === listRef);
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
