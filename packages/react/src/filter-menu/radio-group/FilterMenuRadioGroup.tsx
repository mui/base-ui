'use client';
import * as React from 'react';
import { FilterDropdown } from '../../filter-dropdown';
import { MenuRadioGroup, type MenuRadioGroupProps } from '../../menu/radio-group/MenuRadioGroup';

export const FilterMenuRadioGroup = React.forwardRef(function FilterMenuRadioGroup(
  props: FilterMenuRadioGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { children, ...menuProps } = props;
  return (
    <FilterDropdown.Group render={<MenuRadioGroup {...menuProps} ref={forwardedRef} />}>
      {children}
    </FilterDropdown.Group>
  );
});

export interface FilterMenuRadioGroupProps extends MenuRadioGroupProps {}

export namespace FilterMenuRadioGroup {
  export type Props = FilterMenuRadioGroupProps;
  export type State = MenuRadioGroup.State;
  export type ChangeEventReason = MenuRadioGroup.ChangeEventReason;
  export type ChangeEventDetails = MenuRadioGroup.ChangeEventDetails;
}
