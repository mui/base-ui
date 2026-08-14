'use client';
import * as React from 'react';
import {
  FilterDropdownList,
  type FilterDropdownListProps,
} from '../../filter-dropdown/list/FilterDropdownList';
import type { BaseUIComponentProps } from '../../internals/types';

export const FilterMenuList = React.forwardRef(function FilterMenuList(
  props: FilterMenuList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { id, ...listProps } = props;
  return (
    <FilterDropdownList {...(listProps as FilterDropdownListProps)} id={id} ref={forwardedRef} />
  );
});

export interface FilterMenuListState {}

export interface FilterMenuListProps extends BaseUIComponentProps<'div', FilterMenuListState> {
  id?: string | undefined;
}

export namespace FilterMenuList {
  export type Props = FilterMenuListProps;
  export type State = FilterMenuListState;
}
