'use client';
import * as React from 'react';
import { FilterDropdownList } from '../../filter-dropdown/list/FilterDropdownList';
import type { BaseUIComponentProps } from '../../internals/types';

export const FilterMenuList = React.forwardRef(function FilterMenuList(
  props: FilterMenuList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  return <FilterDropdownList {...props} ref={forwardedRef} />;
});

export interface FilterMenuListState {}

export interface FilterMenuListProps extends BaseUIComponentProps<'div', FilterMenuListState> {
  id?: string | undefined;
}

export namespace FilterMenuList {
  export type Props = FilterMenuListProps;
  export type State = FilterMenuListState;
}
