'use client';
import {
  FilterDropdownEmpty,
  type FilterDropdownEmptyProps,
  type FilterDropdownEmptyState,
} from '../filter-dropdown/empty/FilterDropdownEmpty';

export const FilterSelectEmpty = FilterDropdownEmpty;

export interface FilterSelectEmptyState extends FilterDropdownEmptyState {}
export interface FilterSelectEmptyProps extends FilterDropdownEmptyProps {}

export namespace FilterSelectEmpty {
  export type State = FilterSelectEmptyState;
  export type Props = FilterSelectEmptyProps;
}
