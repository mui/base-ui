'use client';
import {
  FilterDropdownClear,
  type FilterDropdownClearProps,
  type FilterDropdownClearState,
} from '../filter-dropdown/clear/FilterDropdownClear';

export const FilterMenuClear = FilterDropdownClear;

export interface FilterMenuClearState extends FilterDropdownClearState {}
export interface FilterMenuClearProps extends FilterDropdownClearProps {}

export namespace FilterMenuClear {
  export type State = FilterMenuClearState;
  export type Props = FilterMenuClearProps;
}
