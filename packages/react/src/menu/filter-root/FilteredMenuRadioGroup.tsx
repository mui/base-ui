'use client';
import * as React from 'react';
import { useFilterDropdownGroup } from '../../filter-dropdown/group/useFilterDropdownGroup';
import { FilterDropdownGroupContext } from '../../filter-dropdown/group/FilterDropdownGroupContext';
import {
  MenuRadioGroupPlain,
  type MenuRadioGroup,
  type MenuRadioGroupProps,
  type MenuRadioGroupState,
} from '../radio-group/MenuRadioGroup';

/**
 * Groups related radio items in the filter menu.
 * Renders a `<div>` element.
 */
export const FilteredMenuRadioGroup = React.forwardRef(function FilteredMenuRadioGroup(
  props: FilteredMenuRadioGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { hidden, context } = useFilterDropdownGroup();

  return (
    <FilterDropdownGroupContext.Provider value={context}>
      <MenuRadioGroupPlain
        {...props}
        hidden={hidden || props.hidden || undefined}
        ref={forwardedRef}
      />
    </FilterDropdownGroupContext.Provider>
  );
});

export interface FilteredMenuRadioGroupProps extends Omit<MenuRadioGroupProps, 'onValueChange'> {
  /**
   * Function called when the selected value changes.
   */
  onValueChange?:
    ((value: any, eventDetails: FilteredMenuRadioGroupChangeEventDetails) => void) | undefined;
}

export interface FilteredMenuRadioGroupState extends MenuRadioGroupState {}
export type FilteredMenuRadioGroupChangeEventReason = MenuRadioGroup.ChangeEventReason;
export type FilteredMenuRadioGroupChangeEventDetails = MenuRadioGroup.ChangeEventDetails;

export namespace FilteredMenuRadioGroup {
  export type Props = FilteredMenuRadioGroupProps;
  export type State = FilteredMenuRadioGroupState;
  export type ChangeEventReason = FilteredMenuRadioGroupChangeEventReason;
  export type ChangeEventDetails = FilteredMenuRadioGroupChangeEventDetails;
}
