'use client';
import {
  FilterDropdownEmpty,
  type FilterDropdownEmptyProps,
  type FilterDropdownEmptyState,
} from '../filter-dropdown/empty/FilterDropdownEmpty';

export const FilterMenuEmpty = FilterDropdownEmpty;

export interface FilterMenuEmptyState extends FilterDropdownEmptyState {}
export interface FilterMenuEmptyProps extends FilterDropdownEmptyProps {}

export namespace FilterMenuEmpty {
  export type State = FilterMenuEmptyState;
  export type Props = FilterMenuEmptyProps;
}
