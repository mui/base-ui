'use client';
import * as React from 'react';
import {
  FilterDropdownEmpty,
  type FilterDropdownEmptyProps,
  type FilterDropdownEmptyState,
} from '../../filter-dropdown/empty/FilterDropdownEmpty';
import { useSelectFilterableRootContext } from '../../select/root/SelectRootContext';

/**
 * Displays when no items match the current filter.
 * Renders a `<div>` element.
 */
export const FilterSelectEmpty = React.forwardRef(function FilterSelectEmpty(
  componentProps: FilterSelectEmpty.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  useSelectFilterableRootContext('Empty');
  return <FilterDropdownEmpty {...componentProps} ref={forwardedRef} />;
});

export interface FilterSelectEmptyState extends FilterDropdownEmptyState {}
export interface FilterSelectEmptyProps extends FilterDropdownEmptyProps {}

export namespace FilterSelectEmpty {
  export type State = FilterSelectEmptyState;
  export type Props = FilterSelectEmptyProps;
}
