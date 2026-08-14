'use client';
import * as React from 'react';
import {
  FilterDropdownClear,
  type FilterDropdownClearProps,
  type FilterDropdownClearState,
} from '../filter-dropdown/clear/FilterDropdownClear';

export const FilterMenuClear = React.forwardRef(function FilterMenuClear(
  props: FilterMenuClear.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  return <FilterDropdownClear {...props} ref={forwardedRef} />;
});

export interface FilterMenuClearState extends FilterDropdownClearState {}
export interface FilterMenuClearProps extends FilterDropdownClearProps {}

export namespace FilterMenuClear {
  export type State = FilterMenuClearState;
  export type Props = FilterMenuClearProps;
}
