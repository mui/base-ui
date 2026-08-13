'use client';
import * as React from 'react';
import type { SelectFilter, SelectRootInputValueChangeEventDetails } from './SelectRoot';

/**
 * The filtering parts, supplied by the `filter-select` entrypoint.
 *
 * Select renders these instead of importing them, so an ordinary `@base-ui/react/select` consumer
 * never pulls the filtering implementation into their bundle. A static import here would defeat
 * that: the branch is decided at runtime, so no bundler could drop it.
 */
export interface SelectFilterIntegration {
  Root: React.ComponentType<any>;
  Trigger: React.ComponentType<any>;
  Popup: React.ComponentType<any>;
  List: React.ComponentType<any>;
  /** Returns the default matcher, so ordinary consumers don't bundle its collator. */
  getDefaultFilter: () => (
    item: any,
    query: string,
    itemToStringLabel?: (item: any) => string,
  ) => boolean;
}

// These are deliberately not a discriminated union on `filter`. `Omit`, `Pick`, and object rest
// all collapse a union into one object type with widened members, which then matches no branch,
// so a typed wrapper like `interface MyProps extends Omit<FilterSelect.Root.Props, 'children'>`
// would not compile.
export interface SelectFilterProps {
  /**
   * Customizes how items match the query. The function receives the `items` entry and the
   * trimmed query.
   */
  filter?: SelectFilter | undefined;
  /**
   * The uncontrolled input value when the select is initially rendered.
   *
   * To render a controlled filter input, use the `inputValue` prop instead.
   * @default ''
   */
  defaultInputValue?: string | undefined;
  /**
   * The input value. Use when controlled.
   */
  inputValue?: string | undefined;
  /**
   * Event handler called when the input value changes.
   */
  onInputValueChange?:
    | ((value: string, eventDetails: SelectRootInputValueChangeEventDetails) => void)
    | undefined;
}

/**
 * The filtering parts plus the filter configuration from the `FilterSelect` root's props. The
 * root feeds it through context so ordinary `Select.Root` carries none of the filter-only props.
 */
export interface SelectFilterConfig extends SelectFilterProps {
  integration: SelectFilterIntegration;
}

export const SelectFilterIntegrationContext = React.createContext<SelectFilterConfig | null>(null);

/**
 * Returns the filter configuration, or `null` for an ordinary select. Its presence is what makes
 * a select filterable, so parts can gate on it directly.
 */
export function useSelectFilterIntegration() {
  return React.useContext(SelectFilterIntegrationContext);
}
