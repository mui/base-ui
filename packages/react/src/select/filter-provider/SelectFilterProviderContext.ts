'use client';
import * as React from 'react';
import type { SelectFilterRoot } from '../filter-root/SelectFilterRoot';
import type { SelectFilterProviderProps } from './SelectFilterProvider';

export type SelectFilterOptions = Omit<SelectFilterProviderProps, 'children'>;

/**
 * What `Select.FilterProvider` hands to the root directly inside it: the filterable root
 * implementation (the provider is its only importer) and the filter props.
 */
export interface SelectFilterProviderContext {
  Root: typeof SelectFilterRoot;
  options: SelectFilterOptions;
}

/** Non-null only directly below a provider. The root that consumes it resets it. */
export const SelectFilterProviderContext = React.createContext<SelectFilterProviderContext | null>(
  null,
);
