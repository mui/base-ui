'use client';
import * as React from 'react';
import {
  FilterDropdownEmpty,
  type FilterDropdownEmptyProps,
  type FilterDropdownEmptyState,
} from '../filter-dropdown/empty/FilterDropdownEmpty';

export const FilterMenuEmpty = React.forwardRef(function FilterMenuEmpty(
  props: FilterMenuEmpty.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  return <FilterDropdownEmpty {...props} ref={forwardedRef} />;
});

export interface FilterMenuEmptyState extends FilterDropdownEmptyState {}
export interface FilterMenuEmptyProps extends FilterDropdownEmptyProps {}

export namespace FilterMenuEmpty {
  export type State = FilterMenuEmptyState;
  export type Props = FilterMenuEmptyProps;
}
