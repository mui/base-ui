'use client';
import * as React from 'react';
import {
  FilterDropdownClear,
  type FilterDropdownClearProps,
  type FilterDropdownClearState,
} from '../filter-dropdown/clear/FilterDropdownClear';

export const FilterSelectClear = React.forwardRef(function FilterSelectClear(
  props: FilterSelectClear.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  return <FilterDropdownClear {...props} ref={forwardedRef} />;
});

export interface FilterSelectClearState extends FilterDropdownClearState {}
export interface FilterSelectClearProps extends FilterDropdownClearProps {}

export namespace FilterSelectClear {
  export type State = FilterSelectClearState;
  export type Props = FilterSelectClearProps;
}
