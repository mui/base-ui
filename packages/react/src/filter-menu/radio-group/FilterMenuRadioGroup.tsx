'use client';
import * as React from 'react';
import { useFilterDropdownGroup } from '../../filter-dropdown/group/useFilterDropdownGroup';
import { FilterDropdownGroupContext } from '../../filter-dropdown/group/FilterDropdownGroupContext';
import { MenuRadioGroup, type MenuRadioGroupProps } from '../../menu/radio-group/MenuRadioGroup';

export const FilterMenuRadioGroup = React.forwardRef(function FilterMenuRadioGroup(
  props: FilterMenuRadioGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { hidden, context } = useFilterDropdownGroup();

  return (
    <FilterDropdownGroupContext.Provider value={context}>
      <MenuRadioGroup {...props} hidden={hidden || props.hidden || undefined} ref={forwardedRef} />
    </FilterDropdownGroupContext.Provider>
  );
});

export interface FilterMenuRadioGroupProps extends MenuRadioGroupProps {}

export namespace FilterMenuRadioGroup {
  export type Props = FilterMenuRadioGroupProps;
  export type State = MenuRadioGroup.State;
  export type ChangeEventReason = MenuRadioGroup.ChangeEventReason;
  export type ChangeEventDetails = MenuRadioGroup.ChangeEventDetails;
}
