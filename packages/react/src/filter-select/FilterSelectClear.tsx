'use client';
import {
  FilterDropdownClear,
  type FilterDropdownClearProps,
  type FilterDropdownClearState,
} from '../filter-dropdown/clear/FilterDropdownClear';

export const FilterSelectClear = FilterDropdownClear;

export interface FilterSelectClearState extends FilterDropdownClearState {}
export interface FilterSelectClearProps extends FilterDropdownClearProps {}

export namespace FilterSelectClear {
  export type State = FilterSelectClearState;
  export type Props = FilterSelectClearProps;
}
