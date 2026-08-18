'use client';
import * as React from 'react';
import {
  FilterDropdownList,
  type FilterDropdownListProps,
  type FilterDropdownListState,
} from '../../filter-dropdown/list/FilterDropdownList';
import { mergeProps } from '../../merge-props';
import { useFilterMenuReferenceKeyDown } from '../utils/useFilterMenuReferenceKeyDown';
import { useMenuRootContext } from '../../menu/root/MenuRootContext';

export const FilterMenuList = React.forwardRef(function FilterMenuList(
  componentProps: FilterMenuList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const handleReferenceKeyDown = useFilterMenuReferenceKeyDown();
  const { orientation } = useMenuRootContext();
  const props = mergeProps<typeof FilterDropdownList>(
    {
      'aria-orientation': orientation,
      onKeyDown: handleReferenceKeyDown,
    },
    componentProps,
  );

  return <FilterDropdownList {...props} ref={forwardedRef} />;
});

export interface FilterMenuListState extends FilterDropdownListState {}

export interface FilterMenuListProps extends FilterDropdownListProps {}

export namespace FilterMenuList {
  export type Props = FilterMenuListProps;
  export type State = FilterMenuListState;
}
