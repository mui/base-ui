'use client';
import * as React from 'react';
import { useFilterDropdownGroup } from '../../filter-dropdown/group/useFilterDropdownGroup';
import { FilterDropdownGroupContext } from '../../filter-dropdown/group/FilterDropdownGroupContext';
import { MenuGroupPlain, type MenuGroupProps, type MenuGroupState } from '../group/MenuGroup';

/**
 * Groups related filter menu items with a corresponding label.
 * Renders a `<div>` element.
 */
export const FilteredMenuGroup = React.forwardRef(function FilteredMenuGroup(
  props: FilteredMenuGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { hidden, context } = useFilterDropdownGroup();

  return (
    <FilterDropdownGroupContext.Provider value={context}>
      <MenuGroupPlain {...props} hidden={hidden || props.hidden || undefined} ref={forwardedRef} />
    </FilterDropdownGroupContext.Provider>
  );
});

export interface FilteredMenuGroupProps extends MenuGroupProps {}
export interface FilteredMenuGroupState extends MenuGroupState {}

export namespace FilteredMenuGroup {
  export type Props = FilteredMenuGroupProps;
  export type State = FilteredMenuGroupState;
}
