'use client';
import * as React from 'react';
import { FilterDropdown } from '../../filter-dropdown';
import { MenuGroup, type MenuGroupProps } from '../../menu/group/MenuGroup';

export const FilterMenuGroup = React.forwardRef(function FilterMenuGroup(
  props: FilterMenuGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { children, ...menuProps } = props;
  return (
    <FilterDropdown.Group render={<MenuGroup {...menuProps} ref={forwardedRef} />}>
      {children}
    </FilterDropdown.Group>
  );
});

export interface FilterMenuGroupProps extends MenuGroupProps {}

export namespace FilterMenuGroup {
  export type Props = FilterMenuGroupProps;
  export type State = MenuGroup.State;
}
