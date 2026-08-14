'use client';
import * as React from 'react';
import {
  FilterDropdownEmpty,
  type FilterDropdownEmptyProps,
  type FilterDropdownEmptyState,
} from '../filter-dropdown/empty/FilterDropdownEmpty';

export const FilterSelectEmpty = React.forwardRef(function FilterSelectEmpty(
  props: FilterSelectEmpty.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  return <FilterDropdownEmpty {...props} ref={forwardedRef} />;
});

export interface FilterSelectEmptyState extends FilterDropdownEmptyState {}
export interface FilterSelectEmptyProps extends FilterDropdownEmptyProps {}

export namespace FilterSelectEmpty {
  export type State = FilterSelectEmptyState;
  export type Props = FilterSelectEmptyProps;
}
