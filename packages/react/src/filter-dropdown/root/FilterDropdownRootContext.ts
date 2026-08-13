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
