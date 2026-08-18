'use client';
import {
  FilterDropdownList,
  type FilterDropdownListProps,
  type FilterDropdownListState,
} from '../../filter-dropdown/list/FilterDropdownList';

export const FilterMenuList = FilterDropdownList;

export interface FilterMenuListState extends FilterDropdownListState {}

export interface FilterMenuListProps extends FilterDropdownListProps {}

export namespace FilterMenuList {
  export type Props = FilterMenuListProps;
  export type State = FilterMenuListState;
}
