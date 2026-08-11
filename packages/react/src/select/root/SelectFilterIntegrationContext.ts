'use client';
import * as React from 'react';

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

export const SelectFilterIntegrationContext = React.createContext<SelectFilterIntegration | null>(
  null,
);

/**
 * Returns the filtering parts, or `null` for an ordinary select. Its presence is what makes a
 * select filterable, so parts can gate on it directly.
 */
export function useSelectFilterIntegration() {
  return React.useContext(SelectFilterIntegrationContext);
}
