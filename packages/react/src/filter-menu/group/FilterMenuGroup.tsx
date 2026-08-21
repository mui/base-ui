'use client';
import * as React from 'react';
import { useFilterDropdownGroup } from '../../filter-dropdown/group/useFilterDropdownGroup';
import { FilterDropdownGroupContext } from '../../filter-dropdown/group/FilterDropdownGroupContext';
import { MenuGroup, type MenuGroupProps, type MenuGroupState } from '../../menu/group/MenuGroup';

/**
 * Groups related filter menu items with a corresponding label.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Filter Menu](https://base-ui.com/react/components/filter-menu)
 */
export const FilterMenuGroup = React.forwardRef(function FilterMenuGroup(
  props: FilterMenuGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { hidden, context } = useFilterDropdownGroup();

  return (
    <FilterDropdownGroupContext.Provider value={context}>
      <MenuGroup {...props} hidden={hidden || props.hidden || undefined} ref={forwardedRef} />
    </FilterDropdownGroupContext.Provider>
  );
});

export interface FilterMenuGroupProps extends MenuGroupProps {}
export interface FilterMenuGroupState extends MenuGroupState {}

export namespace FilterMenuGroup {
  export type Props = FilterMenuGroupProps;
  export type State = FilterMenuGroupState;
}
